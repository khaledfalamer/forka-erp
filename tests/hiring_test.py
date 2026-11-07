"""Hiring (erp.forka.com/hiring) and careers page (apply.forka.com) - browser checks. python3 tests/hiring_test.py"""
import asyncio, json, pathlib, re, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = 8766
BASE = f'http://127.0.0.1:{PORT}'
CFG = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'x',PROCUREMENT_URL:'https://procurement.forka.com/',HIRING_URL:'https://hire.test/exec',APPLY_URL:'https://apply.forka.com/',ERP_HOME:'https://erp.forka.com/'};"
CFG_PREVIEW = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'x',HIRING_URL:''};"
SESS = {'TOKCEO-0000000000000000000': {'email': 'ceo@forka.com', 'name': 'Khaled Alamer', 'role': 'hr', 'ceo': True, 'dept': None},
        'TOKCHEF-000000000000000000': {'email': 'chef@kuwaitikitchen.com', 'name': 'Head Chef', 'role': 'head', 'ceo': False, 'dept': 'Kitchen'}}
DATA = {'reqs': {}, 'pipe': {}, 'jobs': {}, 'apps': {}, 'config': {}}
VER = [1]; CALLS = []
DATA['reqs']['r1'] = {'id': 'r1', 'reqId': 'REQ-2611-01', 'title': 'Line Cook', 'dept': 'Kitchen', 'branch': 'Sharjah', 'status': 'open', 'headcount': 1, 'history': [], 'mustHaves': ['Kuwaiti dishes', 'Hygiene', 'Speed'], 'traits': ['Team cooperation'], 'knockout': ['2 years in a kitchen?'], 'ad': 'Cook with us', 'adAr': 'اطبخ معنا', 'createdAt': 1793624193162, 'createdBy': 'ceo@forka.com', 'postedAt': 1793624734240, 'salMin': 3000, 'salMax': 4000, 'cur': 'AED'}
DATA['jobs']['r1'] = {'id': 'r1', 'title': 'Line Cook', 'dept': 'Kitchen', 'branch': 'Sharjah', 'knockout': ['2 years in a kitchen?'], 'open': True, 'postedAt': 1793624734240}
DATA['apps']['wabc'] = {'web': True, 'list': {'wabc': {'req': 'r1', 'jobTitle': 'Line Cook', 'name': 'Sara Ali', 'email': 'sara@mail.com', 'phone': '+971501234567', 'years': 3, 'answers': [['2 years in a kitchen?', 'Yes']], 'knockout': [], 'consent': True, 'cvFile': {'id': 'fileCV1234567890', 'drive': True, 'name': 'sara.pdf', 'size': 2048, 'type': 'application/pdf'}, 'source': 'Careers page', 'createdAt': 1793700000000, 'status': 'applied'}}}

def handle(b):
    CALLS.append(b); a = b.get('action')
    if a == 'jobs':
        return {'ok': True, 'jobs': [dict(j, ad=DATA['reqs'].get(k, {}).get('ad', ''), adAr=DATA['reqs'].get(k, {}).get('adAr', '')) for k, j in DATA['jobs'].items() if j.get('open')], 'brand': None}
    if a == 'apply':
        if not b.get('name'): return {'ok': False, 'error': 'need', 'fields': ['name']}
        return {'ok': True, 'ref': 'AB12CD'}
    me = SESS.get(b.get('token'))
    if not me: return {'ok': False, 'error': 'session'}
    if a == 'load':
        if b.get('ver') == 'v%d' % VER[0]: return {'ok': True, 'same': True, 'ver': b['ver'], 'me': me}
        return {'ok': True, 'ver': 'v%d' % VER[0], 'me': me, 'data': DATA}
    if a == 'put':
        if b['col'] == 'config' and b['id'] == 'team' and not me['ceo']: return {'ok': False, 'error': 'role'}
        DATA[b['col']][b['id']] = b['data']; VER[0] += 1; return {'ok': True, 'ver': 'v%d' % VER[0]}
    if a == 'cv': return {'ok': True, 'name': 'sara.txt', 'type': 'text/plain', 'data': 'Q1YgdGV4dA=='}  # headless Chrome downloads PDFs instead of showing them, so a text file stands in
    return {'ok': False, 'error': 'action'}

res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

async def ctx_for(b, cfg, w=1280, h=900, token=None):
    ctx = await b.new_context(viewport={'width': w, 'height': h})
    await ctx.route('**/config.js*', lambda r: r.fulfill(body=cfg, content_type='application/javascript'))
    await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    async def hire(r):
        if r.request.method == 'GET': await r.fulfill(json=handle({'action': 'jobs'}))
        else: await r.fulfill(json=handle(json.loads(r.request.post_data or '{}')))
    await ctx.route('https://hire.test/**', hire)
    if token: await ctx.add_init_script(f"try{{localStorage.setItem('fa-token','{token}')}}catch(e){{}}")
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    return ctx, pg, errs

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            # ---------- Hiring, team side ----------
            ctx, pg, errs = await ctx_for(b, CFG)
            await pg.goto(BASE + '/hiring/'); await pg.wait_for_timeout(800)
            check('Hiring without a Forka Apps sign-in asks to sign in first', 'sign in at Forka Apps' in await pg.inner_text('body'))
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG, token='TOKCEO-0000000000000000000')
            await pg.goto(BASE + '/hiring/'); await pg.wait_for_timeout(1200)
            nav = await pg.inner_text('#nav')
            check('CEO opens Hiring with the full HR menu', all(x in nav for x in ['CEO approvals', 'Candidates', 'Team']), nav)
            check('Real application from the careers page shows in the pipeline', 'Sara Ali' in await pg.evaluate("JSON.stringify(allCands())"))
            check('Link back to Forka Apps', await pg.locator('#who a[href="https://erp.forka.com/"]').count() == 1)
            check('No "Demo mode" banner on the live site', 'Demo mode' not in await pg.inner_text('body'))
            await pg.evaluate("go('team')"); await pg.wait_for_timeout(200)
            await pg.click('text=Add HR or department head') if await pg.locator('text=Add HR or department head').count() else await pg.evaluate("addMember()")
            await pg.wait_for_timeout(200)
            await pg.fill('#m_name', 'Jennifer Tudara'); await pg.fill('#m_mail', 'Jennifer@Forka.com'); await pg.select_option('#m_role', 'hr')
            await pg.click('#modal .btn.br'); await pg.wait_for_timeout(400)
            check('CEO adds HR by company email (saved on the server)', DATA['config'].get('team', {}).get('members', {}).get('jennifer@forka.com', {}).get('role') == 'hr', DATA['config'])
            n = len(CALLS); await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(300)
            check('Refresh sends the stamp and gets "same"', len(CALLS) == n + 1 and CALLS[-1].get('ver'))
            await pg.evaluate("go('careers')"); await pg.wait_for_timeout(200)
            check('Careers settings link to the public careers page', await pg.locator('a[href="https://apply.forka.com/"]').count() >= 1)
            async with ctx.expect_page() as np:
                await pg.evaluate("openCV('fileCV1234567890')")
            newp = await np.value
            try: await newp.wait_for_url('blob:**', timeout=3000)
            except Exception: pass
            check('CV opens through the server (stays private in Drive)', newp.url.startswith('blob:') and any(c.get('action') == 'cv' for c in CALLS), newp.url)
            await newp.close()
            n = len(CALLS); await pg.reload(); await pg.wait_for_timeout(150)
            check('Reload shows the last data at once (before the server answers)', 'Sara Ali' in await pg.evaluate("JSON.stringify(allCands())"))
            check('No page errors (CEO)', not errs, errs[:2])
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG, token='TOKCHEF-000000000000000000')
            await pg.goto(BASE + '/hiring/'); await pg.wait_for_timeout(1000)
            nav = await pg.inner_text('#nav')
            check('Department head sees the head menu only', 'Team' not in nav and 'approvals' not in nav and 'Candidates' in nav, nav)
            check('No page errors (head)', not errs, errs[:2])
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG_PREVIEW, token='TOKCEO-0000000000000000000')
            await pg.goto(BASE + '/hiring/'); await pg.wait_for_timeout(600)
            check('Before the hiring server is set, the live site says "being set up" (no demo data)', 'being set up' in await pg.inner_text('body'))
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG)
            await pg.goto(BASE + '/'); await pg.wait_for_timeout(500)
            h = await pg.evaluate("(()=>{const h=APPS.find(a=>a.id==='hire');return {url:h.url,ceo:!!h.ceoOnlyUntilMoved}})()")
            check('Forka Apps: Hiring tile opens erp.forka.com/hiring for the whole hiring team', h['url'].endswith('/hiring/') and not h['ceo'], h)
            await ctx.close()
            # ---------- careers page ----------
            ctx, pg, errs = await ctx_for(b, CFG)
            await pg.goto(BASE + '/apply/'); await pg.wait_for_timeout(800)
            body = await pg.inner_text('body')
            check('Careers page lists the open job', 'Line Cook' in body and 'Sharjah' in body)
            check('Careers page shows no internal data', not re.search(r'Sara|salary range|REQ-', body))
            await pg.click('[data-job=r1]'); await pg.wait_for_timeout(200)
            check('Job page shows the ad and the form', 'Cook with us' in await pg.inner_text('body') and await pg.locator('#f').count() == 1)
            await pg.click('#f button[type=submit]'); await pg.wait_for_timeout(200)
            check('Empty form: required fields turn red', await pg.locator('#f .miss').count() >= 4 and await pg.locator('.err').count() == 1)
            await pg.fill('[name=name]', 'Omar Khan'); await pg.fill('[name=email]', 'omar@mail.com'); await pg.fill('[name=phone]', '+968 9123 4567')
            await pg.set_input_files('[name=cv]', files=[{'name': 'omar.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4 cv'}])
            await pg.click('[data-yn="0"][data-v=Yes]'); await pg.wait_for_timeout(100)
            check('Typed details survive a redraw', await pg.input_value('[name=name]') == 'Omar Khan')
            await pg.check('[name=consent]'); await pg.click('#f button[type=submit]'); await pg.wait_for_timeout(600)
            sent = [c for c in CALLS if c.get('action') == 'apply']
            check('Application sent with answers and the CV file', sent and sent[-1]['answers'] == ['Yes'] and sent[-1]['cv']['type'] == 'application/pdf' and sent[-1]['cv']['data'], sent[-1:] and {k: v for k, v in sent[-1].items() if k != 'cv'})
            check('Thank-you page with a reference number', 'AB12CD' in await pg.inner_text('body'))
            await pg.click('#lang'); await pg.wait_for_timeout(150)
            check('Arabic switches the page right-to-left', await pg.get_attribute('html', 'dir') == 'rtl')
            await pg.click('[data-a=more]'); await pg.click('[data-job=r1]'); await pg.wait_for_timeout(150)
            check('Arabic ad shown in Arabic', 'اطبخ معنا' in await pg.inner_text('body'))
            check('No page errors (careers)', not errs, errs[:2])
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG, 390, 844)
            await pg.goto(BASE + '/apply/#job=r1'); await pg.wait_for_timeout(800)
            check('Phone: job link opens straight to the job', await pg.locator('#f').count() == 1)
            check('Phone: no sideways scrolling', await pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'))
            await pg.click('#lang'); await pg.wait_for_timeout(200)
            check('Phone in Arabic: no sideways scrolling', await pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'), await pg.evaluate('document.documentElement.scrollWidth'))
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'apply_phone.png'), full_page=True)
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG_PREVIEW)
            await pg.goto(BASE + '/apply/'); await pg.wait_for_timeout(500)
            check('Without the server address, the careers page says it is a preview', 'Preview' in await pg.inner_text('body'))
            await ctx.close()
            src = (ROOT / 'hiring' / 'index.html').read_text() + (ROOT / 'apply' / 'index.html').read_text()
            check('No emojis in Hiring or the careers page', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
            await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} hiring and careers checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
