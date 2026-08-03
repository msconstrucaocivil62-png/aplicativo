import React, { useState } from 'react';
import { User, ServiceCategory, UserRole } from '../types';
import { X, UserCheck, Briefcase, PlusCircle, ArrowRight, Sparkles, Check, Phone, Eye, EyeOff, KeyRound, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  categories: ServiceCategory[];
  onSwitchUser: (userId: string) => Promise<void>;
  onLoginUser?: (email: string, password?: string) => Promise<void>;
  onRegisterUser: (data: any) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  categories,
  onSwitchUser,
  onLoginUser,
  onRegisterUser
}) => {
  const [tab, setTab] = useState<'login' | 'switch' | 'register' | 'recover'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('pro');
  const [regPhone, setRegPhone] = useState('(11) 98888-7777');
  const [regCats, setRegCats] = useState<string[]>(['Eletricista']);
  const [regBio, setRegBio] = useState('');
  const [loading, setLoading] = useState(false);

  // Recover password state
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverStep, setRecoverStep] = useState<1 | 2>(1);
  const [recoverMsg, setRecoverMsg] = useState('');
  const [recoverError, setRecoverError] = useState('');

  if (!isOpen) return null;

  const handleSwitch = async (id: string) => {
    setLoading(true);
    await onSwitchUser(id);
    setLoading(false);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !onLoginUser) return;
    setLoading(true);
    setLoginError('');
    try {
      await onLoginUser(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
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
        password: regPassword,
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

  const handleRecoverRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecoverError('');
    setRecoverMsg('');
    try {
      if (!supabase || !isSupabaseConfigured) throw new Error('Supabase não configurado no aplicativo.');
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(recoverEmail.trim(), { redirectTo });
      if (error) throw error;
      setRecoverStep(2);
      setRecoverMsg('Enviamos um link para seu e-mail. Abra-o para definir uma nova senha.');
    } catch (err: any) {
      setRecoverError(err.message || 'Não foi possível enviar o e-mail.');
    } finally {
      setLoading(false);
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
            <span>Acesso — O Profissional Certo</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Entre ou crie sua conta</h2>
          <p className="text-slate-300 text-sm mt-1">
            Clientes e profissionais acessam automaticamente a área correspondente ao seu perfil.
          </p>

          <div className="flex flex-wrap gap-4 mt-6 border-b border-slate-800">
            <button
              onClick={() => setTab('login')}
              className={`pb-3 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                tab === 'login' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              🔐 Login no Sistema
            </button>
            {import.meta.env.VITE_DEMO_MODE === 'true' && <button
              onClick={() => setTab('switch')}
              className={`pb-3 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                tab === 'switch' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              🔄 Alternar Perfil Demonstrativo
            </button>}
            <button
              onClick={() => setTab('register')}
              className={`pb-3 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                tab === 'register' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              ✨ Cadastrar Novo Perfil
            </button>
            <button
              onClick={() => { setTab('recover'); setRecoverStep(1); setRecoverError(''); setRecoverMsg(''); }}
              className={`pb-3 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-1 ${
                tab === 'recover' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Esqueci a Senha</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {tab === 'login' ? (
            <div className="space-y-6">
              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Ou confirme seu e-mail e senha abaixo para entrar no sistema:
                </span>

                {loginError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <span>⚠️</span> {loginError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Acesso *</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">Senha *</label>
                      <button
                        type="button"
                        onClick={() => { setTab('recover'); setRecoverStep(1); setRecoverError(''); setRecoverMsg(''); }}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        title={showLoginPassword ? "Ocultar senha" : "Ver senha / conferir digitação"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {loading ? 'Validando...' : 'Acessar Plataforma 🚀'}
                  </button>
                </div>
              </form>
            </div>
          ) : tab === 'switch' ? (
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
                              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
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

            </div>
          ) : tab === 'recover' ? (
            /* RECOVER PASSWORD FORM */
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-blue-900 space-y-1">
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Recuperação Segura de Acesso</span>
                </h4>
                <p className="text-xs text-blue-800">
                  Digite o e-mail cadastrado. Você receberá um link seguro para definir uma nova senha.
                </p>
              </div>

              {recoverError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{recoverError}</span>
                </div>
              )}

              {recoverMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-sm text-emerald-900">{recoverMsg}</span>

                  </div>
                </div>
              )}

              {recoverStep === 1 ? (
                <form onSubmit={handleRecoverRequest} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">E-mail Cadastrado na Plataforma *</label>
                    <input
                      type="email"
                      required
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      placeholder="Ex: seu@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 text-sm font-semibold outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Voltar ao Login
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-slate-600">Abra o link recebido no seu e-mail. A página de nova senha será exibida automaticamente.</p>
                  <button type="button" onClick={() => setTab('login')} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs">Voltar ao login</button>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Senha de Acesso *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Sua senha"
                      className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm font-semibold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      title={showRegPassword ? "Ocultar senha" : "Ver senha para conferir"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Clique no olho para conferir.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Conta *</label>
                  <select
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-extrabold outline-none"
                  >
                    <option value="pro">🛠️ Profissional Prestador</option>
                    <option value="client">👤 Cliente Gratuito</option>
                    <option value="admin">👑 Administrador</option>
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
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-amber-600 text-white font-black text-sm shadow-lg shadow-blue-500/25 hover:brightness-110 flex items-center gap-2 cursor-pointer"
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
