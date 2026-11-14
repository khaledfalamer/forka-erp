/* Procurement's settings. It now lives inside the Forka App, so it uses the Forka App settings file (config.js,
   window.FORKA_APPS): PROCUREMENT_SERVER is its server, the Forka App home is right above it.
   A page that already has the old Procurement settings (window.FORKA_CONFIG, used by the checks) keeps them. */
const w = window as unknown as { FORKA_CONFIG?: Record<string, unknown>; FORKA_APPS?: Record<string, string> };
if (!w.FORKA_CONFIG) {
  const A = w.FORKA_APPS || {};
  w.FORKA_CONFIG = {
    SHEET_URL: A.PROCUREMENT_SERVER || '',
    PIN: 'auto',
    ERP_URL: A.PROCUREMENT_SERVER ? new URL('../', location.href).href : '',
    ACCOUNTS_URL: A.ACCOUNTS_URL || '',
  };
}
export {};
