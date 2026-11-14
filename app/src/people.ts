import type { Person } from './types';
import { SIDES } from './types';

export const key = (e: unknown) => String(e ?? '').trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isCeo = (p?: Person | null): boolean => !!p && p.level === 'ceo' && p.status === 'active';
/** An active CEO opens every app and every section automatically (the server does the same). */
export const ceoAll = (p: Person): Person =>
  isCeo(p) ? { ...p, apps: { proc: 1, hire: 1, branch: 1 }, sides: SIDES.slice() } : p;
export const initials = (n: string) =>
  String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
