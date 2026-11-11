export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

// Demo build: no server; a stand-in runs in the browser with made-up data.
export const DEMO = import.meta.env.VITE_DEMO === '1';

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  if (DEMO) {
    const { mockFetch } = await import('./demo/mock');
    const r = await mockFetch(opts.method || 'GET', path, opts.body);
    if (r.status >= 400) throw new ApiError(r.status, r.data?.error || 'error');
    return r.data as T;
  }
  const r = await fetch('/api' + path, {
    method: opts.method || 'GET',
    credentials: 'same-origin',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  if (!r.ok) throw new ApiError(r.status, data?.error || 'error');
  return data as T;
}

// Routes: #/, #/people, #/people/<id>, #/org. The demo keeps the route in memory,
// because the page it is published on only passes plain #names.
let mem: string[] = [''];
export function useRoute(): string[] {
  const h = DEMO ? mem[mem.length - 1] : location.hash.replace(/^#\/?/, '');
  return (h || '').split('/').filter(Boolean);
}
export const go = (path: string) => {
  if (DEMO) { mem.push(path); window.dispatchEvent(new Event('fp-route')); window.scrollTo(0, 0); }
  else location.hash = '#/' + path;
};
export const back = (fallback = 'people') => {
  if (DEMO) { if (mem.length > 1) mem.pop(); else mem = [fallback]; window.dispatchEvent(new Event('fp-route')); window.scrollTo(0, 0); }
  else if (history.length > 1) history.back(); else go(fallback);
};
if (DEMO) {
  document.addEventListener('click', e => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#/"]');
    if (a) { e.preventDefault(); go(a.getAttribute('href')!.slice(2)); }
  });
}

export const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* not available */ } },
};
