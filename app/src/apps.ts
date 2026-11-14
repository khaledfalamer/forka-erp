import { CFG } from './config';
import type { Person } from './types';
import { isCeo } from './people';

export type AppId = 'proc' | 'hire' | 'branch' | 'boards';
export interface AppDef {
  id: AppId;
  color: string;
  url: string;
  /** still on claude.ai: only the CEO opens it until it moves to erp.forka.com */
  ceoOnlyUntilMoved?: boolean;
}

/** Apps on the home page. Hire and Board open the pages that are not moved to React yet. */
export function appList(): AppDef[] {
  const list: AppDef[] = [
    // Procurement is part of this app now (/procurement/); its server address comes from config.js (PROCUREMENT_SERVER).
    { id: 'proc', color: '#a8703d', url: new URL('/procurement/', location.href).href },
    CFG.HIRING_URL
      ? { id: 'hire', color: '#2c7a76', url: new URL('/hiring/', location.href).href }
      : { id: 'hire', color: '#2c7a76', url: 'https://claude.ai/artifact/Bn6y2FWinUhxH9AyVsu7BY', ceoOnlyUntilMoved: true },
    { id: 'branch', color: '#5f8a45', url: 'https://claude.ai/artifact/TcvkdXqHbBkpfd4CwRZz6x', ceoOnlyUntilMoved: true },
  ];
  // Board opens for everyone with an active account; each person sees only the boards their department head adds them to.
  if (CFG.BOARDS_URL) list.push({ id: 'boards', color: '#7a6a55', url: new URL('/boards/', location.href).href });
  return list;
}

export const hasApp = (a: AppDef, p: Person) => a.id === 'boards' || !!p.apps?.[a.id];
export const canOpen = (a: AppDef, p: Person) => !!a.url && hasApp(a, p) && (!a.ceoOnlyUntilMoved || isCeo(p));

/** The app logo colours and names on the home tiles. */
export const BRAND: Partial<Record<AppId, [string, string]>> = {
  proc: ['#BD5038', 'Procurement'],
  hire: ['#E0A037', 'Hire'],
  boards: ['#397F8F', 'Board'],
};
