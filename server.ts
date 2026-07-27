import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-Memory Database with optional file persistence for local preview
const DATA_DIR = path.join(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'conecta_db.json');

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
      name: 'Administrador Conecta Pro',
      email: 'admin@conectapro.com',
      role: 'admin',
      phone: '(11) 90000-0000',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
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
    mercadoPagoAccessToken: 'APP_USR-7829103984102938-072711-2a9f8b7c6d5e4f3a2b1c-102938475',
    pixReceiverKey: 'financeiro@conectapro.com.br',
    pixReceiverName: 'Conecta Pro Serviços de Tecnologia Ltda',
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
app.get('/api/state', (req, res) => {
  validateProPlans();
  const userId = req.query.userId as string;
  const user = db.users.find(u => u.id === userId) || db.users[0]; // Default to client-1

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
    users: db.users,
    categories: db.categories,
    orders: sanitizedOrders,
    tickets: db.tickets,
    transactions: db.transactions,
    config: db.config,
    plans: [
      { id: 'monthly', title: 'Plano Mensal', price: 50.00, days: 30, description: 'Acesso completo às solicitações de clientes por 30 dias.', badge: 'Mais Flexível' },
      { id: 'semiannual', title: 'Plano Semestral', price: 200.00, days: 180, description: 'Economize R$ 100,00! 6 meses de acesso ininterrupto.', savings: 'Economize R$ 100', badge: 'Mais Popular' },
      { id: 'annual', title: 'Plano Anual', price: 450.00, days: 365, description: 'O menor custo por mês (R$ 37,50/mês). Parcele em até 12x no cartão.', savings: 'Economize R$ 150', badge: 'Melhor Valor', installmentText: '12x de R$ 37,50' }
    ]
  });
});

// 2. AUTH / USER SWITCH
app.post('/api/auth/switch', (req, res) => {
  const { userId } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  res.json({ success: true, user });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role, phone, categories, bio } = req.body;
  
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  const newId = `${role}-${Date.now().toString().slice(-4)}`;
  const newUser: any = {
    id: newId,
    name,
    email,
    role,
    phone: phone || '(11) 99999-9999',
    avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 80000000)}?w=150&auto=format&fit=crop&q=80`,
    location: 'São Paulo, SP'
  };

  if (role === 'pro') {
    newUser.categories = categories && categories.length > 0 ? categories : ['Eletricista'];
    newUser.planStatus = 'expired'; // New pros start expired until they pay the R$ 50/200/450 fee!
    newUser.planDueDate = new Date(Date.now() - 1000).toISOString();
    newUser.bio = bio || 'Profissional especialista cadastrado na plataforma.';
    newUser.rating = 5.0;
    newUser.completedJobs = 0;
  }

  db.users.push(newUser);
  saveDb();
  res.json({ success: true, user: newUser });
});

app.post('/api/users/update-categories', (req, res) => {
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
app.post('/api/services/create', (req, res) => {
  const { clientId, category, title, description, location, urgency, phone } = req.body;
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
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDb();
  res.json({ success: true, order: newOrder });
});

app.post('/api/services/status', (req, res) => {
  const { orderId, status, proId, proName } = req.body;
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  order.status = status;
  if (proId) {
    order.assignedProId = proId;
    order.assignedProName = proName;
  }
  saveDb();
  res.json({ success: true, order });
});

app.post('/api/services/rate-client', (req, res) => {
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

// 4. MERCADO PAGO / SUBSCRIPTION BILLING MODULE
app.post('/api/payment/create-checkout', (req, res) => {
  const { proId, planType, paymentMethod } = req.body;
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
    qrCode: `00020126580014br.gov.bcb.pix0136${db.config.pixReceiverKey}5204000053039865405${selectedPlan.amount.toFixed(2)}5802BR5915Conecta Pro App6009Sao Paulo62240520CONECTA${trxId}6304E1F2`,
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

// Webhook simulation / Instant Approval
app.post('/api/payment/simulate-pay', (req, res) => {
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
app.post('/api/admin/users/update-plan', (req, res) => {
  const { targetUserId, daysToAdd, forceStatus } = req.body;
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

app.post('/api/admin/categories', (req, res) => {
  const { action, categoryId, name, icon, description } = req.body;
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

app.post('/api/admin/config', (req, res) => {
  const { 
    mercadoPagoAccessToken, 
    pixReceiverKey,
    pixReceiverName,
    pixReceiverBank,
    pixReceiverCnpjCpf,
    pixInstructions
  } = req.body;
  if (mercadoPagoAccessToken !== undefined) db.config.mercadoPagoAccessToken = mercadoPagoAccessToken;
  if (pixReceiverKey !== undefined) db.config.pixReceiverKey = pixReceiverKey;
  if (pixReceiverName !== undefined) db.config.pixReceiverName = pixReceiverName;
  if (pixReceiverBank !== undefined) db.config.pixReceiverBank = pixReceiverBank;
  if (pixReceiverCnpjCpf !== undefined) db.config.pixReceiverCnpjCpf = pixReceiverCnpjCpf;
  if (pixInstructions !== undefined) db.config.pixInstructions = pixInstructions;
  saveDb();
  res.json({ success: true, config: db.config });
});

// 6. SUPPORT TICKETS
app.post('/api/support/create', (req, res) => {
  const { userId, subject, message } = req.body;
  const user = db.users.find(u => u.id === userId) || db.users[0];

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

app.post('/api/support/reply', (req, res) => {
  const { ticketId, reply, status } = req.body;
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });

  ticket.reply = reply;
  ticket.status = status || 'resolved';
  saveDb();
  res.json({ success: true, ticket });
});

// Reset demo state
app.post('/api/reset', (req, res) => {
  db = JSON.parse(JSON.stringify(defaultDb));
  saveDb();
  res.json({ success: true });
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Conecta Pro Server rodando com sucesso na porta ${PORT}`);
  });
}

setupVite();
