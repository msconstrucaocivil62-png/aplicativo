import React, { useState } from 'react';
import { User, SupportTicket } from '../types';
import { X, HelpCircle, Send, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  tickets: SupportTicket[];
  onCreateTicket: (subject: string, message: string) => Promise<void>;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  tickets,
  onCreateTicket
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const myTickets = tickets.filter(t => t.userId === currentUser.id || currentUser.role === 'admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setLoading(true);
    try {
      await onCreateTicket(subject, message);
      setSubject('');
      setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar chamado.');
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
            <HelpCircle className="w-4 h-4" />
            <span>Central de Atendimento Direto</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Suporte Conecta Pro</h2>
          <p className="text-slate-300 text-sm mt-1">
            Abra um chamado caso tenha dúvidas sobre pagamentos Pix/Cartão, ativação de planos ou problemas técnicos no app.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-3 font-semibold shadow-sm animate-bounce">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <span>Chamado enviado com sucesso! Nossa equipe administrativa já foi notificada.</span>
            </div>
          )}

          {/* New Ticket Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Abrir Novo Chamado de Suporte</h3>
            
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assunto / Motivo *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Problema com renovação de plano Pix ou Dúvida sobre clientes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Descreva seu problema *</label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explique detalhadamente o que ocorreu..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm font-medium outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Chamado para o Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Existing Tickets List */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base">Meus Chamados & Respostas do Admin ({myTickets.length})</h3>
            
            {myTickets.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                Você ainda não abriu nenhum chamado no suporte.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {myTickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-slate-900">{t.subject}</strong>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        t.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {t.status === 'open' ? 'Em Análise' : 'Resolvido'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">"{t.message}"</p>

                    {t.reply && (
                      <div className="p-3 rounded-xl bg-white border border-purple-200 text-purple-900 text-xs space-y-1 mt-2">
                        <span className="font-extrabold block text-purple-700">💬 Resposta do Administrador:</span>
                        <p className="font-medium">{t.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
