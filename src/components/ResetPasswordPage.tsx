import React, { useEffect, useState } from 'react';
import { LockKeyhole, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSessionReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setSessionReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!supabase || !isSupabaseConfigured) {
      setError('Supabase ainda não foi configurado no arquivo .env.local.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não são iguais.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage('Senha alterada com sucesso. Você já pode entrar no aplicativo.');
    window.setTimeout(() => window.location.assign('/'), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <img src="/icons/opc-logo.svg" className="w-14 h-14" alt="O Profissional Certo" />
          <div>
            <h1 className="text-xl font-black text-slate-900">Criar nova senha</h1>
            <p className="text-sm text-slate-500">O Profissional Certo</p>
          </div>
        </div>
        {!sessionReady && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Abra esta página pelo link enviado no e-mail de recuperação.
          </div>
        )}
        {error && <div className="mb-4 flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"><AlertCircle className="w-5 h-5" />{error}</div>}
        {message && <div className="mb-4 flex gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700"><CheckCircle2 className="w-5 h-5" />{message}</div>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Nova senha</span>
            <div className="mt-1 flex items-center rounded-xl border border-slate-300 px-3">
              <LockKeyhole className="w-4 h-4 text-slate-400" />
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 outline-none" required />
              <button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Confirmar senha</span>
            <input type={show ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-amber-500" required />
          </label>
          <button disabled={loading || !sessionReady} className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 p-3 font-black text-slate-950">
            {loading ? 'Salvando...' : 'Definir nova senha'}
          </button>
        </form>
      </section>
    </main>
  );
}
