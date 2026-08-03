import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const HOST = process.env.HOST || (IS_PRODUCTION ? '0.0.0.0' : '127.0.0.1');
const DEMO_MODE = process.env.DEMO_MODE === 'true';

const safeUser = (user: any) => {
  const { password, passwordHash, passwordSalt, recoveryCode, recoveryExpiresAt, ...safe } = user || {};
  return safe;
};

const hashPassword = (password: string, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
};

const verifyPassword = (password: string, user: any) => {
  if (!user?.passwordHash || !user?.passwordSalt) return false;
  const candidate = crypto.scryptSync(password, user.passwordSalt, 64);
  const stored = Buffer.from(user.passwordHash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
};

const validPassword = (password: string) =>
  typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);


app.disable('x-powered-by');
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = String(req.headers.origin || '');
  if (origin && (allowedOrigins.includes(origin) || (!IS_PRODUCTION && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; connect-src 'self' https:; font-src 'self' data: https:; frame-ancestors 'none'");
  }
  next();
});

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
app.use('/api', (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > 180) return res.status(429).json({ error: 'Muitas solicitações. Tente novamente em instantes.' });
  next();
});
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, version: '5.1.0', environment: process.env.NODE_ENV || 'development', auth: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) }));



const SUPABASE_URL = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

type AuthContext = {
  id: string;
  email: string;
  role: 'client' | 'pro' | 'admin';
  profile: any;
  token: string;
};

async function resolveAuth(req: any): Promise<AuthContext | null> {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!authResponse.ok) return null;
  const user = await authResponse.json();
  if (!user?.id) return null;

  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });
  const profiles = profileResponse.ok ? await profileResponse.json().catch(() => []) : [];
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const rawRole = String(profile?.role ?? profile?.tipo ?? user.user_metadata?.role ?? user.user_metadata?.tipo ?? 'client').toLowerCase();
  const role: AuthContext['role'] = rawRole === 'admin' ? 'admin' : ['professional', 'profissional', 'pro'].includes(rawRole) ? 'pro' : 'client';
  return { id: user.id, email: user.email || '', role, profile, token };
}

async function requireUser(req: any, res: any, next: any) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    req.auth = auth;
    next();
  } catch (error) {
    console.error('Falha na autenticação:', error);
    res.status(401).json({ error: 'Não foi possível validar a sessão.' });
  }
}

async function requireAdmin(req: any, res: any, next: any) {
  await requireUser(req, res, () => {
    if (req.auth?.role !== 'admin') return res.status(403).json({ error: 'Acesso exclusivo do administrador.' });
    next();
  });
}

function requireOwnerOrAdmin(idFromBody: (body: any) => string | undefined) {
  return (req: any, res: any, next: any) => requireUser(req, res, () => {
    const targetId = idFromBody(req.body || {});
    if (req.auth?.role !== 'admin' && targetId && targetId !== req.auth?.id) {
      return res.status(403).json({ error: 'Você não pode alterar dados de outro usuário.' });
    }
    next();
  });
}


async function supabaseRequest(token: string, endpoint: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...init,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.msg || data?.error_description || data?.error || `Supabase respondeu ${response.status}.`;
    throw new Error(message);
  }
  return data;
}


async function supabaseServerRequest(endpoint: string, init: RequestInit = {}) {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.');
  return supabaseRequest(SUPABASE_SERVICE_ROLE_KEY, endpoint, init);
}

async function selectTable(token: string, table: string, query = 'select=*') {
  try {
    const result = await supabaseRequest(token, `/rest/v1/${encodeURIComponent(table)}?${query}`, { method: 'GET' });
    return Array.isArray(result) ? result : result ? [result] : [];
  } catch (error) {
    console.warn(`Tabela ${table} indisponível:`, (error as Error).message);
    return [];
  }
}

const normalizeRole = (value: any): 'client' | 'pro' | 'admin' => {
  const role = String(value || 'client').toLowerCase();
  return role === 'admin' ? 'admin' : ['professional', 'profissional', 'pro'].includes(role) ? 'pro' : 'client';
};

function mapProfile(profile: any) {
  const role = normalizeRole(profile?.role ?? profile?.tipo);
  return {
    id: profile.id,
    name: profile.full_name || profile.nome || profile.email?.split('@')[0] || 'Usuário',
    email: profile.email || '',
    phone: profile.phone || profile.telefone || '',
    role,
    avatar: profile.avatar_url || profile.foto_url || '',
    location: [profile.cidade, profile.estado].filter(Boolean).join(', ') || profile.location || 'Brasil',
    latitude: profile.latitude ?? undefined,
    longitude: profile.longitude ?? undefined,
    accountStatus: ['bloqueado', 'blocked'].includes(String(profile.status || '').toLowerCase()) ? 'blocked' : String(profile.status || '').toLowerCase() === 'pendente' ? 'pending_review' : 'active',
    planStatus: profile.plan_status || profile.planStatus || 'active',
    planDueDate: profile.plan_due_date || profile.planDueDate || undefined,
    categories: profile.categories || [],
    bio: profile.bio || profile.biografia || '',
    rating: Number(profile.nota_media || profile.rating || 0),
    ratingsCount: Number(profile.total_avaliacoes || profile.ratings_count || 0)
  };
}

const orderStatusToApp = (status: string) => ({
  rascunho: 'open', aberto: 'open', recebendo_propostas: 'open', contratado: 'in_progress', em_andamento: 'in_progress', concluido: 'completed', cancelado: 'cancelled', disputado: 'in_progress'
} as Record<string, string>)[status] || status || 'open';

async function getProductionState(auth: AuthContext) {
  const token = auth.token;
  const [profiles, categories, orders, proposals, messages, payments, supportTickets, subscriptions] = await Promise.all([
    selectTable(token, 'profiles', 'select=*&order=created_at.desc'),
    selectTable(token, 'categorias', 'select=*&order=nome.asc'),
    selectTable(token, 'pedidos', 'select=*&order=created_at.desc'),
    selectTable(token, 'propostas', 'select=*&order=created_at.desc'),
    selectTable(token, 'mensagens', 'select=*&order=created_at.asc'),
    selectTable(token, 'pagamentos', 'select=*&order=created_at.desc'),
    selectTable(token, 'opc_support_tickets', 'select=*&order=created_at.desc'),
    selectTable(token, 'opc_subscriptions', 'select=*&order=created_at.desc')
  ]);
  const mappedUsers = profiles.map(mapProfile);
  const profileById = new Map(mappedUsers.map((u: any) => [u.id, u]));
  const categoryById = new Map(categories.map((c: any) => [c.id, c]));
  const current = profileById.get(auth.id) || mapProfile({ id: auth.id, email: auth.email, role: auth.role });
  const mappedOrders = orders.map((order: any) => {
    const client: any = profileById.get(order.cliente_id);
    const pro: any = profileById.get(order.profissional_id);
    const category: any = categoryById.get(order.categoria_id);
    const scheduled = order.data_preferida ? `${order.data_preferida}${order.hora_preferida ? `T${order.hora_preferida}` : ''}` : undefined;
    return {
      id: order.id,
      clientId: order.cliente_id,
      clientName: client?.name || 'Cliente',
      clientPhone: client?.phone || '',
      category: category?.nome || order.category || 'Serviço',
      title: order.titulo,
      description: order.descricao,
      location: order.endereco_resumo || [order.cidade, order.estado].filter(Boolean).join(', ') || 'Brasil',
      urgency: order.urgencia || 'media',
      status: orderStatusToApp(order.status),
      createdAt: order.created_at,
      assignedProId: order.profissional_id || undefined,
      assignedProName: pro?.name || undefined,
      latitude: order.latitude ?? undefined,
      longitude: order.longitude ?? undefined,
      scheduledAt: scheduled
    };
  });
  const mappedProposals = proposals.map((proposal: any) => ({
    id: proposal.id,
    orderId: proposal.pedido_id,
    proId: proposal.profissional_id,
    proName: (profileById.get(proposal.profissional_id) as any)?.name || 'Profissional',
    amount: Number(proposal.valor || 0),
    estimatedDays: Number(proposal.prazo_dias || 1),
    message: proposal.descricao || '',
    status: proposal.status === 'aceita' ? 'accepted' : proposal.status === 'recusada' ? 'rejected' : 'pending',
    createdAt: proposal.created_at
  }));
  const mappedMessages = messages.map((message: any) => ({
    id: message.id,
    orderId: message.pedido_id || message.order_id || message.conversa_id,
    conversationId: message.conversa_id,
    senderId: message.remetente_id,
    senderName: (profileById.get(message.remetente_id) as any)?.name || 'Usuário',
    text: message.conteudo || '',
    createdAt: message.created_at
  }));
  const mappedTransactions = payments.map((payment: any) => ({
    id: payment.id,
    proId: payment.profissional_id,
    proName: (profileById.get(payment.profissional_id) as any)?.name || 'Profissional',
    planId: payment.metadata?.planId || 'monthly',
    amount: Number(payment.valor_bruto || 0),
    paymentMethod: payment.metodo || 'pix',
    status: payment.status === 'aprovado' ? 'approved' : payment.status === 'recusado' ? 'rejected' : 'pending',
    createdAt: payment.created_at,
    initPoint: payment.metadata?.initPoint,
    qrCode: payment.metadata?.qrCode
  }));
  return {
    user: current,
    users: auth.role === 'admin' ? mappedUsers : mappedUsers.filter((u: any) => u.role === 'pro' || u.id === auth.id),
    categories: categories.map((c: any) => ({ id: c.id, name: c.nome, icon: c.icone || 'Wrench', description: c.descricao || '', activeProsCount: 0 })),
    orders: mappedOrders,
    proposals: mappedProposals,
    messages: mappedMessages,
    tickets: supportTickets.map((ticket: any) => ({ id: ticket.id, userId: ticket.usuario_id, userName: (profileById.get(ticket.usuario_id) as any)?.name || 'Usuário', userRole: (profileById.get(ticket.usuario_id) as any)?.role || 'client', subject: ticket.assunto, message: ticket.mensagem, reply: ticket.resposta || undefined, status: ticket.status, createdAt: ticket.created_at })),
    transactions: [...mappedTransactions, ...subscriptions.map((sub: any) => ({ id: sub.id, proId: sub.profissional_id, proName: (profileById.get(sub.profissional_id) as any)?.name || 'Profissional', planId: sub.plano, amount: Number(sub.valor || 0), paymentMethod: sub.metadata?.paymentMethod || 'credit_card', status: sub.status === 'active' ? 'approved' : sub.status === 'rejected' ? 'rejected' : 'pending', createdAt: sub.created_at, initPoint: sub.metadata?.initPoint, qrCode: sub.metadata?.qrCode })),],
    config: { mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'CONFIGURADO' : '', pixReceiverKey: '', platformFeePercentage: Number(process.env.PLATFORM_FEE_PERCENTAGE || 10), autoApprovePaymentsSimulated: false },
    plans: [
      { id: 'monthly', title: 'Plano Mensal', price: 50, days: 30, description: 'Acesso completo por 30 dias.', badge: 'Mais Flexível' },
      { id: 'semiannual', title: 'Plano Semestral', price: 200, days: 180, description: 'Seis meses de acesso.', savings: 'Economize R$ 100', badge: 'Mais Popular' },
      { id: 'annual', title: 'Plano Anual', price: 450, days: 365, description: 'Um ano de acesso.', savings: 'Economize R$ 150', badge: 'Melhor Valor', installmentText: '12x de R$ 37,50' }
    ]
  };
}

// In-Memory Database with optional file persistence for local preview
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'conecta_db.json');
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@example.com';
const DEMO_ADMIN_NAME = process.env.DEMO_ADMIN_NAME || 'Administrador de demonstração';
const DEMO_ADMIN_PHONE = process.env.DEMO_ADMIN_PHONE || '';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data
const defaultDb = {
  users: [
    {
      id: 'client-1',
      name: 'Mariana Costa',
      email: 'cliente@gmail.com',
      role: 'client',
      phone: '(11) 99888-7766',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      location: 'São Paulo, SP',
      rating: 4.9,
      ratingsCount: 8,
      clientRating: 4.9,
      clientRatingsCount: 8
    },
    {
      id: 'client-2',
      name: 'Fernando Souza',
      email: 'fernando@souza.com',
      role: 'client',
      phone: '(11) 98111-2233',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      location: 'São Paulo, SP - Moema',
      rating: 5.0,
      ratingsCount: 4,
      clientRating: 5.0,
      clientRatingsCount: 4
    },
    {
      id: 'client-3',
      name: 'Luciana Santos',
      email: 'luciana@santos.com',
      role: 'client',
      phone: '(11) 99222-3344',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      location: 'São Paulo, SP - Jardins',
      rating: 4.8,
      ratingsCount: 5,
      clientRating: 4.8,
      clientRatingsCount: 5
    },
    {
      id: 'client-4',
      name: 'Pedro Henrique',
      email: 'pedro@henrique.com',
      role: 'client',
      phone: '(11) 98555-6677',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      location: 'São Paulo, SP - Tatuapé',
      rating: 4.7,
      ratingsCount: 3,
      clientRating: 4.7,
      clientRatingsCount: 3
    },
    {
      id: 'pro-1',
      name: 'Carlos Eletro & Elétrica',
      email: 'carlos@eletrica.com',
      role: 'pro',
      phone: '(11) 98877-6655',
      categories: ['Eletricista', 'Encanador'],
      planStatus: 'active',
      planDueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Especialista em instalações elétricas residenciais e comerciais com 10 anos de experiência.',
      location: 'São Paulo, SP - Pinheiros',
      rating: 4.9,
      ratingsCount: 142,
      completedJobs: 142
    },
    {
      id: 'pro-2',
      name: 'Roberto Pinturas e Reformas',
      email: 'roberto@pinturas.com',
      role: 'pro',
      phone: '(11) 97766-5544',
      categories: ['Pintor', 'Marcenaria & Móveis'],
      planStatus: 'expired',
      planDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Pintor fino acabamento, texturas, gesso e reformas rápidas sem sujeira.',
      location: 'São Paulo, SP - Moema',
      rating: 4.8,
      ratingsCount: 89,
      completedJobs: 89
    },
    {
      id: 'pro-3',
      name: 'Ana Tech Informática',
      email: 'ana@anatech.com.br',
      role: 'pro',
      phone: '(11) 99111-2233',
      categories: ['Técnico de Informática'],
      planStatus: 'active',
      planDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      bio: 'Reparo de notebooks, PCs gamer, redes de internet e automação residencial.',
      location: 'São Paulo, SP - Tatuapé',
      rating: 5.0,
      ratingsCount: 64,
      completedJobs: 64
    },
    {
      id: 'admin-1',
      name: DEMO_ADMIN_NAME,
      email: DEMO_ADMIN_EMAIL,
      role: 'admin',
      phone: DEMO_ADMIN_PHONE,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  ],
  categories: [
    // 1. Construção, Reformas & Reparos
    { id: 'cat-1', name: 'Eletricista', icon: 'Zap', description: 'Reparos em tomadas, chuveiros, quadros de luz e fiação elétrica.', activeProsCount: 14 },
    { id: 'cat-2', name: 'Encanador', icon: 'Wrench', description: 'Vazamentos, desentupimentos, tubulações e caixas d\'água.', activeProsCount: 9 },
    { id: 'cat-3', name: 'Pintor', icon: 'Paintbrush', description: 'Pintura interna, externa, texturas, massa corrida e grafiato.', activeProsCount: 18 },
    { id: 'cat-5', name: 'Marcenaria & Móveis', icon: 'Hammer', description: 'Montagem de móveis, planejados, conserto de portas e gavetas.', activeProsCount: 7 },
    { id: 'cat-8', name: 'Ar Condicionado', icon: 'Wind', description: 'Instalação, limpeza, carga de gás e manutenção preventiva.', activeProsCount: 12 },
    { id: 'cat-9', name: 'Pedreiro (Reformas & Alvenaria)', icon: 'HardHat', description: 'Reformas gerais, construções, contra-piso, reboco, fundações, muros e assentamentos.', activeProsCount: 22 },
    { id: 'cat-48', name: 'Azulejista & Revestimentos', icon: 'Layers', description: 'Assentamento especializado de porcelanato, azulejos, pisos, pastilhas, rodapés e acabamentos finos.', activeProsCount: 16 },
    { id: 'cat-15', name: 'Calheiro & Telhados', icon: 'Home', description: 'Instalação e manutenção de calhas, rufos, pingadeiras, condutores, coifas, telhados e impermeabilização.', activeProsCount: 14 },
    { id: 'cat-49', name: 'Empreiteiro & Gestão de Obras', icon: 'Building', description: 'Empreitada de obras completas, reformas gerais residenciais e comerciais, coordenação e fornecimento de mão de obra.', activeProsCount: 11 },
    { id: 'cat-50', name: 'Engenheiro Civil & Projetos', icon: 'Compass', description: 'Projetos estruturais, arquitetônicos, laudos técnicos de reforma, emissão de ART/RRT e acompanhamento de obras.', activeProsCount: 13 },
    { id: 'cat-51', name: 'Vendedor e Instalador de Energia Solar', icon: 'Sun', description: 'Dimensionamento, venda de painéis solares, instalação de sistemas fotovoltaicos, inversores e homologação na concessionária.', activeProsCount: 19 },
    { id: 'cat-10', name: 'Gesseiro & Drywall', icon: 'Layers', description: 'Rebaixamento de teto, divisórias, sanca e molduras em gesso.', activeProsCount: 10 },
    { id: 'cat-11', name: 'Vidraceiro & Esquadrias', icon: 'AppWindow', description: 'Box para banheiro, espelhos, janelas, sacadas e vitrines.', activeProsCount: 8 },
    { id: 'cat-12', name: 'Serralheria & Portões', icon: 'Shield', description: 'Grades, portões eletrônicos, estruturas metálicas e solda.', activeProsCount: 11 },
    { id: 'cat-13', name: 'Chaveiro 24h', icon: 'Key', description: 'Abertura de portas, cópias de chave, fechaduras digitais e automotivas.', activeProsCount: 16 },
    { id: 'cat-14', name: 'Tapeçaria & Estofados', icon: 'Sofa', description: 'Reforma de sofás, poltronas, cadeiras de escritório e cabeceiras.', activeProsCount: 6 },

    // 2. Assistência Técnica & Tecnologia
    { id: 'cat-4', name: 'Técnico de Informática', icon: 'Monitor', description: 'Formatação, SSDs, remoção de vírus, wi-fi e suporte remoto.', activeProsCount: 11 },
    { id: 'cat-16', name: 'Conserto de Celulares & Tablets', icon: 'Smartphone', description: 'Troca de tela, baterias, conectores e reparo de placas em geral.', activeProsCount: 19 },
    { id: 'cat-17', name: 'Conserto de Eletrodomésticos', icon: 'Tv', description: 'Manutenção de geladeiras, máquinas de lavar, micro-ondas e fogões.', activeProsCount: 14 },
    { id: 'cat-18', name: 'Câmeras de Segurança & CFTV', icon: 'Camera', description: 'Instalação de câmeras, alarmes, cercas elétricas e monitoramento.', activeProsCount: 13 },
    { id: 'cat-19', name: 'Redes, Wi-Fi & Telecom', icon: 'Wifi', description: 'Cabeamento estruturado, roteadores mesh e amplificadores de sinal.', activeProsCount: 8 },
    { id: 'cat-20', name: 'Desenvolvimento de Sites & Apps', icon: 'Code', description: 'Criação de sites profissionais, lojas virtuais, sistemas e automações.', activeProsCount: 17 },

    // 3. Serviços Domésticos & Limpeza
    { id: 'cat-6', name: 'Limpeza e Diarista', icon: 'Sparkles', description: 'Faxinas residenciais, comerciais e limpeza pós-obra.', activeProsCount: 22 },
    { id: 'cat-21', name: 'Limpeza Pós-Obra & Pesada', icon: 'Broom', description: 'Remoção de entulhos, manchas de tinta, cimento e higienização profunda.', activeProsCount: 12 },
    { id: 'cat-22', name: 'Lavagem de Sofás & Tapetes', icon: 'Droplets', description: 'Higienização a seco, impermeabilização e remoção de ácaros e odores.', activeProsCount: 15 },
    { id: 'cat-23', name: 'Cozinheira & Personal Chef', icon: 'Utensils', description: 'Preparo de marmitas saudáveis, jantares especiais e eventos íntimos.', activeProsCount: 7 },
    { id: 'cat-24', name: 'Babá & Cuidado Infantil', icon: 'Baby', description: 'Profissionais qualificadas para acompanhamento infantil e reforço diário.', activeProsCount: 11 },
    { id: 'cat-25', name: 'Cuidador de Idosos & Enfermagem', icon: 'HeartHandshake', description: 'Acompanhamento de rotina, medicamentos, fisioterapia e cuidados especiais.', activeProsCount: 14 },
    { id: 'cat-26', name: 'Passeador de Cães & Pet Care', icon: 'Dog', description: 'Dog walker, pet sitter, banho e tosa em domicílio e adestramento.', activeProsCount: 18 },
    { id: 'cat-27', name: 'Jardinagem & Paisagismo', icon: 'Trees', description: 'Corte de grama, podas, adubação e projetos de jardins residenciais.', activeProsCount: 10 },
    { id: 'cat-28', name: 'Dedetização & Pragas', icon: 'Bug', description: 'Controle de insetos, ratos, cupins e higienização de caixas d\'água.', activeProsCount: 9 },

    // 4. Eventos, Festas & Gastronomia
    { id: 'cat-29', name: 'Fotografia & Vídeo para Eventos', icon: 'Camera', description: 'Cobertura de casamentos, aniversários, ensaios e vídeos corporativos.', activeProsCount: 16 },
    { id: 'cat-30', name: 'DJ, Som & Iluminação', icon: 'Music', description: 'Sonorização profissional, iluminação cênica e DJs para festas.', activeProsCount: 11 },
    { id: 'cat-31', name: 'Buffet & Salgados', icon: 'Cake', description: 'Salgados artesanais, doces finos, bolos e serviço de buffet completo.', activeProsCount: 14 },
    { id: 'cat-32', name: 'Decoração de Eventos & Florista', icon: 'Gift', description: 'Decoração temática para casamentos, festas infantis e confraternizações.', activeProsCount: 9 },
    { id: 'cat-33', name: 'Garçom & Bartender', icon: 'Wine', description: 'Atendimento de convidados, preparo de drinks artesanais e coquetelaria.', activeProsCount: 12 },
    { id: 'cat-34', name: 'Animação de Festas & Recreação', icon: 'PartyPopper', description: 'Recreadores infantis, mágicos, palhaços e brinquedos infláveis.', activeProsCount: 8 },

    // 5. Aulas, Saúde & Consultoria
    { id: 'cat-35', name: 'Personal Trainer & Fitness', icon: 'Dumbbell', description: 'Acompanhamento presencial ou online, musculação, yoga e pilates.', activeProsCount: 20 },
    { id: 'cat-36', name: 'Aulas Particulares & Reforço', icon: 'GraduationCap', description: 'Matemática, ciências, redação, vestibular e acompanhamento escolar.', activeProsCount: 15 },
    { id: 'cat-37', name: 'Aulas de Idiomas', icon: 'Languages', description: 'Inglês, Espanhol, Francês e Alemão conversacional e para negócios.', activeProsCount: 18 },
    { id: 'cat-38', name: 'Psicologia & Terapia Online', icon: 'Brain', description: 'Atendimento psicológico clínico licenciado com sigilo e acolhimento.', activeProsCount: 24 },
    { id: 'cat-39', name: 'Contabilidade & Declaração de IR', icon: 'Calculator', description: 'Imposto de Renda, abertura de MEI, folha de pagamento e gestão contábil.', activeProsCount: 19 },
    { id: 'cat-40', name: 'Consultoria Jurídica & Advocacia', icon: 'Scale', description: 'Orientação trabalhista, civil, contratual e de direito do consumidor.', activeProsCount: 13 },
    { id: 'cat-41', name: 'Design Gráfico & Marketing Digital', icon: 'Palette', description: 'Logotipos, identidade visual, gestão de redes sociais e tráfego pago.', activeProsCount: 21 },

    // 6. Automotivo & Transporte
    { id: 'cat-7', name: 'Fretes & Mudanças', icon: 'Truck', description: 'Carretas, caminhões pequenos, içamentos, montadores e ajudantes.', activeProsCount: 8 },
    { id: 'cat-42', name: 'Mecânica Automotiva & Socorro 24h', icon: 'Car', description: 'Bateria, elétrica automotiva, troca de óleo, freios e socorro em via.', activeProsCount: 15 },
    { id: 'cat-43', name: 'Guincho & Reboque', icon: 'CarTaxiFront', description: 'Transporte de veículos leves e pesados de emergência ou agendado.', activeProsCount: 11 },
    { id: 'cat-44', name: 'Estética Automotiva & Lavagem', icon: 'Sparkles', description: 'Lavagem a seco, polimento, cristalização e higienização interna.', activeProsCount: 14 },

    // 7. Beleza & Estética
    { id: 'cat-45', name: 'Cabeleireiro & Barber Shop', icon: 'Scissors', description: 'Cortes, coloração, progressiva, barba e tratamentos em domicílio ou salão.', activeProsCount: 23 },
    { id: 'cat-46', name: 'Manicure & Pedicure', icon: 'Hand', description: 'Unhas decoradas, em gel, fibra de vidro e spa dos pés em domicílio.', activeProsCount: 25 },
    { id: 'cat-47', name: 'Maquiagem & Penteado para Festas', icon: 'Smile', description: 'Maquiagem profissional para noivas, formandas, madrinhas e ensaios.', activeProsCount: 17 }
  ],
  orders: <any[]>[
    {
      id: 'ord-099',
      clientId: 'client-2',
      clientName: 'Fernando Souza',
      clientPhone: '(11) 98111-2233',
      category: 'Eletricista',
      title: 'Reparo na fiação do chuveiro elétrico',
      description: 'Chuveiro desligando o disjuntor ao colocar na temperatura máxima. Fiação antiga precisou de revisão.',
      location: 'São Paulo, SP - Moema',
      urgency: 'alta',
      status: 'completed',
      assignedProId: 'pro-1',
      assignedProName: 'Carlos Eletro & Elétrica',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    },
    {
      id: 'ord-100',
      clientId: 'client-1',
      clientName: 'Mariana Costa',
      clientPhone: '(11) 99888-7766',
      category: 'Eletricista',
      title: 'Instalação de refletores LED no jardim',
      description: 'Instalação de 6 projetores LED externos e automação por fotocélula na fachada residencial.',
      location: 'São Paulo, SP - Pinheiros',
      urgency: 'media',
      status: 'completed',
      assignedProId: 'pro-1',
      assignedProName: 'Carlos Eletro & Elétrica',
      clientRating: 5,
      clientRatingComment: 'Excelente cliente! Mariana é super atenciosa, pontual no pagamento e deixou o local liberado e organizado. Recomendo 100%!',
      clientRatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
    },
    {
      id: 'ord-101',
      clientId: 'client-1',
      clientName: 'Mariana Costa',
      clientPhone: '(11) 99888-7766',
      category: 'Eletricista',
      title: 'Instalação de 4 tomadas 220v e quadro de luz',
      description: 'Comprei um forno elétrico novo e preciso converter duas tomadas para 220v na cozinha e revisar o disjuntor principal da sala.',
      location: 'São Paulo, SP - Pinheiros',
      urgency: 'imediato',
      status: 'open',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'ord-102',
      clientId: 'client-2',
      clientName: 'Fernando Souza',
      clientPhone: '(11) 98111-2233',
      category: 'Encanador',
      title: 'Vazamento no cano da pia da cozinha e troca de sifão',
      description: 'O sifão está pingando muito à noite e a água está voltando pelo ralo. Preciso de um encanador experiente para reparo urgente.',
      location: 'São Paulo, SP - Moema',
      urgency: 'alta',
      status: 'open',
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
    },
    {
      id: 'ord-103',
      clientId: 'client-3',
      clientName: 'Luciana Santos',
      clientPhone: '(11) 99222-3344',
      category: 'Pintor',
      title: 'Pintura completa de apartamento de 2 dormitórios (60m²)',
      description: 'Apartamento desocupado, preciso pintar paredes e teto na cor branco neve (tinta Suvinil já comprada).',
      location: 'São Paulo, SP - Jardins',
      urgency: 'media',
      status: 'open',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: 'ord-104',
      clientId: 'client-4',
      clientName: 'Pedro Henrique',
      clientPhone: '(11) 98555-6677',
      category: 'Técnico de Informática',
      title: 'Formatação de Notebook Dell e troca por SSD 1TB',
      description: 'O notebook está demorando 15 minutos para iniciar. Tenho o SSD novo em mãos, preciso de formatação com Windows 11 e backup.',
      location: 'São Paulo, SP - Tatuapé',
      urgency: 'baixa',
      status: 'open',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ],
  proposals: <any[]>[
    { id: 'prop-1', orderId: 'ord-101', proId: 'pro-1', proName: 'Carlos Eletro & Elétrica', amount: 480, estimatedDays: 1, message: 'Inclui materiais básicos, revisão do quadro e garantia de 90 dias.', status: 'pending', createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { id: 'prop-2', orderId: 'ord-101', proId: 'pro-3', proName: 'Ana Tech Informática', amount: 550, estimatedDays: 2, message: 'Visita técnica e execução com emissão de relatório do serviço.', status: 'pending', createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() }
  ],
  messages: <any[]>[
    { id: 'msg-1', orderId: 'ord-101', senderId: 'client-1', senderName: 'Mariana Costa', text: 'Olá! O material já está comprado parcialmente.', createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    { id: 'msg-2', orderId: 'ord-101', senderId: 'pro-1', senderName: 'Carlos Eletro & Elétrica', text: 'Perfeito. Posso verificar o restante na visita.', createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
  ],
  tickets: [
    {
      id: 'tick-1',
      userId: 'pro-2',
      userName: 'Roberto Pinturas e Reformas',
      userRole: 'pro',
      subject: 'Problema com ativação de plano Pix',
      message: 'Olá suporte! Realizei o pagamento via Pix da taxa mensal, mas meu perfil continua aparecendo como Expirado no aplicativo. Podem verificar?',
      status: 'open',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'tick-2',
      userId: 'client-1',
      userName: 'Mariana Costa',
      userRole: 'client',
      subject: 'Como avaliar um profissional?',
      message: 'Gostaria de saber onde fica o botão para dar 5 estrelas para o eletricista que me atendeu ontem.',
      status: 'resolved',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      reply: 'Olá Mariana! Após o profissional marcar a solicitação como concluída no painel dele, o botão "Avaliar Serviço" fica disponível automaticamente na aba Meus Pedidos.'
    }
  ],
  transactions: [
    {
      id: 'trx-901',
      proId: 'pro-1',
      proName: 'Carlos Eletro & Elétrica',
      planId: 'monthly',
      amount: 50.00,
      paymentMethod: 'pix',
      status: 'approved',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'trx-902',
      proId: 'pro-3',
      proName: 'Ana Tech Informática',
      planId: 'semiannual',
      amount: 200.00,
      paymentMethod: 'credit_card',
      status: 'approved',
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    }
  ],
  config: {
    mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    pixReceiverKey: process.env.PIX_RECEIVER_KEY || '',
    pixReceiverName: 'O Profissional Certo',
    pixReceiverBank: 'Mercado Pago / Banco do Brasil',
    pixReceiverCnpjCpf: '45.123.456/0001-89',
    pixInstructions: 'Após o pagamento Pix ou transferência, o sistema realiza a baixa automática na assinatura em até 3 segundos via Webhook.',
    platformFeePercentage: 0,
    autoApprovePaymentsSimulated: true
  }
};

let db: typeof defaultDb;
try {
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    // Ensure config exists and has defaults
    db.config = { ...defaultDb.config, ...(db.config || {}) };
    db.proposals = Array.isArray((db as any).proposals) ? (db as any).proposals : defaultDb.proposals;
    db.messages = Array.isArray((db as any).messages) ? (db as any).messages : defaultDb.messages;
    
    // Keep the local demo administrator configurable without exposing personal data.
    const adminIndex = db.users.findIndex(u => u.role === 'admin' || u.id === 'admin-1' || u.email.toLowerCase() === DEMO_ADMIN_EMAIL.toLowerCase());
    const demoAdmin: any = {
      id: 'admin-1',
      name: DEMO_ADMIN_NAME,
      email: DEMO_ADMIN_EMAIL,
      role: 'admin',
      phone: DEMO_ADMIN_PHONE,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
    if (adminIndex !== -1) {
      db.users[adminIndex] = { ...db.users[adminIndex], ...demoAdmin };
    } else {
      db.users.push(demoAdmin);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } else {
    db = defaultDb;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
} catch (err) {
  db = defaultDb;
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving db:', err);
  }
}

// Middleware to check plan expirations
function validateProPlans() {
  const now = new Date();
  let changed = false;
  db.users.forEach(u => {
    if (u.role === 'pro' && u.planDueDate) {
      if (now > new Date(u.planDueDate)) {
        if (u.planStatus !== 'expired') {
          u.planStatus = 'expired';
          changed = true;
        }
      } else {
        if (u.planStatus !== 'active') {
          u.planStatus = 'active';
          changed = true;
        }
      }
    }
  });
  if (changed) saveDb();
}

// --- API ROUTES ---

// 1. GET ALL STATE (with role-based order sanitation)
app.get('/api/state', requireUser, async (req: any, res) => {
  if (!DEMO_MODE) {
    try { return res.json(await getProductionState(req.auth)); }
    catch (error) {
      console.error('Falha ao carregar dados do Supabase:', error);
      return res.status(502).json({ error: 'Não foi possível carregar os dados de produção no Supabase.' });
    }
  }
  validateProPlans();
  const requestedUserId = req.query.userId as string;
  const authRole = req.auth?.role || 'client';
  const mappedDemoId = authRole === 'admin' ? 'admin-1' : authRole === 'pro' ? 'pro-1' : 'client-1';
  const userId = (DEMO_MODE && req.auth?.role === 'admin' && requestedUserId) ? requestedUserId : mappedDemoId;
  const user = db.users.find(u => u.id === userId) || db.users.find(u => u.id === mappedDemoId) || db.users[0];

  // Sanitize orders for Pros with expired plans
  const sanitizedOrders = db.orders.map(order => {
    const orderCopy = { ...order };
    if (user.role === 'pro') {
      if (user.planStatus === 'expired') {
        orderCopy.clientPhone = '⚠️ BLOQUEADO - RENOVE O PLANO PARA VER';
      }
    }
    return orderCopy;
  });

  res.json({
    user,
    users: req.auth?.role === 'admin' ? db.users.map(safeUser) : db.users.filter((u: any) => u.role === 'pro' || u.id === user.id).map(safeUser),
    categories: db.categories,
    orders: sanitizedOrders,
    proposals: db.proposals || [],
    messages: db.messages || [],
    tickets: db.tickets,
    transactions: db.transactions,
    config: { ...db.config, mercadoPagoAccessToken: db.config.mercadoPagoAccessToken ? 'CONFIGURADO' : '' },
    plans: [
      { id: 'monthly', title: 'Plano Mensal', price: 50.00, days: 30, description: 'Acesso completo às solicitações de clientes por 30 dias.', badge: 'Mais Flexível' },
      { id: 'semiannual', title: 'Plano Semestral', price: 200.00, days: 180, description: 'Economize R$ 100,00! 6 meses de acesso ininterrupto.', savings: 'Economize R$ 100', badge: 'Mais Popular' },
      { id: 'annual', title: 'Plano Anual', price: 450.00, days: 365, description: 'O menor custo por mês (R$ 37,50/mês). Parcele em até 12x no cartão.', savings: 'Economize R$ 150', badge: 'Melhor Valor', installmentText: '12x de R$ 37,50' }
    ]
  });
});

// 2. AUTH / USER SWITCH / LOGIN
app.post('/api/auth/switch', (req, res) => {
  if (!DEMO_MODE) return res.status(404).json({ error: 'Modo demonstrativo desativado.' });
  const { userId } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  res.json({ success: true, user });
});

app.post('/api/auth/login', (req, res) => {
  if (!DEMO_MODE) return res.status(404).json({ error: 'Login local desativado. Use a autenticação do Supabase.' });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Informe o e-mail e a senha.' });
  const cleanEmail = String(email).trim().toLowerCase();
  const user: any = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail || (cleanEmail === 'admin' && u.role === 'admin'));
  if (!user || !verifyPassword(String(password), user)) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }
  user.lastLoginAt = new Date().toISOString();
  saveDb();
  res.json({ success: true, user: safeUser(user) });
});

app.post('/api/auth/register', (req, res) => {
  if (!DEMO_MODE) return res.status(404).json({ error: 'Cadastro local desativado. Use a autenticação do Supabase.' });
  const { name, email, password, role, phone, categories, bio } = req.body;
  if (!name || !email || !password || !['client', 'pro'].includes(role)) {
    return res.status(400).json({ error: 'Preencha nome, e-mail, senha e tipo de conta.' });
  }
  if (!validPassword(password)) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres, com letras e números.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  if (db.users.some((u: any) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }
  const secured = hashPassword(password);
  const newId = `${role}-${Date.now().toString().slice(-6)}`;
  const newUser: any = {
    id: newId, name: String(name).trim(), email: cleanEmail,
    passwordHash: secured.hash, passwordSalt: secured.salt,
    role, phone: phone || '', avatar: '', location: 'São Paulo, SP',
    createdAt: new Date().toISOString(), accountStatus: role === 'pro' ? 'pending_review' : 'active'
  };
  if (role === 'pro') {
    newUser.categories = Array.isArray(categories) && categories.length ? categories : ['Eletricista'];
    newUser.planStatus = 'expired';
    newUser.planDueDate = new Date(Date.now() - 1000).toISOString();
    newUser.bio = bio || 'Profissional cadastrado na plataforma.';
    newUser.rating = 5.0; newUser.completedJobs = 0;
  }
  db.users.push(newUser); saveDb();
  res.json({ success: true, user: safeUser(newUser) });
});

app.post('/api/auth/recover-password', (req, res) => {
  if (!DEMO_MODE) return res.status(404).json({ error: 'Recuperação local desativada. Use o Supabase.' });
  const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
  const user: any = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail);
  // Resposta neutra evita revelar se um e-mail está cadastrado.
  if (!user) return res.json({ success: true, message: 'Se o e-mail estiver cadastrado, um código será gerado.' });
  const code = crypto.randomInt(100000, 1000000).toString();
  user.recoveryCode = code;
  user.recoveryExpiresAt = Date.now() + 10 * 60 * 1000;
  saveDb();
  if (IS_PRODUCTION) {
    console.log(`[RECUPERACAO] Código para ${user.email}: ${code}`);
    return res.json({ success: true, message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });
  }
  res.json({ success: true, message: 'Código gerado para o modo de teste local.', code, userEmail: user.email });
});

app.post('/api/auth/reset-password', (req, res) => {
  if (!DEMO_MODE) return res.status(404).json({ error: 'Redefinição local desativada. Use o Supabase.' });
  const { email, code, newPassword } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user: any = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail);
  if (!user || !code || user.recoveryCode !== String(code) || Date.now() > Number(user.recoveryExpiresAt || 0)) {
    return res.status(400).json({ error: 'Código inválido ou expirado.' });
  }
  if (!validPassword(newPassword)) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres, com letras e números.' });
  }
  const secured = hashPassword(newPassword);
  user.passwordHash = secured.hash; user.passwordSalt = secured.salt;
  delete user.password; delete user.recoveryCode; delete user.recoveryExpiresAt;
  saveDb();
  res.json({ success: true, message: 'Senha atualizada com sucesso.' });
});

app.post('/api/users/update-profile', requireOwnerOrAdmin((b) => b.id || b.userId), async (req: any, res) => {
  const { userId, name, phone, bio, avatar, location, categories, password } = req.body;
  if (!DEMO_MODE) {
    try {
      const targetId = req.auth.role === 'admin' && userId ? userId : req.auth.id;
      const [cidade, estado] = String(location || '').split(',').map((v: string) => v.trim());
      const payload: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) { payload.full_name = name; payload.nome = name; }
      if (phone !== undefined) { payload.phone = phone; payload.telefone = phone; }
      if (avatar !== undefined) { payload.avatar_url = avatar; payload.foto_url = avatar; }
      if (cidade) payload.cidade = cidade;
      if (estado) payload.estado = estado;
      await supabaseRequest(req.auth.token, `/rest/v1/profiles?id=eq.${encodeURIComponent(targetId)}`, { method: 'PATCH', body: JSON.stringify(payload) });
      if (bio !== undefined || categories !== undefined) {
        const proPayload: any = { user_id: targetId, updated_at: new Date().toISOString() };
        if (bio !== undefined) proPayload.biografia = bio;
        await supabaseRequest(req.auth.token, '/rest/v1/profissionais?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(proPayload) });
      }
      return res.json({ success: true });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (bio) user.bio = bio;
  if (avatar) user.avatar = avatar;
  if (location) user.location = location;
  if (password) {
    if (!validPassword(password)) return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres, com letras e números.' });
    const secured = hashPassword(password);
    (user as any).passwordHash = secured.hash;
    (user as any).passwordSalt = secured.salt;
    delete (user as any).password;
  }
  if (user.role === 'pro' && Array.isArray(categories)) {
    user.categories = categories.length > 0 ? categories : ['Eletricista'];
  }

  saveDb();
  res.json({ success: true, user: safeUser(user) });
});

app.post('/api/users/update-categories', requireOwnerOrAdmin((b) => b.userId), (req: any, res) => {
  const { userId, categories } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  if (user.role === 'pro') {
    user.categories = Array.isArray(categories) && categories.length > 0 ? categories : ['Eletricista'];
    saveDb();
  }
  res.json({ success: true, user });
});

// 3. SERVICES (CREATE & ACT)
app.post('/api/services/create', requireUser, async (req: any, res) => {
  const { clientId, category, title, description, location, urgency, phone, latitude, longitude, scheduledAt, attachments } = req.body;
  if (!DEMO_MODE) {
    try {
      if (req.auth.role !== 'client' && req.auth.role !== 'admin') return res.status(403).json({ error: 'Somente clientes podem solicitar serviços.' });
      const client = req.auth.role === 'admin' && clientId ? clientId : req.auth.id;
      const categories = await selectTable(req.auth.token, 'categorias', `select=id,nome&nome=eq.${encodeURIComponent(category || '')}&limit=1`);
      const date = scheduledAt ? new Date(scheduledAt) : null;
      const payload = {
        cliente_id: client,
        categoria_id: categories[0]?.id || null,
        titulo: title || 'Solicitação de serviço',
        descricao: description || '',
        status: 'aberto',
        endereco_resumo: location || '',
        cidade: String(location || '').split(',')[0]?.trim() || null,
        estado: String(location || '').split(',')[1]?.trim() || null,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        data_preferida: date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null,
        hora_preferida: date && !Number.isNaN(date.getTime()) ? date.toTimeString().slice(0, 8) : null
      };
      const created = await supabaseRequest(req.auth.token, '/rest/v1/pedidos', { method: 'POST', body: JSON.stringify(payload) });
      return res.json({ success: true, order: Array.isArray(created) ? created[0] : created });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const client = db.users.find(u => u.id === clientId) || db.users[0];

  const newOrder = {
    id: `ord-${Math.floor(100 + Math.random() * 900)}`,
    clientId: client.id,
    clientName: client.name,
    clientPhone: phone || client.phone || '(11) 99999-9999',
    category: category || 'Eletricista',
    title: title || 'Solicitação de Serviço',
    description: description || 'Descrição do trabalho a ser realizado.',
    location: location || 'São Paulo, SP',
    urgency: urgency || 'media',
    status: 'open' as const,
    latitude: typeof latitude === 'number' ? latitude : undefined,
    longitude: typeof longitude === 'number' ? longitude : undefined,
    scheduledAt: scheduledAt || undefined,
    attachments: Array.isArray(attachments) ? attachments.slice(0, 4) : [],
    createdAt: new Date().toISOString()
  };

  if (typeof latitude === 'number' && typeof longitude === 'number') { (client as any).latitude = latitude; (client as any).longitude = longitude; }
  db.orders.unshift(newOrder);
  saveDb();
  res.json({ success: true, order: newOrder });
});

app.post('/api/services/status', requireUser, async (req: any, res) => {
  const { orderId, status, proId, proName } = req.body;
  if (!DEMO_MODE) {
    try {
      const statusMap: Record<string, string> = { open: 'aberto', in_progress: 'em_andamento', completed: 'concluido', cancelled: 'cancelado' };
      const payload: any = { status: statusMap[status] || status, updated_at: new Date().toISOString() };
      if (req.auth.role === 'pro') payload.profissional_id = req.auth.id;
      await supabaseRequest(req.auth.token, `/rest/v1/pedidos?id=eq.${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify(payload) });
      return res.json({ success: true });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (req.auth.role === 'client' && !['cancelled', 'completed'].includes(String(status))) {
    return res.status(403).json({ error: 'Cliente não pode aplicar esse status.' });
  }

  order.status = status;
  if (proId) {
    order.assignedProId = proId;
    order.assignedProName = proName;
  }
  saveDb();
  res.json({ success: true, order });
});

app.post('/api/services/rate-client', requireUser, (req: any, res) => {
  const { orderId, proId, rating, comment } = req.body;
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5 estrelas' });
  }

  order.clientRating = numRating;
  order.clientRatingComment = comment || '';
  order.clientRatedAt = new Date().toISOString();

  // Find client and recalculate average rating
  const client = db.users.find(u => u.id === order.clientId);
  if (client) {
    const ratedOrders = db.orders.filter(o => o.clientId === client.id && typeof o.clientRating === 'number' && o.clientRating > 0);
    const totalCount = ratedOrders.length;
    const totalSum = ratedOrders.reduce((acc, o) => acc + (o.clientRating || 0), 0);
    
    if (totalCount > 0) {
      const avg = Number((totalSum / totalCount).toFixed(1));
      client.clientRating = avg;
      client.clientRatingsCount = totalCount;
      client.rating = avg;
      client.ratingsCount = totalCount;
    }
  }

  saveDb();
  res.json({ success: true, order, client });
});


// 3.1 PROPOSTAS E CHAT DE NEGOCIAÇÃO
app.post('/api/proposals/create', requireUser, async (req: any, res) => {
  if (req.auth.role !== 'pro' && req.auth.role !== 'admin') return res.status(403).json({ error: 'Somente profissionais podem enviar propostas.' });
  const { orderId, amount, estimatedDays, message } = req.body;
  if (!DEMO_MODE) {
    try {
      const proId = req.auth.role === 'admin' && req.body.proId ? req.body.proId : req.auth.id;
      const payload = { pedido_id: orderId, profissional_id: proId, valor: Number(amount), prazo_dias: Number(estimatedDays) || 1, descricao: message || 'Proposta enviada pelo aplicativo.', status: 'em_analise' };
      const created = await supabaseRequest(req.auth.token, '/rest/v1/propostas?on_conflict=pedido_id,profissional_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(payload) });
      return res.json({ success: true, proposal: Array.isArray(created) ? created[0] : created });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const proId = req.auth.role === 'admin' && req.body.proId ? req.body.proId : 'pro-1';
  const order = db.orders.find(o => o.id === orderId);
  const pro = db.users.find(u => u.id === proId && u.role === 'pro');
  if (!order || !pro) return res.status(404).json({ error: 'Pedido ou profissional não encontrado' });
  const proposal = {
    id: `prop-${Date.now()}`,
    orderId,
    proId,
    proName: pro.name,
    amount: Number(amount) || 0,
    estimatedDays: Number(estimatedDays) || 1,
    message: message || 'Tenho disponibilidade para realizar este serviço.',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.proposals = (db.proposals || []).filter((p: any) => !(p.orderId === orderId && p.proId === proId));
  db.proposals.unshift(proposal);
  saveDb();
  res.json({ success: true, proposal });
});

app.post('/api/proposals/accept', requireUser, async (req: any, res) => {
  if (req.auth.role !== 'client' && req.auth.role !== 'admin') return res.status(403).json({ error: 'Somente o cliente pode aceitar propostas.' });
  const { proposalId } = req.body;
  if (!DEMO_MODE) {
    try {
      const result = await supabaseRequest(req.auth.token, '/rest/v1/rpc/aceitar_proposta', { method: 'POST', body: JSON.stringify({ proposta_uuid: proposalId }) });
      return res.json({ success: true, contract: result });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const clientId = req.auth.role === 'admin' && req.body.clientId ? req.body.clientId : 'client-1';
  const proposal = (db.proposals || []).find((p: any) => p.id === proposalId);
  if (!proposal) return res.status(404).json({ error: 'Proposta não encontrada' });
  const order = db.orders.find(o => o.id === proposal.orderId && o.clientId === clientId);
  if (!order) return res.status(403).json({ error: 'Cliente não autorizado para este pedido' });
  (db.proposals || []).forEach((p: any) => { if (p.orderId === order.id) p.status = p.id === proposalId ? 'accepted' : 'rejected'; });
  order.status = 'in_progress';
  order.assignedProId = proposal.proId;
  order.assignedProName = proposal.proName;
  saveDb();
  res.json({ success: true, proposal, order });
});

app.post('/api/messages/send', requireUser, async (req: any, res) => {
  const { orderId, text } = req.body;
  if (!DEMO_MODE) {
    try {
      if (!text?.trim()) return res.status(400).json({ error: 'Mensagem inválida.' });
      let conversations = await selectTable(req.auth.token, 'conversas', `select=*&pedido_id=eq.${encodeURIComponent(orderId)}&limit=1`);
      let conversation = conversations[0];
      if (!conversation) {
        const orders = await selectTable(req.auth.token, 'pedidos', `select=cliente_id,profissional_id&id=eq.${encodeURIComponent(orderId)}&limit=1`);
        const order = orders[0];
        if (!order?.cliente_id || !order?.profissional_id) return res.status(400).json({ error: 'O chat é liberado após a contratação.' });
        const created = await supabaseRequest(req.auth.token, '/rest/v1/conversas', { method: 'POST', body: JSON.stringify({ pedido_id: orderId, cliente_id: order.cliente_id, profissional_id: order.profissional_id }) });
        conversation = Array.isArray(created) ? created[0] : created;
      }
      const createdMessage = await supabaseRequest(req.auth.token, '/rest/v1/mensagens', { method: 'POST', body: JSON.stringify({ conversa_id: conversation.id, remetente_id: req.auth.id, conteudo: text.trim() }) });
      return res.json({ success: true, message: Array.isArray(createdMessage) ? createdMessage[0] : createdMessage });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const senderId = req.auth.role === 'admin' && req.body.senderId ? req.body.senderId : (req.auth.role === 'pro' ? 'pro-1' : 'client-1');
  const sender = db.users.find(u => u.id === senderId);
  if (!sender || !text?.trim()) return res.status(400).json({ error: 'Mensagem inválida' });
  const msg = { id: `msg-${Date.now()}`, orderId, senderId, senderName: sender.name, text: text.trim(), createdAt: new Date().toISOString() };
  db.messages = db.messages || [];
  db.messages.push(msg);
  saveDb();
  res.json({ success: true, message: msg });
});

// 4. MERCADO PAGO / SUBSCRIPTION BILLING MODULE
app.post('/api/payment/create-checkout', requireUser, async (req: any, res) => {
  if (req.auth.role !== 'pro' && req.auth.role !== 'admin') return res.status(403).json({ error: 'Plano disponível somente para profissionais.' });
  const { planType, paymentMethod } = req.body;
  if (!DEMO_MODE) {
    try {
      const accessToken = String(process.env.MERCADO_PAGO_ACCESS_TOKEN || '');
      if (!accessToken) return res.status(503).json({ error: 'Mercado Pago ainda não foi ativado no servidor.' });
      const plansMap: Record<string, { amount: number; days: number; title: string }> = {
        monthly: { amount: 50, days: 30, title: 'Plano Mensal' },
        semiannual: { amount: 200, days: 180, title: 'Plano Semestral' },
        annual: { amount: 450, days: 365, title: 'Plano Anual' }
      };
      const selected = plansMap[planType] || plansMap.monthly;
      const proId = req.auth.role === 'admin' && req.body.proId ? req.body.proId : req.auth.id;
      const externalReference = `${proId}|${planType}|${Date.now()}`;
      const publicUrl = String(process.env.PUBLIC_APP_URL || `http://${HOST}:${PORT}`).replace(/\/$/, '');
      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          items: [{ id: planType, title: `${selected.title} — O Profissional Certo`, quantity: 1, currency_id: 'BRL', unit_price: selected.amount }],
          payer: { email: req.auth.email },
          external_reference: externalReference,
          notification_url: `${publicUrl}/api/payment/webhook`,
          back_urls: { success: `${publicUrl}/?payment=success`, pending: `${publicUrl}/?payment=pending`, failure: `${publicUrl}/?payment=failure` },
          auto_return: 'approved',
          payment_methods: paymentMethod === 'pix' ? { default_payment_method_id: 'pix' } : undefined,
          metadata: { profissional_id: proId, plano: planType, dias: selected.days }
        })
      });
      const preference = await mpResponse.json();
      if (!mpResponse.ok) throw new Error(preference?.message || 'Falha ao criar pagamento no Mercado Pago.');
      const subscription = await supabaseServerRequest('/rest/v1/opc_subscriptions', {
        method: 'POST',
        body: JSON.stringify({ profissional_id: proId, plano: planType, status: 'pending', valor: selected.amount, mercado_pago_preference_id: preference.id, metadata: { paymentMethod, initPoint: preference.init_point, externalReference, days: selected.days } })
      });
      return res.json({ success: true, transaction: Array.isArray(subscription) ? subscription[0] : subscription, initPoint: preference.init_point, externalRef: externalReference });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const proId = req.auth.role === 'admin' && req.body.proId ? req.body.proId : 'pro-1';
  const pro = db.users.find(u => u.id === proId);
  if (!pro) return res.status(404).json({ error: 'Profissional não encontrado' });

  const plansMap: Record<string, { amount: number; days: number; title: string }> = {
    monthly: { amount: 50.00, days: 30, title: 'Plano Mensal (30 dias)' },
    semiannual: { amount: 200.00, days: 180, title: 'Plano Semestral (180 dias)' },
    annual: { amount: 450.00, days: 365, title: 'Plano Anual (365 dias)' }
  };

  const selectedPlan = plansMap[planType] || plansMap.monthly;
  const trxId = `pix-${Date.now().toString().slice(-6)}`;

  // Create pending transaction
  const newTrx = {
    id: trxId,
    proId: pro.id,
    proName: pro.name,
    planId: planType as any,
    amount: selectedPlan.amount,
    paymentMethod: paymentMethod || 'pix',
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    qrCode: `00020126580014br.gov.bcb.pix0136${db.config.pixReceiverKey}5204000053039865405${selectedPlan.amount.toFixed(2)}5802BR5915Profissional Certo6009Sao Paulo62240520CONECTA${trxId}6304E1F2`,
    initPoint: `https://mercadopago.com.br/checkout/v1/redirect?pref_id=${trxId}`
  };

  db.transactions.unshift(newTrx);
  saveDb();

  res.json({
    success: true,
    transaction: newTrx,
    qrCode: newTrx.qrCode,
    initPoint: newTrx.initPoint,
    externalRef: `${pro.id}|${selectedPlan.days}|${newTrx.id}`
  });
});

// Mercado Pago webhook. O status é sempre confirmado consultando a API oficial.
app.post('/api/payment/webhook', async (req: any, res) => {
  res.status(200).json({ received: true });
  try {
    const accessToken = String(process.env.MERCADO_PAGO_ACCESS_TOKEN || '');
    if (!accessToken || !SUPABASE_SERVICE_ROLE_KEY) return;
    const paymentId = String(req.query?.['data.id'] || req.body?.data?.id || req.body?.id || '');
    if (!paymentId) return;
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!paymentResponse.ok) return;
    const payment: any = await paymentResponse.json();
    const eventId = String(req.headers['x-request-id'] || req.body?.id || `${paymentId}:${payment.status}`);
    await supabaseServerRequest('/rest/v1/opc_payment_events?on_conflict=provider,provider_event_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ provider: 'mercado_pago', provider_event_id: eventId, payment_id: paymentId, payload: payment, processed: true })
    });
    const proId = payment.metadata?.profissional_id || String(payment.external_reference || '').split('|')[0];
    const plan = payment.metadata?.plano || String(payment.external_reference || '').split('|')[1] || 'monthly';
    const days = Number(payment.metadata?.dias || ({ monthly: 30, semiannual: 180, annual: 365 } as any)[plan] || 30);
    const approved = payment.status === 'approved';
    const status = approved ? 'active' : payment.status === 'rejected' ? 'rejected' : 'pending';
    if (proId) {
      const subscriptions: any[] = await supabaseServerRequest(`/rest/v1/opc_subscriptions?profissional_id=eq.${encodeURIComponent(proId)}&mercado_pago_preference_id=eq.${encodeURIComponent(payment.preference_id || '')}&select=*&limit=1`, { method: 'GET' });
      const subscription = subscriptions?.[0];
      const startsAt = approved ? new Date() : null;
      const expiresAt = approved ? new Date(Date.now() + days * 86400000) : null;
      if (subscription?.id) {
        await supabaseServerRequest(`/rest/v1/opc_subscriptions?id=eq.${encodeURIComponent(subscription.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, mercado_pago_payment_id: paymentId, inicia_em: startsAt?.toISOString(), vence_em: expiresAt?.toISOString(), updated_at: new Date().toISOString() })
        });
      }
    }
  } catch (error) {
    console.error('Falha ao processar webhook Mercado Pago:', error);
  }
});

// Webhook simulation / Instant Approval
app.post('/api/payment/simulate-pay', requireAdmin, (req: any, res) => {
  if (!DEMO_MODE || IS_PRODUCTION) return res.status(404).json({ error: 'Simulação de pagamento desativada.' });
  const { transactionId, proId, daysToAdd } = req.body;
  const pro = db.users.find(u => u.id === proId);
  const trx = db.transactions.find(t => t.id === transactionId);

  if (pro) {
    let currentDueDate = new Date();
    if (pro.planDueDate && new Date(pro.planDueDate) > new Date()) {
      currentDueDate = new Date(pro.planDueDate);
    }
    currentDueDate.setDate(currentDueDate.getDate() + (daysToAdd || 30));

    pro.planStatus = 'active';
    pro.planDueDate = currentDueDate.toISOString();
  }

  if (trx) {
    trx.status = 'approved';
  }

  saveDb();
  res.json({ success: true, pro, transaction: trx });
});

// 5. ADMIN MANAGEMENT
app.post('/api/admin/users/update-plan', requireAdmin, async (req: any, res) => {
  const { targetUserId, daysToAdd, forceStatus } = req.body;
  if (!DEMO_MODE) {
    try {
      const active = await selectTable(req.auth.token, 'opc_subscriptions', `select=*&profissional_id=eq.${encodeURIComponent(targetUserId)}&order=created_at.desc&limit=1`);
      const current = active[0];
      const start = current?.vence_em && new Date(current.vence_em) > new Date() ? new Date(current.vence_em) : new Date();
      if (daysToAdd) start.setDate(start.getDate() + Number(daysToAdd));
      const payload: any = { profissional_id: targetUserId, plano: current?.plano || 'monthly', valor: Number(current?.valor || 0), status: forceStatus === 'expired' ? 'expired' : 'active', inicia_em: current?.inicia_em || new Date().toISOString(), vence_em: forceStatus === 'expired' ? new Date(Date.now() - 1000).toISOString() : start.toISOString(), metadata: { manualAdminUpdate: true } };
      const result = await supabaseServerRequest('/rest/v1/opc_subscriptions', { method: 'POST', body: JSON.stringify(payload) });
      return res.json({ success: true, subscription: Array.isArray(result) ? result[0] : result });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const pro = db.users.find(u => u.id === targetUserId);
  if (!pro) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (forceStatus) {
    pro.planStatus = forceStatus;
    if (forceStatus === 'expired') {
      pro.planDueDate = new Date(Date.now() - 1000).toISOString();
    } else if (forceStatus === 'active' && (!pro.planDueDate || new Date(pro.planDueDate) < new Date())) {
      pro.planDueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    }
  } else if (daysToAdd) {
    let currentDueDate = new Date();
    if (pro.planDueDate && new Date(pro.planDueDate) > new Date()) {
      currentDueDate = new Date(pro.planDueDate);
    }
    currentDueDate.setDate(currentDueDate.getDate() + daysToAdd);
    pro.planStatus = 'active';
    pro.planDueDate = currentDueDate.toISOString();
  }

  saveDb();
  res.json({ success: true, user: pro });
});

app.post('/api/admin/categories', requireAdmin, async (req: any, res) => {
  const { action, categoryId, name, icon, description } = req.body;
  if (!DEMO_MODE) {
    try {
      if (action === 'create') await supabaseRequest(req.auth.token, '/rest/v1/categorias', { method: 'POST', body: JSON.stringify({ nome: name, icone: icon || 'Wrench', descricao: description || 'Categoria de serviço', ativo: true }) });
      else if (action === 'delete') await supabaseRequest(req.auth.token, `/rest/v1/categorias?id=eq.${encodeURIComponent(categoryId)}`, { method: 'DELETE' });
      const categories = await selectTable(req.auth.token, 'categorias', 'select=*&order=nome.asc');
      return res.json({ success: true, categories });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  if (action === 'create') {
    const newCat = {
      id: `cat-${Date.now().toString().slice(-4)}`,
      name,
      icon: icon || 'Wrench',
      description: description || 'Categoria de serviço',
      activeProsCount: 0
    };
    db.categories.push(newCat);
  } else if (action === 'delete') {
    db.categories = db.categories.filter(c => c.id !== categoryId);
  }
  saveDb();
  res.json({ success: true, categories: db.categories });
});

app.post('/api/admin/config', requireAdmin, (req: any, res) => {
  const {
    mercadoPagoAccessToken,
    pixReceiverKey,
    pixReceiverName,
    pixReceiverBank,
    pixReceiverCnpjCpf,
    pixInstructions
  } = req.body;
  if (mercadoPagoAccessToken !== undefined && !IS_PRODUCTION) db.config.mercadoPagoAccessToken = mercadoPagoAccessToken;
  if (pixReceiverKey !== undefined) db.config.pixReceiverKey = pixReceiverKey;
  if (pixReceiverName !== undefined) db.config.pixReceiverName = pixReceiverName;
  if (pixReceiverBank !== undefined) db.config.pixReceiverBank = pixReceiverBank;
  if (pixReceiverCnpjCpf !== undefined) db.config.pixReceiverCnpjCpf = pixReceiverCnpjCpf;
  if (pixInstructions !== undefined) db.config.pixInstructions = pixInstructions;
  saveDb();
  res.json({ success: true, config: { ...db.config, mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'CONFIGURADO' : '' } });
});

// 6. SUPPORT TICKETS
app.post('/api/support/create', requireUser, async (req: any, res) => {
  const { subject, message } = req.body;
  if (!DEMO_MODE) {
    try {
      const result = await supabaseRequest(req.auth.token, '/rest/v1/opc_support_tickets', { method: 'POST', body: JSON.stringify({ usuario_id: req.auth.id, assunto: subject || 'Ajuda com a plataforma', mensagem: message || '', status: 'open' }) });
      return res.json({ success: true, ticket: Array.isArray(result) ? result[0] : result });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const mappedId = req.auth.role === 'admin' ? 'admin-1' : req.auth.role === 'pro' ? 'pro-1' : 'client-1';
  const user = db.users.find(u => u.id === mappedId) || db.users[0];

  const newTicket = {
    id: `tick-${Date.now().toString().slice(-4)}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    subject: subject || 'Ajuda com a Plataforma',
    message: message || 'Mensagem de suporte.',
    status: 'open' as const,
    createdAt: new Date().toISOString()
  };

  db.tickets.unshift(newTicket);
  saveDb();
  res.json({ success: true, ticket: newTicket });
});

app.post('/api/support/reply', requireAdmin, async (req: any, res) => {
  const { ticketId, reply, status } = req.body;
  if (!DEMO_MODE) {
    try {
      const result = await supabaseServerRequest(`/rest/v1/opc_support_tickets?id=eq.${encodeURIComponent(ticketId)}`, { method: 'PATCH', body: JSON.stringify({ resposta: reply, status: status || 'resolved', updated_at: new Date().toISOString() }) });
      return res.json({ success: true, ticket: Array.isArray(result) ? result[0] : result });
    } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });

  ticket.reply = reply;
  ticket.status = status || 'resolved';
  saveDb();
  res.json({ success: true, ticket });
});

// Reset demo state
app.post('/api/reset', requireAdmin, (req: any, res) => {
  if (!DEMO_MODE || IS_PRODUCTION) return res.status(404).json({ error: 'Reset demonstrativo desativado.' });
  db = JSON.parse(JSON.stringify(defaultDb));
  saveDb();
  res.json({ success: true });
});

// Vite middleware setup
async function setupVite() {
  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, host: HOST },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`✅ O Profissional Certo pronto em http://${HOST}:${PORT}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ A porta ${PORT} já está em uso. Feche a versão anterior e tente novamente.`);
    } else {
      console.error('❌ Falha ao iniciar O Profissional Certo:', error);
    }
    process.exit(1);
  });
}

setupVite();
