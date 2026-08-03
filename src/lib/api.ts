import { supabase } from './supabase';

const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const raw = typeof input === 'string' ? input : input.toString();
  const target = apiBaseUrl && raw.startsWith('/') ? `${apiBaseUrl}${raw}` : input;
  const response = await fetch(target, { ...init, headers });
  if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente.');
  if (response.status === 403) throw new Error('Você não tem permissão para realizar esta ação.');
  return response;
}
