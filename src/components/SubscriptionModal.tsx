import React, { useState } from 'react';
import { User, SubscriptionPlan, PaymentTransaction, AppConfig } from '../types';
import { X, Sparkles, CheckCircle, QrCode, CreditCard, ShieldCheck, ArrowRight, Zap, AlertCircle, Copy, Check, Building2 } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  plans: SubscriptionPlan[];
  config?: AppConfig | null;
  onSelectPlanAndPay: (planId: string, method: 'pix' | 'credit_card') => Promise<any>;
  onSimulateWebhookApproval: (trxId: string, daysToAdd: number) => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  plans,
  config,
  onSelectPlanAndPay,
  onSimulateWebhookApproval
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [activeTrx, setActiveTrx] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  if (!isOpen) return null;

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleCreateCheckout = async () => {
    setIsLoading(true);
    try {
      const res = await onSelectPlanAndPay(selectedPlanId, paymentMethod);
      setActiveTrx(res);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar cobrança.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeTrx) return;
    setIsLoading(true);
    try {
      await onSimulateWebhookApproval(activeTrx.transaction.id, selectedPlan.days);
      setIsApproved(true);
      setTimeout(() => {
        setIsApproved(false);
        setActiveTrx(null);
        onClose();
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Erro na aprovação simulada.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPix = () => {
    if (activeTrx?.qrCode) {
      navigator.clipboard.writeText(activeTrx.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-6 sm:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Assinatura Profissional O Profissional Certo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Escolha seu Plano de Acesso</h2>
          <p className="text-slate-200 text-sm mt-1 max-w-xl">
            Liberte seu perfil! Pague a taxa para manter seu cadastro ativo na plataforma e receber todas as notificações de clientes sem bloqueios.
          </p>
        </div>

        {isApproved ? (
          <div className="p-12 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle className="w-14 h-14" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">🎉 Pagamento Aprovado pelo Mercado Pago!</h3>
              <p className="text-base text-slate-600 max-w-md mx-auto">
                O webhook do Mercado Pago notificou o servidor com sucesso. Seu plano está agora <strong>ATIVO por +{selectedPlan.days} dias</strong>!
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold max-w-md mx-auto">
              Todos os telefones e contatos de WhatsApp dos clientes já estão liberados no seu painel.
            </div>
          </div>
        ) : !activeTrx ? (
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* 1. PLAN OPTIONS */}
            <div className="space-y-4">
              <label className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">
                1. Selecione a frequência:
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-lg ring-4 ring-blue-600/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {plan.badge && (
                        <span className={`absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm ${
                          plan.id === 'annual' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {plan.badge}
                        </span>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-lg">{plan.title}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="pt-2">
                          <span className="text-3xl font-black text-slate-900">R$ {plan.price.toFixed(2)}</span>
                          <span className="text-xs text-slate-500 font-bold block mt-0.5">
                            {plan.id === 'monthly' ? 'por mês' : plan.id === 'semiannual' ? 'a cada 6 meses' : 'por ano'}
                          </span>
                        </div>

                        {plan.savings && (
                          <div className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                            💰 {plan.savings}
                          </div>
                        )}

                        <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                          {plan.description}
                        </p>
                      </div>

                      {plan.installmentText && (
                        <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-bold text-blue-700 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Parcele: {plan.installmentText}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. PAYMENT METHODS */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">
                2. Forma de Pagamento (Mercado Pago):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${
                    paymentMethod === 'pix' ? 'border-emerald-600 bg-emerald-50/60 font-bold' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Pix Instantâneo</span>
                    <span className="text-xs text-slate-500">Aprovação imediata via QR Code</span>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${
                    paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50/60 font-bold' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Cartão de Crédito</span>
                    <span className="text-xs text-slate-500">
                      {selectedPlanId === 'annual' ? 'Parcele em até 12x no cartão' : 'À vista no crédito / débito'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCheckout}
                disabled={isLoading}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:brightness-110 text-white font-black text-base shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white" />
                    <span>Gerar Cobrança de R$ {selectedPlan.price.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          /* PAYMENT CHECKOUT / QR CODE SCREEN */
          <div className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Mercado Pago • {paymentMethod === 'pix' ? 'Cobrança Pix' : 'Checkout Cartão'}</span>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedPlan.title} — R$ {selectedPlan.price.toFixed(2)}</h3>
              </div>
              <button
                onClick={() => setActiveTrx(null)}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                ← Escolher outro plano
              </button>
            </div>

            {paymentMethod === 'pix' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center space-y-4">
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                    {/* Simulated Pix QR Code graphic */}
                    <div className="w-48 h-48 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-4 text-white space-y-2">
                      <QrCode className="w-24 h-24 text-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-mono tracking-widest text-emerald-300 font-bold">PIX QR CODE ATIVO</span>
                      <span className="text-[10px] text-slate-400">R$ {selectedPlan.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 block font-medium">Abra o app do seu banco e escaneie o QR Code acima.</span>
                </div>

                <div className="space-y-6">
                  {/* Banking Receiver Account Details Box */}
                  <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                        <Building2 className="w-4 h-4" />
                        <span>💳 Dados para Depósito & Baixa Oficial</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">100% Seguro</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Titular Beneficiário:</span>
                        <strong className="text-white font-black truncate block">{config?.pixReceiverName || 'O Profissional Certo Serviços Ltda'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Instituição Financeira:</span>
                        <strong className="text-emerald-300 font-black truncate block">{config?.pixReceiverBank || 'Mercado Pago / Banco do Brasil'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">CNPJ / CPF do Titular:</span>
                        <strong className="text-slate-200 font-mono font-bold block">{config?.pixReceiverCnpjCpf || '45.123.456/0001-89'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Chave Pix Oficial:</span>
                        <strong className="text-amber-300 font-mono font-black truncate block">{config?.pixReceiverKey || 'financeiro@conectapro.com.br'}</strong>
                      </div>
                    </div>

                    {config?.pixInstructions && (
                      <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-300 italic leading-relaxed">
                        ℹ️ {config.pixInstructions}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase block">Código Pix Copia e Cola:</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={activeTrx.qrCode}
                        className="w-full pl-3 pr-24 py-3 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs text-slate-600 outline-none truncate"
                      />
                      <button
                        onClick={copyPix}
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-blue-700">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Como funciona no O Profissional Certo:</span>
                    </div>
                    <p>Assim que você pagar no app do seu banco, o Mercado Pago envia um aviso automático (Webhook) para o servidor, liberando seu perfil em até 3 segundos.</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={handleSimulatePayment}
                      disabled={isLoading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 animate-pulse"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 fill-white" />
                          <span>⚡ Simular Pagamento Pix (Testar Aprovação Instantânea)</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400 block text-center mt-2">Clique no botão acima para simular o Webhook do Mercado Pago no modo demonstração!</span>
                  </div>
                </div>
              </div>
            ) : (
              /* CREDIT CARD CHECKOUT SIMULATION */
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">MP</div>
                      <div>
                        <h4 className="font-bold text-slate-900">Mercado Pago • Checkout Seguro</h4>
                        <span className="text-xs text-slate-500">Cartão de Crédito (Visa, Mastercard, Elo, Hipercard, Amex)</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-900">R$ {selectedPlan.price.toFixed(2)}</span>
                  </div>

                  {selectedPlanId === 'annual' && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
                      <span>🎉 Opção recomendada de parcelamento:</span>
                      <span className="text-sm font-black text-amber-950">12x de R$ 37,50 sem juros</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Número do Cartão (Simulação)</label>
                      <input type="text" readOnly value="4532 •••• •••• 8891" className="w-full px-3 py-2.5 rounded-xl border bg-white text-slate-600 font-mono text-sm outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nome no Cartão</label>
                      <input type="text" readOnly value={currentUser.name.toUpperCase()} className="w-full px-3 py-2.5 rounded-xl border bg-white text-slate-600 text-sm outline-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:brightness-110 text-white font-black text-base shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Simular Pagamento no Cartão (Aprovar +{selectedPlan.days} dias)</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400 block text-center mt-2">No ambiente em produção, o usuário é direcionado ao Checkout Transparente do Mercado Pago.</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
