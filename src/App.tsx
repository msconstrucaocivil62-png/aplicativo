import React, { useState, useEffect } from 'react';
import { User, ServiceCategory, ServiceOrder, SupportTicket, SubscriptionPlan, PaymentTransaction, AppConfig } from './types';
import { Navbar } from './components/Navbar';
import { ClientPortal } from './components/ClientPortal';
import { ProPortal } from './components/ProPortal';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { SupportModal } from './components/SupportModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ArrowRightLeft, Sparkles, ShieldAlert, CheckCircle, Zap } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  // Exclusive Admin App Mode state
  const [isAdminAppMode, setIsAdminAppMode] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin') || window.location.search.includes('admin=true') || localStorage.getItem('conecta_admin_exclusive') === 'true';
  });

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
      const targetId = userId || (currentUser ? currentUser.id : undefined);
      const url = targetId ? `/api/state?userId=${targetId}` : '/api/state';
      const res = await fetch(url);
      const data = await res.json();
      
      setCurrentUser(data.user);
      setUsers(data.users);
      setCategories(data.categories);
      setOrders(data.orders);
      setTickets(data.tickets);
      setTransactions(data.transactions);
      setPlans(data.plans);
      setConfig(data.config);
    } catch (err) {
      console.error('Error fetching state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // API Handlers
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch', {
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

  const handleRegisterUser = async (regData: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.success) {
      if (data.user.role === 'admin') {
        await toggleAdminAppMode(true, data.user.id);
      } else {
        await fetchState(data.user.id);
      }
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    const res = await fetch('/api/services/create', {
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
    const res = await fetch('/api/services/status', {
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
    const res = await fetch('/api/services/rate-client', {
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
    const res = await fetch('/api/payment/create-checkout', {
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
    const res = await fetch('/api/payment/simulate-pay', {
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
    const res = await fetch('/api/admin/users/update-plan', {
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
    const res = await fetch('/api/admin/categories', {
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
    const res = await fetch('/api/support/create', {
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
    const res = await fetch('/api/support/reply', {
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
    const res = await fetch('/api/admin/config', {
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
      const res = await fetch('/api/users/update-categories', {
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
    if (confirm("Deseja restaurar os dados de demonstração originais do aplicativo Conecta Pro?")) {
      setLoading(true);
      await fetch('/api/reset', { method: 'POST' });
      await fetchState('client-1');
    }
  };

  if (loading || !currentUser || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/30">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div className="text-xl font-extrabold tracking-tight">Carregando Conecta Pro...</div>
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-800">
      
      {/* EXCLUSIVE ADMINISTRATOR APP BAR */}
      {isAdminAppMode ? (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white border-b-2 border-purple-500 shadow-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 font-black text-lg">
                👑
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                  Conecta<span className="text-purple-400">Pro</span> • <span className="text-amber-400">Admin Console</span>
                </span>
                <span className="hidden sm:inline-block ml-2.5 text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  ⚡ Exclusivo Administração
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-xs font-semibold text-purple-200 bg-purple-900/50 px-3 py-1 rounded-lg border border-purple-700">
                🔒 Acesso Isolado da Plataforma
              </span>
              <button
                type="button"
                onClick={() => toggleAdminAppMode(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-md border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🚪 Sair do Modo Admin (Ir ao Marketplace)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Marketplace Navigation Bar */
        <Navbar
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenSupportModal={() => setIsSupportModalOpen(true)}
          onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
          onResetDemo={handleResetDemo}
          onEnterAdminApp={() => toggleAdminAppMode(true)}
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
              />
            )}

            {currentUser.role === 'admin' && (
              <div className="p-8 rounded-3xl bg-white border border-purple-200 shadow-lg text-center space-y-6 max-w-2xl mx-auto my-12">
                <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
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
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
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

      {/* Floating Assistant / Status Banner */}
      {isAdminAppMode ? (
        <div className="sticky bottom-0 z-30 bg-purple-950/95 backdrop-blur-md text-white py-3.5 px-4 sm:px-6 border-t border-purple-800 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2 text-purple-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Aplicativo Exclusivo do Administrador Conecta Pro:</span>
              <strong className="text-amber-300 font-bold">Gestão Integral de Assinaturas & Financeiro</strong>
            </div>
            <button
              type="button"
              onClick={() => toggleAdminAppMode(false)}
              className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs shadow transition-all cursor-pointer"
            >
              ← Voltar para Visão Marketplace (Clientes/Profissionais)
            </button>
          </div>
        </div>
      ) : (
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
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        users={users}
        currentUser={currentUser}
        categories={categories}
        onSwitchUser={handleSwitchUser}
        onRegisterUser={handleRegisterUser}
        onEnterAdminApp={() => toggleAdminAppMode(true)}
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

    </div>
  );
}
