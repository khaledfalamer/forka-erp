# Forka Apps - erp.forka.com

The front door for the Forka team: sign in with your company Google account (or a PIN for staff without email),
then open the apps you are allowed to use. Only the CEO sees the daily numbers, people and activity.

- `index.html` - the page. `config.js` - public settings (no secrets).
- `server/Accounts.gs` - the accounts server (Apps Script bound to the "Forka Apps - Accounts" Google Sheet).
  People, access requests and activity are kept in that Sheet. PINs are stored only as salted hashes.
- Every push runs `tests/` (server, page, live sign-in). The site updates only if all checks pass.
