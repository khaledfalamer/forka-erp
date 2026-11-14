export type Level = 'staff' | 'manager' | 'ceo';
export type Status = 'active' | 'pending' | 'blocked';
export type Method = 'google' | 'pin';
/** Procurement sections. Never called "Planning". */
export type Side = 'plan' | 'ops' | 'fin' | 'dept' | 'ceo' | 'oman';
export const SIDES: Side[] = ['plan', 'ops', 'fin', 'dept', 'ceo', 'oman'];
export type AppKey = 'proc' | 'hire' | 'branch';

export interface Person {
  email: string;
  name: string;
  title?: string;
  level: Level;
  status: Status;
  apps: Record<AppKey, 0 | 1>;
  sides: Side[];
  method: Method;
  hasPin?: boolean;
  addedBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AccessRequest {
  email: string;
  name: string;
  title?: string;
  why?: string;
  at?: string;
  state: 'waiting' | 'approved' | 'rejected';
  reason?: string;
}

export interface ActivityItem {
  at: string;
  by: string;
  verb: string;
  target?: string;
  extra?: string;
}

/** What the accounts server sends after sign-in and on every check (CEO also gets people, requests, activity). */
export interface Bundle {
  me: Person;
  ver?: string;
  token?: string;
  people?: Person[];
  requests?: AccessRequest[];
  activity?: ActivityItem[];
}

export interface Answer extends Partial<Bundle> {
  ok: boolean;
  same?: boolean;
  error?: string;
  /** sign-in refused: unknown | waiting | rejected | pending | blocked */
  status?: string;
  email?: string;
  name?: string;
  reason?: string;
  fields?: string[];
}

export interface PersonDraft {
  email: string;
  name: string;
  title: string;
  level: Level;
  status: Status;
  apps: Record<AppKey, 0 | 1>;
  sides: Side[];
  method: Method;
  pinNew: string;
  hasPin?: boolean;
}
