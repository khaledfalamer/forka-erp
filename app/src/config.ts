// Public settings from /config.js (the same file the live site uses). No secrets.
export interface ForkaConfig {
  MODE?: string;
  ACCOUNTS_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  PROCUREMENT_URL?: string;
  PROCUREMENT_SERVER?: string;
  HIRING_URL?: string;
  BOARDS_URL?: string;
  APPLY_URL?: string;
  ERP_HOME?: string;
  PUSH_PUBLIC_KEY?: string;
}

declare global {
  interface Window {
    FORKA_APPS?: ForkaConfig;
  }
}

export const CFG: ForkaConfig = window.FORKA_APPS || {};
/** Live: talks to the real accounts server and Google sign-in. */
export const LIVE = !!(CFG.ACCOUNTS_URL && CFG.GOOGLE_CLIENT_ID);
/** Demo: made-up people in this browser only (for tests and previews). Never on the live site. */
export const DEMO = !LIVE && CFG.MODE !== 'live';
/** Live mode is switched on but the addresses are missing: show "Almost ready". */
export const NOT_SET_UP = !LIVE && CFG.MODE === 'live';
export const ALLOWED_DOMAINS = ['forka.com', 'kuwaitikitchen.com'];
