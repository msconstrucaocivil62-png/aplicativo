import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, Camera, LocateFixed, MapPin, Navigation, Upload, UsersRound } from 'lucide-react';
import { ServiceOrder, User } from '../types';

type Attachment = { id: string; name: string; type: string; dataUrl: string };

function distanceKm(aLat?: number, aLng?: number, bLat?: number, bLng?: number) {
  if ([aLat, aLng, bLat, bLng].some(v => typeof v !== 'number')) return null;
  const toRad = (v:number) => v * Math.PI / 180;
  const R = 6371;
  const dLat = toRad((bLat as number) - (aLat as number));
  const dLng = toRad((bLng as number) - (aLng as number));
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat as number))*Math.cos(toRad(bLat as number))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

export function Phase2Tools({ currentUser, users, category, latitude, longitude, scheduledAt, attachments, onCoords, onSchedule, onAttachments }:{
  currentUser:User; users:User[]; category:string; latitude?:number; longitude?:number; scheduledAt:string; attachments:Attachment[];
  onCoords:(lat:number,lng:number)=>void; onSchedule:(v:string)=>void; onAttachments:(v:Attachment[])=>void;
}) {
  const [locating,setLocating]=useState(false);
  const nearby = useMemo(() => users.filter(u => u.role==='pro' && (!category || (u.categories||[]).includes(category))).map(u => ({...u, km:distanceKm(latitude,longitude,u.latitude,u.longitude)})).sort((a,b)=>(a.km??9999)-(b.km??9999)).slice(0,5), [users,category,latitude,longitude]);

  const locate=()=>{
    if(!navigator.geolocation){ alert('Seu navegador não oferece localização.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p=>{onCoords(p.coords.latitude,p.coords.longitude);setLocating(false)},()=>{setLocating(false);alert('Não foi possível obter sua localização. Autorize o acesso no navegador.')},{enableHighAccuracy:true,timeout:12000});
  };
  const files=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const selected=Array.from(e.target.files ?? []).slice(0,4) as File[];
    const converted:Attachment[]=[];
    for(const f of selected){
      if(f.size>2_500_000){ alert(`${f.name} é maior que 2,5 MB.`); continue; }
      const dataUrl=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(f)});
      converted.push({id:`att-${Date.now()}-${converted.length}`,name:f.name,type:f.type,dataUrl});
    }
    onAttachments([...attachments,...converted].slice(0,4));
  };

  return <div className="grid lg:grid-cols-2 gap-5">
    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-4">
      <div className="flex items-center gap-2"><Navigation className="w-5 h-5 text-blue-600"/><h3 className="font-black text-slate-900">Localização e profissionais próximos</h3></div>
      <button type="button" onClick={locate} disabled={locating} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black py-3 flex items-center justify-center gap-2 disabled:opacity-60"><LocateFixed className="w-5 h-5"/>{locating?'Localizando...':'Usar minha localização atual'}</button>
      {typeof latitude==='number' && <p className="text-xs text-emerald-700 font-bold flex gap-1 items-center"><MapPin className="w-4 h-4"/> Localização capturada com segurança para este pedido.</p>}
      <div className="space-y-2">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex gap-2 items-center"><UsersRound className="w-4 h-4"/> Especialistas compatíveis</div>
        {nearby.length===0 && <p className="text-sm text-slate-500">Selecione uma categoria para visualizar profissionais.</p>}
        {nearby.map((u:any)=><div key={u.id} className="bg-white border rounded-xl p-3 flex justify-between gap-3"><div><b className="text-sm">{u.name}</b><p className="text-xs text-slate-500">{(u.categories||[]).slice(0,2).join(' • ')}</p></div><span className="text-xs font-black text-blue-700">{u.km!=null?`${u.km.toFixed(1)} km`:'região cadastrada'}</span></div>)}
      </div>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-amber-600"/><h3 className="font-black text-slate-900">Agendamento e fotos</h3></div>
      <label className="block text-xs font-black uppercase text-slate-500">Data e horário desejados</label>
      <input type="datetime-local" value={scheduledAt} onChange={e=>onSchedule(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3"/>
      <label className="cursor-pointer w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 p-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-600"><Upload className="w-5 h-5"/> Anexar até 4 imagens<input className="hidden" type="file" accept="image/*" multiple onChange={files}/></label>
      <div className="grid grid-cols-4 gap-2">{attachments.map(a=><button type="button" key={a.id} onClick={()=>onAttachments(attachments.filter(x=>x.id!==a.id))} title="Clique para remover" className="aspect-square overflow-hidden rounded-lg border bg-slate-100"><img src={a.dataUrl} className="w-full h-full object-cover"/></button>)}</div>
      <p className="text-xs text-slate-500"><Camera className="inline w-3.5 h-3.5 mr-1"/>As imagens ficam vinculadas ao pedido. Limite de 2,5 MB por arquivo no modo local.</p>
    </div>
  </div>
}

export function LiveStatus({ currentUser, orders }:{currentUser:User;orders:ServiceOrder[]}){
 const count=currentUser.role==='client'?orders.filter(o=>o.clientId===currentUser.id&&o.status!=='completed').length:orders.filter(o=>o.status==='open'&&(currentUser.categories||[]).includes(o.category)).length;
 return <div className="fixed right-4 bottom-20 z-40 rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-700 px-4 py-3 flex items-center gap-3"><span className="relative"><Bell className="w-5 h-5 text-amber-300"/>{count>0&&<span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-black flex items-center justify-center">{count}</span>}</span><div><b className="text-xs block">Atualização automática ativa</b><span className="text-[11px] text-slate-300">{count} item(ns) aguardando atenção</span></div></div>
}
