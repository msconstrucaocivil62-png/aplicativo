import React, { useState } from 'react';
import { User, ServiceCategory } from '../types';
import { X, UserCheck, Shield, Phone, MapPin, Eye, EyeOff, Lock, Sparkles, Check, Image as ImageIcon, Briefcase } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  categories?: ServiceCategory[];
  onUpdateProfile: (updatedData: any) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  categories = [],
  onUpdateProfile
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '(11) 99999-9999');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [location, setLocation] = useState(currentUser?.location || 'São Paulo, SP');
  const [password, setPassword] = useState((currentUser as any)?.password || 'Murilo2@@8');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(currentUser?.categories || ['Eletricista']);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !currentUser) return null;

  const toggleCategory = (catName: string) => {
    if (selectedCats.includes(catName)) {
      if (selectedCats.length > 1) {
        setSelectedCats(selectedCats.filter(c => c !== catName));
      }
    } else {
      setSelectedCats([...selectedCats, catName]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await onUpdateProfile({
        userId: currentUser.id,
        name,
        phone,
        bio,
        avatar,
        location,
        password,
        categories: currentUser.role === 'pro' ? selectedCats : undefined
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados do perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Gestão Pessoal & Segurança</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Editar Meu Perfil e Senha de Acesso</h2>
          <p className="text-slate-300 text-sm mt-1">
            Mantenha suas informações pessoais, especialidades e senha sempre atualizadas e seguras no sistema.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
              <span>Perfil e senha atualizados com sucesso! Salvando no banco de dados...</span>
            </div>
          )}

          {/* User ID & Role Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-bold">E-mail (Login Oficial):</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border font-semibold text-slate-900">{currentUser.email}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold uppercase text-[10px]">
              {currentUser.role === 'admin' ? '👑 Administrador Master' : currentUser.role === 'pro' ? '🛠️ Profissional' : '👤 Cliente'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo / Razão Social *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 text-sm font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Telefone / WhatsApp *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 text-sm font-semibold outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Localização / Cidade *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 text-sm font-semibold outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Senha de Acesso (Login) *</label>
                <span className="text-[10px] text-blue-600 font-bold">Confira antes de salvar 👁️</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 text-sm font-semibold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar senha" : "Ver senha para conferir"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">URL da Foto de Perfil (Avatar)</label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 text-xs font-mono outline-none"
              />
            </div>
          </div>

          {currentUser.role === 'pro' && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Minhas Especialidades / Categorias Ativas:</span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                {categories.map((c) => {
                  const sel = selectedCats.includes(c.name);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleCategory(c.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                        sel ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      {sel && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Biografia / Resumo Profissional</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva sua experiência, especialidades ou bio..."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 text-sm font-medium outline-none"
            />
          </div>

          {/* Footer Actions */}
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
              disabled={loading || success}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-blue-500/25 hover:brightness-110 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações e Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
