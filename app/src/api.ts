import { CFG, DEMO } from './config';
import type { Answer } from './types';
import { demoServer } from './demoServer';

/** One request to the accounts server (same requests and answers as the live hub). */
export async function call(action: string, payload: Record<string, unknown> = {}, token = ''): Promise<Answer> {
  const body = { action, token, ...payload };
  if (DEMO) return demoServer(body);
  try {
    // JSON sent as text/plain: no CORS preflight, like Apps Script
    const r = await fetch(CFG.ACCOUNTS_URL!, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    return (await r.json()) as Answer;
  } catch {
    return { ok: false, error: 'net' };
  }
}

/** Wake a sleeping server in the background so the next request does not wait (first call after a quiet spell can take 5-10 s). */
export function wake(url?: string, cors = false) {
  if (!url || DEMO) return;
  try { fetch(url, { method: 'GET', mode: cors ? 'cors' : 'no-cors' }).catch(() => {}); } catch { /* ignore */ }
}
