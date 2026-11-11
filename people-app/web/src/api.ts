export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
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

// Simple hash routes: #/, #/people, #/people/<id>, #/org
export function useRoute(): string[] {
  return (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
}
export const go = (path: string) => { location.hash = '#/' + path; };
