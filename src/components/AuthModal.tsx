import React, { useState } from 'react';
import { User, ServiceCategory, UserRole } from '../types';
import { X, UserCheck, Briefcase, ShieldAlert, PlusCircle, ArrowRight, Sparkles, Check, Phone } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  categories: ServiceCategory[];
  onSwitchUser: (userId: string) => Promise<void>;
  onRegisterUser: (data: any) => Promise<void>;
  onEnterAdminApp?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  categories,
  onSwitchUser,
  onRegisterUser,
  onEnterAdminApp
}) => {
  const [tab, setTab] = useState<'switch' | 'register'>('switch');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('pro');
  const [regPhone, setRegPhone] = useState('(11) 98888-7777');
  const [regCats, setRegCats] = useState<string[]>(['Eletricista']);
  const [regBio, setRegBio] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSwitch = async (id: string) => {
    setLoading(true);
    await onSwitchUser(id);
    setLoading(false);
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) return;
    setLoading(true);
    try {
      await onRegisterUser({
        name: regName,
        email: regEmail,
        role: regRole,
        phone: regPhone,
        categories: regRole === 'pro' ? regCats : undefined,
        bio: regBio
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catName: string) => {
    if (regCats.includes(catName)) {
      if (regCats.length > 1) {
        setRegCats(regCats.filter(c => c !== catName));
      }
    } else {
      setRegCats([...regCats, catName]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Simulador de Perfis e Acesso Conecta Pro</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Modo de Demonstração Interativo</h2>
          <p className="text-slate-300 text-sm mt-1">
            Alterne entre contas existentes ou cadastre um novo perfil para testar as regras de cobrança, bloqueio de plano expirado e painel admin.
          </p>

          <div className="flex gap-4 mt-6 border-b border-slate-800">
            <button
              onClick={() => setTab('switch')}
              className={`pb-3 font-bold text-sm transition-all border-b-2 ${
                tab === 'switch' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              🔄 Alternar Perfil Demonstrativo
            </button>
            <button
              onClick={() => setTab('register')}
              className={`pb-3 font-bold text-sm transition-all border-b-2 ${
                tab === 'register' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              ✨ Cadastrar Novo Perfil
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {tab === 'switch' ? (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Clique no perfil para testar a plataforma na visão dele:
              </span>

              <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {users.filter(u => u.role !== 'admin').map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isExpired = u.role === 'pro' && (u.planStatus === 'expired' || !u.planDueDate || new Date() > new Date(u.planDueDate));

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSwitch(u.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-600/10'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover border" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-base">{u.name}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase">
                                Em Uso
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                            {u.role === 'client' && (
                              <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                👤 Cliente Gratuito
                              </span>
                            )}
                            {u.role === 'admin' && (
                              <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                                👑 Administrador Geral
                              </span>
                            )}
                            {u.role === 'pro' && (
                              <>
                                <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                                  🛠️ Profissional ({u.categories?.join(', ')})
                                </span>
                                {isExpired ? (
                                  <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded animate-pulse">
                                    ⚠️ PLANO EXPIRADO / BLOQUEADO
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    ✅ PLANO ATIVO EM DIA
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <ArrowRight className={`w-5 h-5 transition-transform ${isCurrent ? 'text-blue-600 translate-x-1' : 'text-slate-300'}`} />
                    </div>
                  );
                })}
              </div>

              {/* Separate Exclusive Admin App Box */}
              {onEnterAdminApp && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-500/30">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Aplicativo Exclusivo de Gestão</span>
                      </div>
                      <h4 className="font-extrabold text-white text-base">Console do Administrador Geral 👑</h4>
                      <p className="text-xs text-slate-300">Acesso isolado para gestão de taxas, ordens, tickets e credenciais de pagamento.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEnterAdminApp();
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
                    >
                      <span>Acessar Portal Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo / Empresa *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: João Elétrica Rápida"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">E-mail de Cadastro *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="joao@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Conta *</label>
                  <select
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-extrabold outline-none"
                  >
                    <option value="pro">🛠️ Profissional Prestador (Taxa / Assinatura)</option>
                    <option value="client">👤 Cliente (Solicitação 100% Gratuita)</option>
                    <option value="admin">👑 Administrador Geral (Gestão & Finanças da Plataforma)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold outline-none"
                  />
                </div>
              </div>

              {regRole === 'pro' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block">Selecione suas Categorias de Atuação:</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {categories.map((c) => {
                      const sel = regCats.includes(c.name);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => toggleCategory(c.name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                            sel ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border'
                          }`}
                        >
                          {sel && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium block">
                    ⚠️ Importante: Novos profissionais começam com o status de plano <strong>Expirado/Bloqueado</strong> até realizarem a primeira renovação (Mensal R$ 50, Semestral R$ 200 ou Anual R$ 450).
                  </span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-blue-500/25 hover:brightness-110 flex items-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Cadastrar e Acessar Agora</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
