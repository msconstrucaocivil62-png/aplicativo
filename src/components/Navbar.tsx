import React from 'react';
import { User, UserRole } from '../types';
import { Zap, ShieldAlert, CheckCircle, RefreshCw, UserCheck, HelpCircle, LogOut, ArrowRightLeft, Sparkles, Building2, UserCog } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onOpenAuthModal: () => void;
  onOpenEditProfileModal: () => void;
  onOpenSupportModal: () => void;
  onOpenSubscribeModal: () => void;
  onResetDemo: () => void;
  onEnterAdminApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuthModal,
  onOpenEditProfileModal,
  onOpenSupportModal,
  onOpenSubscribeModal,
  onResetDemo,
  onEnterAdminApp
}) => {
  const getRoleBadge = (role: UserRole, planStatus?: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5" />
          Administrador Geral
        </span>
      );
    }
    if (role === 'pro') {
      if (planStatus === 'active') {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5" />
            Profissional • Plano Ativo
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            Profissional • Plano Expirado
          </span>
        );
      }
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
        <UserCheck className="w-3.5 h-3.5" />
        Cliente (Grátis)
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Conecta<span className="text-blue-400">Pro</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Marketplace
            </span>
          </div>
        </div>

        {/* Center Banner / Quick Status */}
        <div className="hidden md:flex items-center gap-3">
          {getRoleBadge(currentUser.role, currentUser.planStatus)}
          {currentUser.role === 'pro' && currentUser.planStatus === 'expired' && (
            <button
              onClick={onOpenSubscribeModal}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md hover:brightness-110 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Renovar Agora
            </button>
          )}
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Exclusive Admin Portal Launch Button */}
          {onEnterAdminApp && (
            <button
              onClick={onEnterAdminApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black transition-all shadow-md shadow-purple-600/30 border border-purple-400/40 cursor-pointer"
              title="Acessar Aplicativo Exclusivo do Administrador (Console Geral)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden md:inline">Painel</span>
              <span>Admin 👑</span>
            </button>
          )}

          {/* Demo Account Switcher Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-all shadow-sm group"
            title="Trocar entre perfis de Cliente, Profissional Ativo, Expirado ou Admin"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-400 group-hover:rotate-180 transition-transform duration-300" />
            <span className="hidden sm:inline">Modo Demo / Perfil:</span>
            <span className="font-bold text-white underline decoration-blue-400">{currentUser.name.split(' ')[0]}</span>
          </button>

          {/* Edit Profile Button */}
          <button
            onClick={onOpenEditProfileModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Editar dados do Meu Perfil, Contato e Senha de Acesso"
          >
            <UserCog className="w-4 h-4 text-blue-300" />
            <span className="hidden md:inline">Editar Perfil</span>
          </button>

          {/* Support Ticket button */}
          <button
            onClick={onOpenSupportModal}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            title="Central de Suporte / Abrir Chamado"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Reset Demo Data button */}
          <button
            onClick={onResetDemo}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 text-xs transition-all border border-slate-700/50"
            title="Resetar dados iniciais do banco"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

        </div>
      </div>
    </header>
  );
};
