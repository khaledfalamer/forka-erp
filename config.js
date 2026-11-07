// Forka Apps - public settings for erp.forka.com (no secrets here: PINs and people live in the accounts Google Sheet).
window.FORKA_APPS = {
  MODE: 'live',
  ACCOUNTS_URL: 'https://script.google.com/macros/s/AKfycbwUO5mC1oZrKiSJfF-kpeIFUPjfzB5VToNVn9EH-ecmDadFs9xsU1oDFHTgJ2FSg6vP/exec',        // accounts server (Apps Script web app, ends with /exec)
  GOOGLE_CLIENT_ID: '443945615318-21aveveme3c8n41fepp4gmof3vnrs8if.apps.googleusercontent.com',    // Google sign-in client id (ends with .apps.googleusercontent.com)
  PROCUREMENT_URL: 'https://procurement.forka.com/',
  HIRING_URL: 'https://script.google.com/macros/s/AKfycbx5vwTaOmiKlPMuskrdRSQfMewvX7NOkTTpXymlQgEzK5Vh8uIf95jOyWz19n7wrmN42w/exec',          // Hiring server (Apps Script web app, ends with /exec). Empty = Hiring stays on claude.ai
  APPLY_URL: 'https://apply.forka.com/',
  ERP_HOME: 'https://erp.forka.com/'
};
