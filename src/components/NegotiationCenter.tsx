import React, { useMemo, useState } from 'react';
import { MessageCircle, Send, BadgeDollarSign, CheckCircle2, Clock3, BriefcaseBusiness } from 'lucide-react';
import { ServiceOrder, User } from '../types';

type Proposal = { id:string; orderId:string; proId:string; proName:string; amount:number; estimatedDays:number; message:string; status:'pending'|'accepted'|'rejected'; createdAt:string };
type ChatMessage = { id:string; orderId:string; senderId:string; senderName:string; text:string; createdAt:string };

interface Props {
  currentUser: User;
  orders: ServiceOrder[];
  proposals: Proposal[];
  messages: ChatMessage[];
  onRefresh: () => Promise<void>;
}

export function NegotiationCenter({ currentUser, orders, proposals, messages, onRefresh }: Props) {
  const relevant = useMemo(() => currentUser.role === 'client'
    ? orders.filter(o => o.clientId === currentUser.id)
    : orders.filter(o => (o.status === 'open' && (currentUser.categories || []).includes(o.category)) || o.assignedProId === currentUser.id), [orders, currentUser]);
  const [orderId, setOrderId] = useState(relevant[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('1');
  const [proposalText, setProposalText] = useState('');
  const [chatText, setChatText] = useState('');
  const activeOrder = relevant.find(o => o.id === orderId) || relevant[0];
  const activeProposals = proposals.filter(p => p.orderId === activeOrder?.id);
  const activeMessages = messages.filter(m => m.orderId === activeOrder?.id);

  const post = async (url:string, body:any) => {
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
    await onRefresh();
  };

  if (!activeOrder) return null;

  return <section className="mb-8 rounded-3xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5 sm:p-7 shadow-lg">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full"><BriefcaseBusiness className="w-4 h-4"/> Central de negociação V2</span>
        <h2 className="text-2xl font-black text-slate-900 mt-2">Propostas, contratação e chat no aplicativo</h2>
        <p className="text-sm text-slate-600">Negocie com segurança sem sair do O Profissional Certo.</p>
      </div>
      <select value={activeOrder.id} onChange={e=>setOrderId(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-4 py-3 font-bold text-sm max-w-md">
        {relevant.map(o=><option key={o.id} value={o.id}>{o.category} — {o.title}</option>)}
      </select>
    </div>

    <div className="grid lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2"><BadgeDollarSign className="text-emerald-600"/><h3 className="font-black text-lg">Orçamentos recebidos</h3></div>
        {currentUser.role === 'pro' && activeOrder.status === 'open' && <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border">
          <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="Valor R$" className="rounded-lg border px-3 py-2" />
          <input value={days} onChange={e=>setDays(e.target.value)} type="number" min="1" placeholder="Prazo em dias" className="rounded-lg border px-3 py-2" />
          <textarea value={proposalText} onChange={e=>setProposalText(e.target.value)} placeholder="Explique o que está incluso..." className="col-span-2 rounded-lg border px-3 py-2 min-h-20" />
          <button onClick={()=>post('/api/proposals/create',{orderId:activeOrder.id,proId:currentUser.id,amount,estimatedDays:days,message:proposalText}).then(()=>{setAmount('');setProposalText('')})} className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-black">Enviar proposta</button>
        </div>}
        <div className="space-y-3 max-h-72 overflow-auto">
          {activeProposals.length === 0 && <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl">Ainda não há propostas para este pedido.</p>}
          {activeProposals.map(p=><div key={p.id} className="p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between gap-3"><div><b>{p.proName}</b><p className="text-xs text-slate-500">Prazo: {p.estimatedDays} dia(s)</p></div><strong className="text-emerald-700 text-lg">R$ {p.amount.toFixed(2).replace('.',',')}</strong></div>
            <p className="text-sm text-slate-600 mt-2">{p.message}</p>
            <div className="mt-3 flex items-center justify-between"><span className={`text-xs font-black px-2 py-1 rounded-full ${p.status==='accepted'?'bg-emerald-100 text-emerald-700':p.status==='rejected'?'bg-slate-100 text-slate-500':'bg-amber-100 text-amber-700'}`}>{p.status==='accepted'?'ACEITA':p.status==='rejected'?'NÃO SELECIONADA':'EM ANÁLISE'}</span>
            {currentUser.role==='client' && p.status==='pending' && <button onClick={()=>post('/api/proposals/accept',{proposalId:p.id,clientId:currentUser.id})} className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-black"><CheckCircle2 className="w-4 h-4"/> Contratar</button>}</div>
          </div>)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col min-h-[420px]">
        <div className="flex items-center gap-2 mb-4"><MessageCircle className="text-blue-600"/><h3 className="font-black text-lg">Chat do serviço</h3><span className="ml-auto text-xs text-slate-500 flex items-center gap-1"><Clock3 className="w-3 h-3"/> histórico salvo</span></div>
        <div className="flex-1 space-y-3 overflow-auto max-h-72 pr-1">
          {activeMessages.map(m=><div key={m.id} className={`flex ${m.senderId===currentUser.id?'justify-end':'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.senderId===currentUser.id?'bg-blue-600 text-white':'bg-slate-100 text-slate-800'}`}><b className="text-xs block mb-1">{m.senderName}</b><p className="text-sm">{m.text}</p></div></div>)}
          {activeMessages.length===0 && <p className="text-sm text-slate-500 text-center py-10">Inicie a conversa sobre este serviço.</p>}
        </div>
        <div className="flex gap-2 mt-4"><input value={chatText} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&chatText.trim()) post('/api/messages/send',{orderId:activeOrder.id,senderId:currentUser.id,text:chatText}).then(()=>setChatText(''))}} placeholder="Digite sua mensagem..." className="flex-1 rounded-xl border border-slate-300 px-4 py-3"/><button onClick={()=>chatText.trim()&&post('/api/messages/send',{orderId:activeOrder.id,senderId:currentUser.id,text:chatText}).then(()=>setChatText(''))} className="bg-blue-600 text-white rounded-xl px-4"><Send className="w-5 h-5"/></button></div>
      </div>
    </div>
  </section>
}
