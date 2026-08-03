const normalizeUrl = (value?: string) => String(value || '')
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/$/, '');

const supabaseUrl = normalizeUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabasePublishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl) &&
  (supabasePublishableKey.startsWith('sb_publishable_') || supabasePublishableKey.startsWith('eyJ'))
);

export const supabaseConfigurationError = isSupabaseConfigured
  ? ''
  : 'Configure a Project URL sem /rest/v1 e a Publishable Key completa no arquivo .env.local.';

type Session = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user: any;
};

type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION';
type Listener = (event: AuthEvent, session: Session | null) => void;

const STORAGE_KEY = 'opc_supabase_session';
const listeners = new Set<Listener>();

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null, event: AuthEvent) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
  for (const listener of listeners) listener(event, session);
}

async function authRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: supabasePublishableKey,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || `Erro de autenticação (${response.status}).`;
    return { data: null, error: { message } };
  }
  return { data, error: null };
}

function parseSessionFromUrl(): Session | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const accessToken = hash.get('access_token') || query.get('access_token');
  const refreshToken = hash.get('refresh_token') || query.get('refresh_token') || undefined;
  if (!accessToken) return null;
  const expiresIn = Number(hash.get('expires_in') || query.get('expires_in') || 3600);
  const tokenType = hash.get('token_type') || query.get('token_type') || 'bearer';
  const session: Session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: tokenType,
    user: {},
  };
  window.history.replaceState({}, document.title, window.location.pathname);
  return session;
}

async function getUser(accessToken?: string) {
  const token = accessToken || readSession()?.access_token;
  if (!token) return { data: { user: null }, error: null };
  const result = await authRequest('/user', { headers: { Authorization: `Bearer ${token}` } });
  if (result.error) return { data: { user: null }, error: result.error };
  return { data: { user: result.data }, error: null };
}

async function refreshSession(session: Session): Promise<Session | null> {
  if (!session.refresh_token) return null;
  const result = await authRequest('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (result.error || !result.data?.access_token) return null;
  const refreshed = result.data as Session;
  writeSession(refreshed, 'TOKEN_REFRESHED');
  return refreshed;
}

async function hydrateUrlSession() {
  const parsed = parseSessionFromUrl();
  if (!parsed) return;
  const result = await getUser(parsed.access_token);
  if (result.data.user) parsed.user = result.data.user;
  writeSession(parsed, window.location.pathname.includes('reset-password') ? 'PASSWORD_RECOVERY' : 'SIGNED_IN');
}

if (typeof window !== 'undefined' && isSupabaseConfigured) {
  void hydrateUrlSession();
}

function queryBuilder(table: string) {
  let selectColumns = '*';
  let filters: Array<[string, string]> = [];
  return {
    select(columns = '*') {
      selectColumns = columns;
      return this;
    },
    eq(column: string, value: string) {
      filters.push([column, value]);
      return this;
    },
    async maybeSingle() {
      const session = readSession();
      const params = new URLSearchParams({ select: selectColumns, limit: '1' });
      for (const [column, value] of filters) params.set(column, `eq.${value}`);
      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?${params.toString()}`, {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${session?.access_token || supabasePublishableKey}`,
          Accept: 'application/vnd.pgrst.object+json',
        },
      });
      if (response.status === 406 || response.status === 404) return { data: null, error: null };
      const data = await response.json().catch(() => null);
      if (!response.ok) return { data: null, error: { message: data?.message || `Falha ao consultar ${table}.` } };
      return { data, error: null };
    },
  };
}

export const supabase = isSupabaseConfigured ? {
  auth: {
    async getSession() {
      await hydrateUrlSession();
      let session = readSession();
      if (!session) return { data: { session: null }, error: null };
      const expiresAt = Number(session.expires_at || 0);
      if (expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 60) {
        session = await refreshSession(session);
        if (!session) {
          writeSession(null, 'SIGNED_OUT');
          return { data: { session: null }, error: { message: 'Sessão expirada.' } };
        }
      }
      if (!session.user?.id) {
        const result = await getUser(session.access_token);
        if (result.error || !result.data.user) {
          writeSession(null, 'SIGNED_OUT');
          return { data: { session: null }, error: result.error };
        }
        session.user = result.data.user;
        writeSession(session, 'TOKEN_REFRESHED');
      }
      return { data: { session }, error: null };
    },
    onAuthStateChange(listener: Listener) {
      listeners.add(listener);
      queueMicrotask(() => listener('INITIAL_SESSION', readSession()));
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const result = await authRequest('/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.error) return { data: null, error: result.error };
      writeSession(result.data as Session, 'SIGNED_IN');
      return { data: { session: result.data, user: result.data.user }, error: null };
    },
    async signUp({ email, password, options }: any) {
      const result = await authRequest('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, data: options?.data || {} }),
      });
      if (result.error) return { data: null, error: result.error };
      if (result.data?.access_token) writeSession(result.data as Session, 'SIGNED_IN');
      return { data: result.data, error: null };
    },
    async resetPasswordForEmail(email: string, { redirectTo }: { redirectTo: string }) {
      return authRequest('/recover', { method: 'POST', body: JSON.stringify({ email, redirect_to: redirectTo }) });
    },
    async updateUser({ password }: { password: string }) {
      const session = readSession();
      if (!session?.access_token) return { data: null, error: { message: 'Sessão de recuperação ausente ou expirada.' } };
      const result = await authRequest('/user', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ password }),
      });
      if (!result.error && result.data) {
        session.user = result.data;
        writeSession(session, 'TOKEN_REFRESHED');
      }
      return result;
    },
    async signOut() {
      const session = readSession();
      if (session?.access_token) {
        await authRequest('/logout', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      }
      writeSession(null, 'SIGNED_OUT');
      return { error: null };
    },
    getUser,
  },
  from: queryBuilder,
} : null;
