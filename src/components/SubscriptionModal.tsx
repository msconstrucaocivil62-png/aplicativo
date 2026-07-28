import React, { useState } from 'react';
import { Check, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { SubscriptionPlan, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  plans: SubscriptionPlan[];
  onSelectPlanAndPay: (planId: string, method: 'pix' | 'credit_card') => Promise<any>;
}

export const SubscriptionModal: React.FC<Props> = ({ isOpen, onClose, plans, onSelectPlanAndPay }) => {
  const [planId, setPlanId] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');
  const [method, setMethod] = useState<'pix' | 'credit_card'>('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  if (!isOpen) return null;
  const selected = plans.find(plan => plan.id === planId) || plans[0];

  const startCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await onSelectPlanAndPay(planId, method);
      if (!result?.initPoint) throw new Error(result?.error || 'Checkout indisponível.');
      setCheckoutUrl(result.initPoint);
      window.location.assign(result.initPoint);
    } catch (err: any) {
      setError(err.message || 'Não foi possível iniciar o pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8">
        <header className="bg-gradient-to-r from-blue-700 to-indigo-700 p-7 text-white">
          <button aria-label="Fechar" onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full bg-white/10"><X /></button>
          <h2 className="text-3xl font-black">Ative seu perfil profissional</h2>
          <p className="mt-2 text-blue-100">O pagamento é concluído no ambiente seguro do Mercado Pago.</p>
        </header>
        <div className="p-7 space-y-7">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <button key={plan.id} type="button" onClick={() => setPlanId(plan.id)} className={`text-left p-5 rounded-2xl border-2 ${planId === plan.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                <span className="flex justify-between font-black">{plan.title}{planId === plan.id && <Check className="w-5" />}</span>
                <strong className="block text-3xl mt-3">R$ {plan.price.toFixed(2)}</strong>
                <small className="text-slate-500">{plan.id === 'monthly' ? '1 mês' : plan.id === 'semiannual' ? '6 meses' : '12 meses'}</small>
              </button>
            ))}
          </div>
          <div>
            <p className="font-black mb-3">Forma preferida</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setMethod('pix')} className={`p-4 rounded-xl border-2 font-bold ${method === 'pix' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>Pix</button>
              <button type="button" onClick={() => setMethod('credit_card')} className={`p-4 rounded-xl border-2 font-bold ${method === 'credit_card' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>Cartão no Mercado Pago</button>
            </div>
          </div>
          <div className="flex gap-3 p-4 rounded-xl bg-slate-50 text-sm text-slate-700"><ShieldCheck className="text-emerald-600 shrink-0" /><p>O Conecta Pro não recebe número de cartão ou CVV. A ativação ocorre somente após o Mercado Pago confirmar o pagamento ao servidor.</p></div>
          {error && <div role="alert" className="p-4 rounded-xl bg-rose-50 text-rose-700 font-bold">{error}</div>}
          {checkoutUrl ? <a href={checkoutUrl} className="w-full flex justify-center gap-2 p-4 rounded-xl bg-blue-700 text-white font-black"><ExternalLink />Abrir checkout novamente</a> :
          <button type="button" disabled={loading || !selected} onClick={startCheckout} className="w-full p-4 rounded-xl bg-blue-700 text-white font-black disabled:opacity-50">{loading ? 'Preparando checkout seguro…' : `Pagar R$ ${selected?.price.toFixed(2)} no Mercado Pago`}</button>}
        </div>
      </div>
    </div>
  );
};
