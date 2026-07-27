import React, { useState, useEffect } from 'react';
import { User, ServiceOrder, ServiceCategory } from '../types';
import { DynamicIcon } from './IconHelper';
import { ShieldAlert, CheckCircle, Clock, MapPin, Phone, MessageSquare, AlertTriangle, Sparkles, Star, Award, CheckCircle2, HelpCircle, Briefcase, Filter, ArrowUpRight, DollarSign, ShieldCheck, Search, Plus, Check, Save } from 'lucide-react';

interface ProPortalProps {
  currentUser: User;
  users?: User[];
  orders: ServiceOrder[];
  categories: ServiceCategory[];
  onOpenSubscribeModal: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: any) => Promise<void>;
  onOpenSupportModal: () => void;
  onUpdateCategories?: (categories: string[]) => Promise<void>;
  onRateClient?: (orderId: string, rating: number, comment?: string) => Promise<void>;
}

export const ProPortal: React.FC<ProPortalProps> = ({
  currentUser,
  users = [],
  orders,
  categories,
  onOpenSubscribeModal,
  onUpdateOrderStatus,
  onOpenSupportModal,
  onUpdateCategories,
  onRateClient
}) => {
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'feed' | 'my_jobs' | 'profile'>('feed');

  const [ratingScore, setRatingScore] = useState<Record<string, number>>({});
  const [ratingComment, setRatingComment] = useState<Record<string, string>>({});
  const [editingOrderRating, setEditingOrderRating] = useState<string | null>(null);
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);

  const proCategories = currentUser.categories || ['Eletricista'];
  const [selectedMyCats, setSelectedMyCats] = useState<string[]>(proCategories);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [savingCats, setSavingCats] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSelectedMyCats(currentUser.categories || ['Eletricista']);
  }, [currentUser.categories]);

  const toggleMyCategory = (catName: string) => {
    setSelectedMyCats(prev => {
      if (prev.includes(catName)) {
        if (prev.length <= 1) {
          alert('Você precisa manter pelo menos 1 categoria ativa no seu perfil!');
          return prev;
        }
        return prev.filter(c => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
    setSaveSuccess(false);
  };

  const handleSaveCategories = async () => {
    if (!onUpdateCategories) return;
    setSavingCats(true);
    await onUpdateCategories(selectedMyCats);
    setSavingCats(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleSendClientRating = async (orderId: string) => {
    if (!onRateClient) return;
    const score = ratingScore[orderId] || 5;
    const comment = ratingComment[orderId] || '';
    setSubmittingRating(orderId);
    try {
      await onRateClient(orderId, score, comment);
      setEditingOrderRating(null);
    } finally {
      setSubmittingRating(null);
    }
  };

  const isPlanExpired = currentUser.planStatus === 'expired' || !currentUser.planDueDate || new Date() > new Date(currentUser.planDueDate);

  // Filter orders matching pro's categories
  const categoryOrders = orders.filter(o => proCategories.includes(o.category));
  const displayedOrders = selectedCatFilter === 'all' 
    ? categoryOrders 
    : categoryOrders.filter(o => o.category === selectedCatFilter);

  const myAssignedOrders = orders.filter(o => o.assignedProId === currentUser.id);

  const getDaysRemaining = () => {
    if (!currentUser.planDueDate) return 0;
    const diff = new Date(currentUser.planDueDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysRemaining();

  const handleWhatsAppClick = (order: ServiceOrder) => {
    if (isPlanExpired) {
      alert("⚠️ Seu plano está expirado! Renove sua taxa de assinatura para ver o WhatsApp e telefone dos clientes.");
      onOpenSubscribeModal();
      return;
    }
    const cleanPhone = order.clientPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá ${order.clientName}! Vi sua solicitação no aplicativo Conecta Pro sobre "${order.title}". Sou profissional especialista em ${order.category}, podemos falar sobre o orçamento?`);
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${msg}`, '_blank');
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case 'imediato': return <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">⚡ Emergência Imediata</span>;
      case 'alta': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-100 text-orange-700 border border-orange-200">🔥 Urgência Alta</span>;
      case 'media': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 border border-amber-200">⏱️ Urgência Média</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">📅 Baixa</span>;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. PLAN STATUS BANNER (CRITICAL FEATURE) */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xl border transition-all ${
        isPlanExpired
          ? 'bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white border-rose-500/50 shadow-rose-900/20'
          : 'bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white border-emerald-500/50 shadow-emerald-900/20'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              isPlanExpired ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30'
            }`}>
              {isPlanExpired ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isPlanExpired ? 'bg-rose-500/30 text-rose-200 border border-rose-400/30' : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                }`}>
                  {isPlanExpired ? '⚠️ PLANO EXPIRADO / BLOQUEADO' : '✅ PLANO ATIVO EM DIA'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {isPlanExpired ? 'Acesso restrito' : `Valido até: ${currentUser.planDueDate ? new Date(currentUser.planDueDate).toLocaleDateString('pt-BR') : 'Indefinido'} (${daysLeft} dias restantes)`}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isPlanExpired
                  ? 'Você está bloqueado para entrar em contato com clientes!'
                  : 'Sua conta está liberada para receber e atender chamados!'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {isPlanExpired
                  ? 'Como seu plano expirou, as solicitações continuam chegando no seu app, porém o número de telefone e WhatsApp dos clientes estão ocultos. Escolha seu plano (50,00 mensal, 200,00 semestral ou 450,00 anual) para liberar imediatamente.'
                  : 'Você está recebendo alertas em tempo real para todas as solicitações nas suas categorias cadastradas. Mantenha seu plano em dia para continuar crescendo seu faturamento.'}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onOpenSubscribeModal}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2.5 ${
                isPlanExpired
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-amber-500/30 animate-bounce'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>{isPlanExpired ? 'Renovar Plano via Pix / Cartão' : 'Estender Plano / Ver Tarifas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats and Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Trabalhos Realizados</span>
            <span className="text-2xl font-black text-slate-900">{currentUser.completedJobs || 142}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Avaliação Geral</span>
            <span className="text-2xl font-black text-slate-900">{currentUser.rating ? currentUser.rating.toFixed(1) : '4.9'} ★</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Taxa da Plataforma</span>
            <span className="text-xl font-black text-emerald-600">0% (Você fica 100%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Suporte Direto</span>
            <span className="text-sm font-bold text-slate-800">Precisa de ajuda?</span>
          </div>
          <button
            onClick={onOpenSupportModal}
            className="p-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white transition-all shadow-md"
            title="Acionar Suporte"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm sm:text-base transition-all flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Feed de Solicitações nas Minhas Categorias ({categoryOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my_jobs')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm sm:text-base transition-all flex items-center gap-2 ${
              activeTab === 'my_jobs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Meus Atendimentos ({myAssignedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm sm:text-base transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>📋 Todas as Categorias & Minhas Especialidades ({categories.length})</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <Filter className="w-4 h-4 text-slate-500 ml-2" />
          <button
            onClick={() => setSelectedCatFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCatFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas as minhas ({proCategories.length})
          </button>
          {proCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCatFilter === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'feed' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Solicitações de Clientes em Tempo Real</h3>
              <p className="text-sm text-slate-500">
                Categorias cadastradas: <span className="font-bold text-blue-600">{proCategories.join(', ')}</span>
              </p>
            </div>
            {isPlanExpired && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                🔒 Contatos ocultos por plano expirado
              </div>
            )}
          </div>

          {displayedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Briefcase className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Nenhuma solicitação aberta para "{selectedCatFilter === 'all' ? 'suas categorias' : selectedCatFilter}" no momento</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">Assim que um cliente solicitar um serviço na sua área de atuação, o alerta aparecerá aqui na hora!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {displayedOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6 ${
                    isPlanExpired ? 'border-rose-200 bg-gradient-to-br from-white via-white to-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {order.category}
                      </span>
                      {getUrgencyBadge(order.urgency)}
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Enviado {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-slate-900">{order.title}</h4>
                      <p className="text-slate-600 mt-2 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                        "{order.description}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-700 pt-2">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        {order.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-900 font-extrabold">
                        👤 Cliente: {order.clientName}
                        {(() => {
                          const clientUser = users.find(u => u.id === order.clientId);
                          const ratingVal = clientUser?.clientRating || clientUser?.rating;
                          const countVal = clientUser?.clientRatingsCount || clientUser?.ratingsCount;
                          return ratingVal ? (
                            <span className="ml-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black inline-flex items-center gap-1 shadow-2xs">
                              ⭐ {ratingVal.toFixed(1)} ({countVal || 1} av.)
                            </span>
                          ) : (
                            <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold">
                              ⭐ Novo Cliente
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Contact / Action Column */}
                  <div className="md:w-80 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Telefone / WhatsApp do Cliente</span>
                      
                      {isPlanExpired ? (
                        <div className="p-3.5 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-800 text-center font-extrabold text-xs shadow-inner animate-pulse">
                          ⚠️ BLOQUEADO - RENOVE O PLANO PARA VER
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold text-center text-lg flex items-center justify-center gap-2 shadow-sm">
                          <Phone className="w-5 h-5 text-emerald-600" />
                          <span>{order.clientPhone}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {isPlanExpired ? (
                        <button
                          onClick={onOpenSubscribeModal}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldAlert className="w-5 h-5" />
                          <span>Bloqueado (Renovar Assinatura)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleWhatsAppClick(order)}
                          className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-5 h-5" />
                          <span>Chamar no WhatsApp agora</span>
                        </button>
                      )}

                      {!isPlanExpired && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'in_progress')}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-300"
                        >
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Marcar que peguei este serviço</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'my_jobs' ? (
        <div className="space-y-6">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Meus Atendimentos Aceitos ({myAssignedOrders.length})</h3>
          {myAssignedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">Você ainda não assumiu nenhum serviço no sistema</h4>
              <p className="text-sm text-slate-500 mt-1">No feed de solicitações, clique em "Chamar no WhatsApp" ou "Marcar que peguei este serviço".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {myAssignedOrders.map(o => {
                const clientUser = users.find(u => u.id === o.clientId);
                const ratingVal = clientUser?.clientRating || clientUser?.rating;
                const countVal = clientUser?.clientRatingsCount || clientUser?.ratingsCount;
                const currentScore = ratingScore[o.id] || o.clientRating || 5;

                return (
                  <div key={o.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {o.category}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">• ID: #{o.id}</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900">{o.title}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium">
                          <span className="flex items-center gap-1.5 font-bold text-slate-800">
                            👤 {o.clientName}
                            {ratingVal ? (
                              <span className="ml-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black inline-flex items-center gap-1">
                                ⭐ {ratingVal.toFixed(1)} ({countVal || 1} av.)
                              </span>
                            ) : (
                              <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold">
                                ⭐ Novo Cliente
                              </span>
                            )}
                          </span>
                          <span>• 📞 {o.clientPhone}</span>
                          <span>• 📍 {o.location}</span>
                        </div>
                      </div>

                      <div>
                        {o.status === 'completed' ? (
                          <span className="px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Ordem Concluída ✅
                          </span>
                        ) : (
                          <button
                            onClick={() => onUpdateOrderStatus(o.id, 'completed')}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Marcar Concluído ✅
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      "{o.description}"
                    </p>

                    {/* Client Rating Module (Visible after completion) */}
                    {o.status === 'completed' && (
                      <div className="pt-2">
                        {!o.clientRating || editingOrderRating === o.id ? (
                          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-amber-500/30 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                  <span>⭐ Avaliar Cliente: {o.clientName}</span>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black">1 a 5 Estrelas</span>
                                </h5>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  Sua avaliação e feedback são exibidos no perfil do cliente para auxiliar outros profissionais na plataforma.
                                </p>
                              </div>
                              {editingOrderRating === o.id && (
                                <button
                                  onClick={() => setEditingOrderRating(null)}
                                  className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>

                            {/* 1 to 5 Star Selector */}
                            <div className="flex items-center gap-2 py-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingScore(prev => ({ ...prev, [o.id]: star }))}
                                  className={`p-3 rounded-xl border transition-all flex items-center gap-1 font-black text-sm ${
                                    currentScore >= star
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30 scale-105'
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-500'
                                  }`}
                                >
                                  <Star className={`w-5 h-5 ${currentScore >= star ? 'fill-white' : 'fill-none'}`} />
                                  <span>{star}</span>
                                </button>
                              ))}
                              <span className="ml-3 font-extrabold text-sm text-amber-900">
                                {currentScore === 5 && '5.0 - Excelente Cliente! 🌟'}
                                {currentScore === 4 && '4.0 - Muito Bom! 👍'}
                                {currentScore === 3 && '3.0 - Atendimento Regular Neutral 😐'}
                                {currentScore === 2 && '2.0 - Houve Dificuldades ⚠️'}
                                {currentScore === 1 && '1.0 - Não Recomendo 🚫'}
                              </span>
                            </div>

                            {/* Feedback Comment */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Comentário ou Feedback sobre o Cliente (Opcional)
                              </label>
                              <textarea
                                value={ratingComment[o.id] ?? (o.clientRatingComment || '')}
                                onChange={e => setRatingComment(prev => ({ ...prev, [o.id]: e.target.value }))}
                                placeholder="Ex: Cliente super pontual no pagamento, liberou o acesso na hora combinada e explicou o problema com precisão. Recomendo!"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-800"
                                rows={2}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSendClientRating(o.id)}
                              disabled={submittingRating === o.id}
                              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                              <Award className="w-4 h-4" />
                              {submittingRating === o.id ? 'Salvando Avaliação...' : 'Registrar Avaliação do Cliente ⭐'}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                                  <Award className="w-4 h-4 text-amber-600" />
                                  Sua Avaliação Registrada para {o.clientName}:
                                </span>
                                <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                                  ⭐ {o.clientRating}.0 / 5.0
                                </span>
                              </div>
                              {o.clientRatingComment ? (
                                <p className="text-xs text-amber-900 italic font-medium">
                                  "{o.clientRatingComment}"
                                </p>
                              ) : (
                                <p className="text-xs text-amber-800/80 italic">Sem comentário adicional.</p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setRatingScore(prev => ({ ...prev, [o.id]: o.clientRating! }));
                                setRatingComment(prev => ({ ...prev, [o.id]: o.clientRatingComment || '' }));
                                setEditingOrderRating(o.id);
                              }}
                              className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                            >
                              ✏️ Editar Avaliação
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'profile' ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Header & Save Action */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Catálogo Geral de Profissões e Especialidades</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">{categories.length} Categorias</span>
              </h3>
              <p className="text-sm text-slate-600 max-w-2xl">
                Marque as categorias em que você deseja atuar. Você receberá alertas em tempo real no seu feed sempre que um cliente solicitar um serviço em qualquer uma das especialidades selecionadas.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleSaveCategories}
                disabled={savingCats || !onUpdateCategories}
                className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  saveSuccess 
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                }`}
              >
                {savingCats ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : saveSuccess ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{savingCats ? 'Salvando...' : saveSuccess ? 'Categorias Salvas com Sucesso!' : `Salvar Alterações (${selectedMyCats.length} Ativas)`}</span>
              </button>
            </div>
          </div>

          {/* SAFETY & ETHICS COMPLIANCE BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-950/50">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                    🛡️ Conformidade & Ética Conecta Pro • 100% Legalizado
                  </span>
                </div>
                <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Todas as Categorias Existentes Permitidas – Sem Profissões Proibidas
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                  O nosso ecossistema abrange todas as atividades profissionais técnicas, domésticas, de reforma, eventos, saúde e tecnologia regulamentadas pelo mercado civil. Em rigoroso respeito à legislação brasileira e às Diretrizes de Segurança Conecta Pro, <strong>são terminantemente excluídas e vetadas quaisquer profissões ou serviços proibidos</strong> — tais como jogos de azar e apostas online (bets), agiotagem ou empréstimos ilegais, serviços de cunho adulto ou acompanhantes, invasão cibernética/hacking ou comercialização de substâncias restritas. Trabalhamos apenas com profissionais dignos, honestos e qualificados!
                </p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="🔍 Pesquisar em todas as 36+ especialidades (ex: Eletricista, Babá, Personal Trainer, Fotografia, Celulares)..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-slate-800 font-semibold text-sm sm:text-base placeholder:text-slate-400"
            />
            {catalogSearch && (
              <button
                onClick={() => setCatalogSearch('')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                Limpar Busca
              </button>
            )}
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories
              .filter(c => 
                !catalogSearch || 
                c.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                c.description.toLowerCase().includes(catalogSearch.toLowerCase())
              )
              .map((cat) => {
                const isSelected = selectedMyCats.includes(cat.name);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleMyCategory(cat.name)}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${
                        isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <DynamicIcon name={cat.icon} className="w-7 h-7" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}>
                          {isSelected ? '✅ ATIVO NA MINHA ÁREA' : '➕ ADICIONAR'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg">{cat.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{cat.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {cat.activeProsCount || 10} profissionais no sistema
                      </span>
                      <span className="text-blue-600 font-bold hover:underline">
                        {isSelected ? 'Remover especialidade' : 'Clique para ativar'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Bottom Save Reminder */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h4 className="font-extrabold text-base sm:text-lg">Pronto para receber novos chamados em suas {selectedMyCats.length} áreas?</h4>
              <p className="text-xs sm:text-sm text-slate-400">Clique no botão ao lado para gravar suas especialidades na nuvem e atualizar seu feed em tempo real.</p>
            </div>
            <button
              onClick={handleSaveCategories}
              disabled={savingCats || !onUpdateCategories}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                saveSuccess 
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              }`}
            >
              {savingCats ? 'Salvando...' : saveSuccess ? 'Categorias Salvas com Sucesso! ✅' : `Salvar Minhas Alterações (${selectedMyCats.length})`}
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
};
