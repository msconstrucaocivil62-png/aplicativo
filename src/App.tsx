import React, { useState, useEffect } from 'react';
import { User, ServiceCategory, ServiceOrder, SupportTicket, SubscriptionPlan, PaymentTransaction, AppConfig } from './types';
import { Navbar } from './components/Navbar';
import { ClientPortal } from './components/ClientPortal';
import { ProPortal } from './components/ProPortal';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { SupportModal } from './components/SupportModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { EditProfileModal } from './components/EditProfileModal';
import { NegotiationCenter } from './components/NegotiationCenter';
import { LiveStatus } from './components/Phase2Tools';
import { ArrowRightLeft, Sparkles, ShieldAlert, CheckCircle, Zap } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { apiFetch } from './lib/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Exclusive Admin App Mode state
  const [isAdminAppMode, setIsAdminAppMode] = useState<boolean>(false);

  const toggleAdminAppMode = async (enable: boolean, targetAdminId?: string) => {
    setIsAdminAppMode(enable);
    if (enable) {
      localStorage.setItem('conecta_admin_exclusive', 'true');
      const adminId = targetAdminId || (users.find(u => u.role === 'admin')?.id || 'admin-1');
      if (currentUser?.id !== adminId) {
        await handleSwitchUser(adminId);
      }
    } else {
      localStorage.removeItem('conecta_admin_exclusive');
      const defaultUser = users.find(u => u.role === 'pro' || u.role === 'client') || { id: 'pro-1' };
      if (currentUser?.role === 'admin') {
        await handleSwitchUser(defaultUser.id);
      }
    }
  };

  const fetchState = async (userId?: string) => {
    try {
      setStartupError('');
      const targetId = userId || (currentUser ? currentUser.id : undefined);
      const url = targetId ? `/api/state?userId=${encodeURIComponent(targetId)}` : '/api/state';
      const res = await apiFetch(url);
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error || `Falha ao carregar o aplicativo (${res.status}).`);
      }
      const data = await res.json();

      setCurrentUser(authenticatedUser || data.user || null);
      setUsers(Array.isArray(data.users) ? data.users : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setProposals(Array.isArray(data.proposals) ? data.proposals : []);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      setConfig(data.config || null);
      return true;
    } catch (err: any) {
      console.error('Error fetching state:', err);
      const message = err?.message || 'Não foi possível carregar os dados do aplicativo.';
      setStartupError(message);
      if (message.toLowerCase().includes('sessão expirou')) {
        setAuthenticatedUser(null);
        setCurrentUser(null);
        setIsAdminAppMode(false);
        setIsAuthModalOpen(true);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadSupabaseUser = async () => {
    if (!supabase || !isSupabaseConfigured) {
      await fetchState();
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) console.warn('Falha ao recuperar sessão:', sessionError.message);

    const authUser = sessionData.session?.user;
    if (!authUser) {
      setAuthenticatedUser(null);
      setCurrentUser(null);
      setIsAdminAppMode(false);
      setLoading(false);
      setIsAuthModalOpen(true);
      return;
    }

    // A tabela profiles já existia antes desta versão e pode conter colunas
    // diferentes. O select('*') evita falhas quando uma coluna opcional não existe.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Não foi possível carregar o perfil:', profileError.message);
    }

    const configuredAdminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
    const authenticatedEmail = String(authUser.email || '').trim().toLowerCase();
    const rawRole = String(profile?.role ?? profile?.tipo ?? authUser.user_metadata?.role ?? authUser.user_metadata?.tipo ?? 'client').toLowerCase();
    const isConfiguredAdmin = Boolean(configuredAdminEmail && authenticatedEmail === configuredAdminEmail);
    const role = isConfiguredAdmin || rawRole === 'admin'
      ? 'admin'
      : ['professional', 'profissional', 'pro'].includes(rawRole)
        ? 'pro'
        : 'client';

    const mapped: User = {
      id: authUser.id,
      name: profile?.full_name || profile?.nome || authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
      email: authUser.email || '',
      phone: profile?.phone || profile?.telefone || authUser.user_metadata?.telefone || '',
      role,
      avatar: profile?.avatar_url || profile?.foto_url || authUser.user_metadata?.avatar_url || '',
      location: [profile?.cidade, profile?.estado].filter(Boolean).join(', ') || profile?.location || 'Brasil',
      accountStatus: ['bloqueado', 'blocked'].includes(String(profile?.status || '').toLowerCase()) ? 'blocked' : 'active',
      ...(role === 'pro' ? { planStatus: 'active', categories: [] } : {})
    } as User;

    setAuthenticatedUser(mapped);
    setCurrentUser(mapped);
    setIsAdminAppMode(role === 'admin');
    setIsAuthModalOpen(false);

    // Os dados do marketplace ainda são carregados pela API local, porém o perfil
    // autenticado do Supabase sempre prevalece sobre o usuário demonstrativo.
    await fetchState(role === 'admin' ? 'admin-1' : undefined);
    setCurrentUser(mapped);
  };

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        await loadSupabaseUser();
      } catch (error: any) {
        if (active) {
          console.error('Falha ao iniciar autenticação:', error);
          setStartupError(error?.message || 'Falha ao iniciar a autenticação.');
          setLoading(false);
        }
      }
    };
    void bootstrap();

    if (!supabase) return () => { active = false; };
    // Não execute consultas Supabase dentro do callback de autenticação.
    // Alguns navegadores podem bloquear a inicialização quando o callback aguarda outra chamada auth.
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => { if (active) void loadSupabaseUser(); }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const timer = window.setInterval(() => fetchState(currentUser.id), 8000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id, authenticatedUser?.id]);

  // API Handlers
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await apiFetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchState(userId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginUser = async (email: string, password?: string) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password || '' });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message);
    await loadSupabaseUser();
  };

  const handleRegisterUser = async (regData: any) => {
    if (!supabase || !isSupabaseConfigured) throw new Error('Supabase não configurado.');
    const tipo = regData.role === 'pro' ? 'profissional' : 'cliente';
    const { error } = await supabase.auth.signUp({
      email: regData.email.trim(),
      password: regData.password,
      options: { data: { nome: regData.name, telefone: regData.phone, tipo } }
    });
    if (error) throw new Error(error.message);
    alert('Cadastro realizado. Confirme o e-mail antes de entrar.');
  };

  const handleUpdateProfile = async (updatedData: any) => {
    const res = await apiFetch('/api/users/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.success && data.user) {
      await fetchState(data.user.id);
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    const res = await apiFetch('/api/services/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    const res = await apiFetch('/api/services/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        status,
        proId: currentUser?.role === 'pro' ? currentUser.id : undefined,
        proName: currentUser?.role === 'pro' ? currentUser.name : undefined
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleRateClient = async (orderId: string, rating: number, comment?: string) => {
    if (!currentUser) return;
    const res = await apiFetch('/api/services/rate-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        proId: currentUser.id,
        rating,
        comment
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleSelectPlanAndPay = async (planId: string, paymentMethod: 'pix' | 'credit_card') => {
    const res = await apiFetch('/api/payment/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proId: currentUser?.id,
        planType: planId,
        paymentMethod
      })
    });
    return await res.json();
  };

  const handleSimulateWebhookApproval = async (transactionId: string, daysToAdd: number) => {
    const res = await apiFetch('/api/payment/simulate-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId,
        proId: currentUser?.id,
        daysToAdd
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleUpdatePlanByAdmin = async (userId: string, daysToAdd?: number, forceStatus?: any) => {
    const res = await apiFetch('/api/admin/users/update-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: userId,
        daysToAdd,
        forceStatus
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleManageCategory = async (action: 'create' | 'delete', catData: any) => {
    const res = await apiFetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...catData })
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleCreateTicket = async (subject: string, message: string) => {
    const res = await apiFetch('/api/support/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser?.id,
        subject,
        message
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleReplyTicket = async (ticketId: string, reply: string) => {
    const res = await apiFetch('/api/support/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId,
        reply,
        status: 'resolved'
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleSaveConfig = async (newConfig: Partial<AppConfig>) => {
    const res = await apiFetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    const data = await res.json();
    if (data.success) {
      await fetchState();
    }
  };

  const handleUpdateProCategories = async (categories: string[]) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch('/api/users/update-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, categories })
      });
      const data = await res.json();
      if (data.success) {
        await fetchState(currentUser.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDemo = async () => {
    if (confirm("Deseja restaurar os dados de demonstração originais do aplicativo O Profissional Certo?")) {
      setLoading(true);
      await apiFetch('/api/reset', { method: 'POST' });
      await fetchState('client-1');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/30">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div className="text-xl font-extrabold tracking-tight">Carregando O Profissional Certo...</div>
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSupabaseConfigured && !authenticatedUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center text-white space-y-5">
          <img src="/icons/opc-logo.svg" alt="O Profissional Certo" className="w-28 h-28 mx-auto" />
          <h1 className="text-4xl font-black italic">O profissional <span className="text-amber-400">certo</span></h1>
          <p className="text-slate-300">Entre para solicitar serviços ou receber oportunidades.</p>
          <button onClick={() => setIsAuthModalOpen(true)} className="px-8 py-3 rounded-xl bg-amber-400 text-slate-950 font-black">Entrar ou cadastrar</button>
        </div>
        {startupError && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-xl rounded-xl border border-rose-400/40 bg-rose-950/90 px-4 py-3 text-sm text-rose-100 shadow-2xl">{startupError}</div>}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} users={demoMode ? users : []} currentUser={currentUser || ({ id: '', name: '', email: '', phone: '', role: 'client' } as User)} categories={categories} onSwitchUser={handleSwitchUser} onLoginUser={handleLoginUser} onRegisterUser={handleRegisterUser} />
      </div>
    );
  }

  if (!currentUser || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-lg w-full rounded-3xl border border-slate-700 bg-slate-900 p-7 text-center shadow-2xl space-y-4">
          <img src="/icons/opc-logo.svg" alt="O Profissional Certo" className="w-20 h-20 mx-auto" />
          <h1 className="text-2xl font-black">Não foi possível carregar seus dados</h1>
          <p className="text-sm text-slate-300">{startupError || 'Confirme se o servidor está aberto e tente novamente.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => { setLoading(true); void loadSupabaseUser(); }} className="rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950">Tentar novamente</button>
            <button onClick={async () => { await supabase?.auth.signOut(); setAuthenticatedUser(null); setCurrentUser(null); setIsAuthModalOpen(true); }} className="rounded-xl bg-slate-700 px-5 py-3 font-bold">Sair e entrar novamente</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans antialiased text-slate-800">
      
      {/* EXCLUSIVE ADMINISTRATOR APP BAR */}
      {isAdminAppMode ? (
        <div className="opc-dark-header border-b-2 border-amber-400 shadow-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 font-black text-lg">
                👑
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                  O profissional <span className="text-amber-400">certo</span> • <span className="text-amber-400">Admin Console</span>
                </span>
                <span className="hidden sm:inline-block ml-2.5 text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/30 text-amber-200 border border-amber-400/30">
                  ⚡ Exclusivo Administração
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-xs font-semibold text-amber-200 bg-slate-900/50 px-3 py-1 rounded-lg border border-amber-700">
                🔒 Acesso Isolado da Plataforma
              </span>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/40 hover:bg-amber-500 text-amber-200 hover:text-white font-extrabold text-xs shadow border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Editar Perfil e Senha do Admin"
              >
                <span>✏️ Editar Perfil Admin</span>
              </button>
              <button
                type="button"
                onClick={async () => { await supabase?.auth.signOut(); setAuthenticatedUser(null); setIsAdminAppMode(false); setIsAuthModalOpen(true); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-md border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🚪 Sair</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Marketplace Navigation Bar */
        <Navbar
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
          onOpenSupportModal={() => setIsSupportModalOpen(true)}
          onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
          onResetDemo={handleResetDemo}
          onLogout={async () => { await supabase?.auth.signOut(); setAuthenticatedUser(null); setCurrentUser(null); setIsAuthModalOpen(true); }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isAdminAppMode ? (
          /* EXCLUSIVE ADMINISTRATOR PORTAL VIEW */
          <AdminPortal
            users={users}
            categories={categories}
            tickets={tickets}
            transactions={transactions}
            config={config!}
            onUpdatePlan={handleUpdatePlanByAdmin}
            onManageCategory={handleManageCategory}
            onReplyTicket={handleReplyTicket}
            onSaveConfig={handleSaveConfig}
          />
        ) : (
          /* STANDARD MARKETPLACE VIEWS (CLIENTS AND PROFESSIONALS) */
          <>
            {(currentUser.role === 'client' || currentUser.role === 'pro') && (
              <NegotiationCenter currentUser={currentUser} orders={orders} proposals={proposals} messages={messages} onRefresh={async () => { await fetchState(currentUser.id); }} />
            )}
            {currentUser.role === 'client' && (
              <ClientPortal
                currentUser={currentUser}
                users={users}
                categories={categories}
                orders={orders}
                onCreateOrder={handleCreateOrder}
                onOpenSupport={() => setIsSupportModalOpen(true)}
              />
            )}

            {currentUser.role === 'pro' && (
              <ProPortal
                currentUser={currentUser}
                users={users}
                orders={orders}
                categories={categories}
                onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onOpenSupportModal={() => setIsSupportModalOpen(true)}
                onUpdateCategories={handleUpdateProCategories}
                onRateClient={handleRateClient}
                onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
              />
            )}

            {currentUser.role === 'admin' && (
              <div className="p-8 rounded-3xl bg-white border border-amber-200 shadow-lg text-center space-y-6 max-w-2xl mx-auto my-12">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                  👑
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Aplicativo Exclusivo de Administração</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Você está no perfil de Administrador Geral. Para acessar o painel financeiro e gestão da plataforma sem interferência da visão de clientes e profissionais, abra o Console Exclusivo.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleAdminAppMode(true)}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-white font-black text-sm shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                  >
                    🚀 Abrir Console Exclusivo do Administrador
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm transition-all cursor-pointer"
                  >
                    🔄 Mudar para Visão de Profissional / Cliente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isAdminAppMode && currentUser && <LiveStatus currentUser={currentUser} orders={orders} />}

      {/* Floating Assistant / Status Banner */}
      {isAdminAppMode ? (
        <div className="sticky bottom-0 z-30 bg-slate-950/95 backdrop-blur-md text-white py-3.5 px-4 sm:px-6 border-t border-amber-800 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2 text-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Administração — O Profissional Certo:</span>
              <strong className="text-amber-300 font-bold">Gestão Integral de Assinaturas & Financeiro</strong>
            </div>
            <button
              type="button"
              onClick={async () => { await supabase?.auth.signOut(); setAuthenticatedUser(null); setIsAdminAppMode(false); setIsAuthModalOpen(true); }}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow transition-all cursor-pointer"
            >
              🚪 Encerrar sessão
            </button>
          </div>
        </div>
      ) : demoMode ? (
        <div className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md text-white py-3 px-4 sm:px-6 border-t border-slate-800 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Você está no perfil demonstrativo:</span>
              <strong className="text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                {currentUser.name} ({currentUser.role === 'client' ? 'Cliente' : currentUser.role === 'pro' ? 'Profissional' : 'Admin'})
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Trocar de Perfil / Testar Outra Visão</span>
              </button>
              {currentUser.role === 'pro' && currentUser.planStatus === 'expired' && (
                <button
                  onClick={() => setIsSubscribeModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow transition-all animate-bounce cursor-pointer"
                >
                  Simular Pagamento Pix / Cartão
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        users={users}
        currentUser={currentUser}
        categories={categories}
        onSwitchUser={handleSwitchUser}
        onLoginUser={handleLoginUser}
        onRegisterUser={handleRegisterUser}
      />

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        currentUser={currentUser}
        tickets={tickets}
        onCreateTicket={handleCreateTicket}
      />

      <SubscriptionModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        currentUser={currentUser}
        plans={plans}
        config={config}
        onSelectPlanAndPay={handleSelectPlanAndPay}
        onSimulateWebhookApproval={handleSimulateWebhookApproval}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        currentUser={currentUser}
        categories={categories}
        onUpdateProfile={handleUpdateProfile}
      />

    </div>
  );
}
