import React, { useState } from 'react';
import { User, ServiceCategory, ServiceOrder } from '../types';
import { DynamicIcon } from './IconHelper';
import { PlusCircle, Search, MapPin, Phone, Clock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, ShieldCheck, Sparkles, Send, Star, Award, MessageSquare } from 'lucide-react';

interface ClientPortalProps {
  currentUser: User;
  users: User[];
  categories: ServiceCategory[];
  orders: ServiceOrder[];
  onCreateOrder: (orderData: any) => Promise<void>;
  onOpenSupport: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  currentUser,
  users,
  categories,
  orders,
  onCreateOrder,
  onOpenSupport
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [catQuery, setCatQuery] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>(currentUser.location || 'São Paulo, SP');
  const [phone, setPhone] = useState<string>(currentUser.phone || '(11) 99888-7766');
  const [urgency, setUrgency] = useState<'baixa' | 'media' | 'alta' | 'imediato'>('media');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'my_orders'>('request');

  const myOrders = orders.filter(o => o.clientId === currentUser.id || true); // Show all in demo for rich preview

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !description) {
      alert('Por favor, selecione a categoria e descreva o serviço.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateOrder({
        clientId: currentUser.id,
        category: selectedCategory,
        title: title || `Solicitação para ${selectedCategory}`,
        description,
        location,
        urgency,
        phone
      });
      setSuccessMsg(`🚀 Pedido enviado com sucesso! Notificamos os profissionais da categoria "${selectedCategory}" na sua região.`);
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('my_orders');
      }, 3500);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectCatAndScroll = (catName: string) => {
    setSelectedCategory(catName);
    if (!title) setTitle(`Orçamento de ${catName}`);
    setActiveTab('request');
    const formEl = document.getElementById('request-form-section');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case 'imediato': return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">⚡ Emergência Imediata</span>;
      case 'alta': return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200">🔥 Urgência Alta</span>;
      case 'media': return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">⏱️ Urgência Média</span>;
      default: return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">📅 Baixa / Planejado</span>;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs sm:text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>100% Gratuito para Clientes • Zero Taxas de Intermediação</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Encontre os Melhores <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">Profissionais</span> da Sua Região
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            Descreva seu problema ou serviço. O aplicativo envia uma notificação em tempo real para os especialistas qualificados, que chamam você diretamente pelo seu WhatsApp!
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                setActiveTab('request');
                document.getElementById('request-form-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <PlusCircle className="w-5 h-5" />
              Solicitar Serviço Agora
            </button>
            <button
              onClick={() => setActiveTab('my_orders')}
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold transition-all text-sm sm:text-base"
            >
              Meus Pedidos ({myOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Client Rating Profile Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30 text-2xl font-black">
            {currentUser.clientRating || currentUser.rating ? `${(currentUser.clientRating || currentUser.rating)?.toFixed(1)}★` : '★'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                ⭐ Reputação de Cliente Conecta Pro
              </span>
              {(currentUser.clientRatingsCount || currentUser.ratingsCount || 0) > 0 && (
                <span className="text-xs font-bold text-slate-500">
                  Baseado em {currentUser.clientRatingsCount || currentUser.ratingsCount} avaliações de profissionais
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {currentUser.clientRating || currentUser.rating
                ? `Média no Perfil: ${(currentUser.clientRating || currentUser.rating)?.toFixed(1)} de 5.0 estrelas`
                : 'Seu perfil ainda está construindo reputação na plataforma'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Após a conclusão de cada ordem de serviço, os profissionais avaliam sua pontualidade no pagamento, clareza na descrição do problema e hospitalidade no atendimento. Clientes com nota <strong>acima de 4.5★</strong> recebem orçamentos até 3x mais rápido!
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col items-center justify-center min-w-[180px] text-center w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sua Média Geral</span>
          <div className="text-3xl font-black text-amber-600 flex items-center justify-center gap-1 my-1">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            <span>{currentUser.clientRating || currentUser.rating ? (currentUser.clientRating || currentUser.rating)?.toFixed(1) : '5.0'}</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Excelente Reputação ✅
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('request')}
          className={`pb-4 px-2 text-base font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'request'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          Novo Pedido Gratuito
        </button>
        <button
          onClick={() => setActiveTab('my_orders')}
          className={`pb-4 px-2 text-base font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'my_orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-5 h-5" />
          Meus Chamados & Orçamentos
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-extrabold">{myOrders.length}</span>
        </button>
      </div>

      {activeTab === 'request' ? (
        <div className="space-y-12">
          
          {/* Categories Grid */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Categorias de Serviço</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-black">{categories.length} Especialidades</span>
                </h2>
                <p className="text-sm text-slate-500">Selecione a especialidade ideal para o seu projeto ou reparo (100% regulamentadas e verificadas)</p>
              </div>

              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="🔍 Buscar especialidade..."
                  value={catQuery}
                  onChange={(e) => setCatQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {categories
                .filter(c => !catQuery || c.name.toLowerCase().includes(catQuery.toLowerCase()) || c.description.toLowerCase().includes(catQuery.toLowerCase()))
                .map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => selectCatAndScroll(cat.name)}
                  className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedCategory === cat.name
                      ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg'
                  }`}
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      selectedCategory === cat.name ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      <DynamicIcon name={cat.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{cat.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      {cat.activeProsCount || 12} pros disponíveis
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Request Form Section */}
          <div id="request-form-section" className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Formulário de Solicitação Gratuita</h3>
                <p className="text-sm text-slate-500">Os profissionais cadastrados e com plano ativo receberão o alerta no app</p>
              </div>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-3 font-semibold shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Categoria do Trabalho *</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      if (!title && e.target.value) setTitle(`Orçamento de ${e.target.value}`);
                    }}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800 transition-all outline-none"
                  >
                    <option value="">Selecione a especialidade...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título / Resumo do Pedido *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Instalação de chuveiro 220v ou Troca de tomadas"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição Detalhada do Problema / Serviço *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte os detalhes: o que está quebrado, qual o tamanho do ambiente, se você já possui as peças compradas, horários preferidos para receber o profissional..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-800 transition-all outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nível de Urgência</label>
                  <select
                    value={urgency}
                    onChange={(e: any) => setUrgency(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 outline-none"
                  >
                    <option value="baixa">📅 Baixa (Para os próximos dias)</option>
                    <option value="media">⏱️ Média (Esta semana)</option>
                    <option value="alta">🔥 Alta (O quanto antes / Amanhã)</option>
                    <option value="imediato">⚡ Emergência / Imediato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Sua Cidade / Bairro *</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex: São Paulo, SP - Pinheiros"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Seu WhatsApp / Telefone *</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Apenas profissionais com plano em dia verão seu número.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Seus dados são protegidos pelo sistema Conecta Pro.</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando Pedido...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Publicar Solicitação Gratuita</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* My Orders Feed */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Meus Pedidos & Chamados</h2>
              <p className="text-sm text-slate-500">Acompanhe as solicitações que você enviou para os profissionais</p>
            </div>
            <button
              onClick={() => setActiveTab('request')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow hover:bg-blue-500 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Nova Solicitação
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {myOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {order.category}
                    </span>
                    {getUrgencyBadge(order.urgency)}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">{order.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                    "{order.description}"
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {order.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-slate-400" />
                      Seu Contato: {order.clientPhone}
                    </span>
                  </div>

                  {order.status === 'completed' && order.clientRating && (
                    <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 text-left space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-600" />
                          Avaliação Recebida pelo Profissional:
                        </span>
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" /> {order.clientRating}.0 ★
                        </span>
                      </div>
                      {order.clientRatingComment && (
                        <p className="text-xs text-amber-900 italic font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-200/50">
                          "{order.clientRatingComment}"
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold pt-1">
                        <span>🛠️ Avaliado por: <strong>{order.assignedProName || 'Profissional Conecta Pro'}</strong></span>
                        {order.clientRatedAt && <span>📅 {new Date(order.clientRatedAt).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Column */}
                <div className="sm:w-64 flex flex-col justify-between items-start sm:items-end border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
                  <div className="w-full sm:text-right">
                    <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">Status do Atendimento</span>
                    {order.status === 'open' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        Aguardando Profissional
                      </span>
                    ) : order.status === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Em Atendimento
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Concluído
                      </span>
                    )}
                  </div>

                  <div className="w-full mt-4 sm:mt-0 space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 block">Profissionais notificados na sua região</span>
                      <strong className="text-sm text-slate-800">12 a 18 especialistas</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Box */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
            <HelpCircle className="w-4 h-4" />
            Central de Ajuda Direta
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Teve alguma dúvida ou problema no aplicativo?</h3>
          <p className="text-slate-300 text-sm max-w-xl">
            Acione o suporte a qualquer momento. Seu chamado é levado direto para o painel do Administrador para resolução rápida.
          </p>
        </div>
        <button
          onClick={onOpenSupport}
          className="px-6 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
        >
          <HelpCircle className="w-5 h-5 text-blue-600" />
          Acionar Suporte do App
        </button>
      </div>

    </div>
  );
};
