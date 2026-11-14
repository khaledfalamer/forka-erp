// Checks for the React hub (demo mode: made-up people, no real server). Run: npm run build && npm test
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots'); await mkdir(SHOTS, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json' };
const srv = createServer(async (req, res) => {
  let p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(0);
const BASE = `http://localhost:${srv.address().port}`;

let pass = 0, fail = 0;
const check = (name, ok, info = '') => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (!ok && info ? ' - ' + info : '')); };

const b = await chromium.launch();
async function page({ w = 1280, h = 900, lang = 'en', live = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(l => { if (!sessionStorage.getItem('init')) { localStorage.clear(); localStorage.setItem('fa-lang', l); sessionStorage.setItem('init', '1'); } }, lang);
  if (!live) await ctx.route('**/config.js*', r => r.fulfill({ body: '', contentType: 'text/javascript' })); // demo mode
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await ctx.route('**/accounts.google.com/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
  const p = await ctx.newPage(); const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + '/'); return { p, errors };
}
async function signInAs(p, email) {
  await p.click('.gbtn'); await p.selectOption('#gpick', email); await p.click('.gcard .btn.pri'); await p.waitForSelector('.top');
}

// 1. sign-in page, English and Arabic
{ const { p, errors } = await page();
  check('sign-in page shows', await p.isVisible('.gate .gcard h2'));
  check('sign-in title in English', (await p.textContent('.gcard h2')) === 'Sign in');
  await p.click('.lang button:nth-child(2)');
  check('Arabic switches the page to right to left', (await p.getAttribute('html', 'dir')) === 'rtl');
  check('sign-in title in Arabic', (await p.textContent('.gcard h2')) === 'تسجيل الدخول');
  check('no page errors on sign-in', !errors.length, errors.join(' | '));
  await p.context().close(); }

// 2. CEO: home, numbers, tiles, People and access, Activity
{ const { p, errors } = await page();
  await signInAs(p, 'ceo@forka.com');
  check('CEO sees the greeting with first name', (await p.textContent('.hero h1')).includes('Khaled'));
  check('CEO sees today\'s numbers', await p.isVisible('#ceobox'));
  check('Procurement tile shows', await p.isVisible('[data-app="proc"]'));
  check('Hiring tile shows', await p.isVisible('[data-app="hire"]'));
  check('On this device section shows', await p.isVisible('#device'));
  check('people to confirm badge shows', (await p.textContent('.app.adm .badge')) === '1');
  await p.screenshot({ path: join(SHOTS, 'ceo-home-desktop.png') });
  await p.click('.app.adm >> nth=0');
  check('People and access opens', (await p.textContent('.bar h1')) === 'People and access');
  // add a person: empty name blocks saving and shows red
  await p.click('.bar .btn.pri'); await p.click('#pm .btn.pri');
  check('empty name shows red', await p.isVisible('#pm input[data-k="name"].miss'));
  check('empty email shows red', await p.isVisible('#pm input[data-k="email"].miss'));
  check('message asks to fill the red fields', (await p.textContent('#pm .err')).includes('marked in red'));
  await p.fill('#pm input[data-k="name"]', 'Test Cashier'); await p.fill('#pm input[data-k="email"]', 'cashier@forka.com');
  await p.click('#pm .ck >> nth=0');
  check('Procurement sections appear when Procurement is ticked', await p.isVisible('#sides'));
  await p.click('#pm .btn.pri'); await p.waitForSelector('#pm', { state: 'detached' });
  check('saved person appears in the team list', await p.isVisible('tr[data-pid="cashier@forka.com"]'));
  // duplicate email is refused
  await p.click('.bar .btn.pri'); await p.fill('#pm input[data-k="name"]', 'Again'); await p.fill('#pm input[data-k="email"]', 'cashier@forka.com'); await p.click('#pm .btn.pri');
  check('duplicate email is refused', (await p.textContent('#pm .err')).includes('already on the list'));
  await p.keyboard.press('Escape');
  // confirm a pending person
  await p.click('tr[data-pid="ops.manager@example.com"] .btn.pri');
  await p.waitForFunction(() => !document.querySelector('tr[data-pid="ops.manager@example.com"] .btn.pri'));
  check('confirm turns a person active', (await p.textContent('tr[data-pid="ops.manager@example.com"] .dst')).includes('Active'));
  // search
  await p.fill('#fq', 'cashier');
  check('search filters the list', (await p.$$('tr.row')).length === 1);
  await p.fill('#fq', '');
  // the last CEO cannot be blocked
  await p.click('tr[data-pid="ceo@forka.com"] td >> nth=0');
  check('CEO edit shows "opens every app automatically"', (await p.textContent('#pm')).includes('opens every app'));
  check('you cannot block yourself', !(await p.isVisible('#pm .btn.dan')));
  await p.click('#pm .seg >> nth=1 >> button >> nth=1'); await p.click('#pm .btn.pri');
  check('the last active CEO cannot be changed to Manager', (await p.textContent('#pm .err')).includes('at least one active CEO'));
  await p.keyboard.press('Escape');
  await p.click('.back'); await p.click('.app.adm >> nth=1');
  check('Activity lists what happened', (await p.$$('.log .it')).length >= 3);
  check('Activity says who confirmed whom', (await p.textContent('.log')).includes('confirmed access for'));
  check('no page errors as CEO', !errors.length, errors.join(' | '));
  await p.context().close(); }

// 3. someone not on the list asks for access; the CEO allows it
{ const { p } = await page();
  await p.click('.gbtn'); await p.fill('#gmail', 'new.person@forka.com'); await p.click('.gcard .btn.pri');
  await p.waitForSelector('#rq');
  check('unknown email gets the request form', await p.isVisible('#rq'));
  await p.click('.gcard .btn.pri');
  check('empty request fields show red', await p.isVisible('#rq input[name="name"].miss') && await p.isVisible('#rq textarea[name="why"].miss'));
  await p.fill('#rq input[name="name"]', 'New Person'); await p.fill('#rq textarea[name="why"]', 'I order for Sharjah'); await p.click('.gcard .btn.pri');
  await p.waitForSelector('.gcard .ok');
  check('request sent screen shows', (await p.textContent('.gcard h2')) === 'Request sent');
  await p.click('.gcard .lnk'); await signInAs(p, 'ceo@forka.com');
  check('waiting request adds to the badge', (await p.textContent('.app.adm .badge')) === '2');
  await p.click('.app.adm >> nth=0');
  check('CEO sees the waiting request', (await p.textContent('.reqs')).includes('I order for Sharjah'));
  await p.click('.req .btn.pri');
  check('Allow opens the person form with the name filled', (await p.inputValue('#pm input[data-k="name"]')) === 'New Person');
  await p.click('#pm .btn.pri'); await p.waitForSelector('#pm', { state: 'detached' });
  check('allowed person is in the team list', await p.isVisible('tr[data-pid="new.person@forka.com"]'));
  check('request leaves the waiting list', !(await p.isVisible('.reqs')));
  await p.click('.top .btn.sm >> nth=1');
  await p.click('.gbtn'); await p.fill('#gmail', 'new.person@forka.com'); await p.click('.gcard .btn.pri'); await p.waitForSelector('.top');
  check('allowed person can now sign in', (await p.textContent('.hero h1')).includes('New'));
  await p.context().close(); }

// 4. PIN sign-in, staff see no administration
{ const { p, errors } = await page({ w: 390, h: 844 });
  await p.click('.gcard .lnk'); await p.fill('#gpin', '0000'); await p.click('.gcard .btn.pri');
  await p.waitForSelector('.gcard .err');
  check('wrong PIN is refused', (await p.textContent('.gcard .err')).includes('PIN is not right'));
  await p.fill('#gpin', '4321'); await p.press('#gpin', 'Enter'); await p.waitForSelector('.top');
  check('PIN signs in', (await p.textContent('.hero h1')).includes('Sample'));
  check('staff do not see the CEO numbers', !(await p.isVisible('#ceobox')));
  check('staff do not see administration', !(await p.isVisible('.app.adm')));
  check('staff see their Procurement section', (await p.textContent('[data-app="proc"]')).includes('Operations'));
  await p.screenshot({ path: join(SHOTS, 'staff-home-phone.png') });
  await p.reload(); await p.waitForSelector('.top');
  check('stays signed in after reload', (await p.textContent('.hero h1')).includes('Sample'));
  await p.click('.top .btn.sm >> nth=1');
  check('sign out returns to the sign-in page', await p.isVisible('.gate .gcard'));
  check('no page errors on phone', !errors.length, errors.join(' | '));
  await p.context().close(); }

// 5. phone screenshots in Arabic
{ const { p } = await page({ w: 390, h: 844, lang: 'ar' });
  await p.screenshot({ path: join(SHOTS, 'signin-phone-ar.png') });
  await signInAs(p, 'ceo@forka.com');
  check('Arabic home is right to left', (await p.getAttribute('html', 'dir')) === 'rtl');
  check('Arabic greeting', (await p.textContent('.hero h1')).includes('خالد') || (await p.textContent('.hero h1')).includes('Khaled'));
  check('no sideways scrolling on phone', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.screenshot({ path: join(SHOTS, 'ceo-home-phone-ar.png'), fullPage: true });
  await p.context().close(); }

// 6. live settings: Google's own button area, no demo account picker
{ const { p, errors } = await page({ live: true });
  check('live mode shows the Google sign-in area', await p.isVisible('#gbtn'));
  check('live mode has no demo account picker', !(await p.isVisible('.gbtn')));
  check('no page errors in live mode', !errors.length, errors.join(' | '));
  await p.context().close(); }

await b.close(); srv.close();
console.log(`\n${pass}/${pass + fail} hub checks passed`);
process.exit(fail ? 1 : 0);
