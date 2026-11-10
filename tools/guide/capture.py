"""Screenshots for the team guide PDFs (sample data only, never real staff data).
Run: python3 tools/guide/capture.py OUTDIR      (PW_CHROMIUM=/path/to/chrome if needed)
Needs the Forka-Procurment repo next to forka-erp."""
import asyncio, json, os, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ERP = pathlib.Path(__file__).resolve().parents[2]
PROC = ERP.parent / 'Forka-Procurment'
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/guide-shots')
VIEW = {'width': 1280, 'height': 760}

# ---------- fake Forka Apps accounts server (sample people) ----------
P = {
  'ceo@forka.com': dict(email='ceo@forka.com', name='Khaled Alamer', title='CEO', level='ceo', status='active', apps=dict(proc=1, hire=1, branch=1), sides=['plan', 'ops', 'dept', 'fin', 'ceo', 'oman'], method='google'),
  'kitchen.head@forka.com': dict(email='kitchen.head@forka.com', name='Kitchen Head (example)', title='Head Chef', level='manager', status='active', apps=dict(proc=1, hire=1, branch=0), sides=['dept'], method='google'),
  'buyer@forka.com': dict(email='buyer@forka.com', name='Buyer (example)', title='Purchasing', level='staff', status='active', apps=dict(proc=1, hire=0, branch=0), sides=['plan'], method='google'),
}
REQ = {'new.cook@forka.com': dict(email='new.cook@forka.com', name='New Cook (example)', title='Line cook', why='Kitchen checklists', at='2026-11-09T08:00:00Z', state='waiting')}
SESS = {}
def acct(b):
    a = b.get('action')
    if a == 'google':
        em = b['idToken'].split(':', 1)[1]; p = P.get(em)
        if p: tok = 'S' + str(len(SESS)); SESS[tok] = em; return bundle(em, tok)
        return {'ok': False, 'status': 'unknown', 'email': em, 'name': ''}
    me = SESS.get(b.get('token'))
    if not me: return {'ok': False, 'error': 'session'}
    if a in ('me', 'open'): return bundle(me) if a == 'me' else {'ok': True}
    return {'ok': False, 'error': 'action'}
def bundle(me, tok=None):
    o = {'ok': True, 'me': P[me], 'ver': 'v1'}
    if tok: o['token'] = tok
    if P[me]['level'] == 'ceo':
        o['people'] = list(P.values()); o['requests'] = list(REQ.values())
        o['activity'] = [{'at': '2026-11-10T07:00:00Z', 'by': 'buyer@forka.com', 'verb': 'signin', 'target': '', 'extra': ''}]
    return o
GIS = """window.google={accounts:{id:{_cb:null,initialize(o){this._cb=o.callback},renderButton(el){el.innerHTML='<button id="gsi" type="button" style="display:flex;align-items:center;gap:10px;height:42px;padding:0 18px;border:1px solid #dadce0;border-radius:4px;background:#fff;font:500 14px Roboto,Arial,sans-serif;color:#3c4043;cursor:pointer"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l8-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.8l-8 6.2C6.6 42.6 14.6 48 24 48z"/></svg>Sign in with Google</button>';el.querySelector('#gsi').onclick=()=>this._cb({credential:'tok:'+(window.__as||'')})}}}};"""
HUBCFG = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'x.apps.googleusercontent.com',PROCUREMENT_URL:'https://procurement.forka.com/',HIRING_URL:'https://hire.test/exec',PROCUREMENT_SERVER:''};"

async def shot(pg, name, full=False):
    OUT.mkdir(parents=True, exist_ok=True)
    await pg.wait_for_timeout(250)
    await pg.screenshot(path=str(OUT / (name + '.jpg')), type='jpeg', quality=82, full_page=full)
    print('shot', name)

async def hub(b, lang):
    ctx = await b.new_context(viewport=VIEW, device_scale_factor=1.5)
    await ctx.add_init_script(f"try{{localStorage.setItem('fa-lang','{lang}')}}catch(e){{}}")
    await ctx.route('**/config.js*', lambda r: r.fulfill(body=HUBCFG, content_type='application/javascript'))
    await ctx.route('**/accounts.google.com/gsi/client', lambda r: r.fulfill(body=GIS, content_type='application/javascript'))
    async def a(r): await r.fulfill(json=acct(json.loads(r.request.post_data or '{}')))
    await ctx.route('https://accounts.test/**', a)
    await ctx.route('https://hire.test/**', lambda r: r.fulfill(json={'ok': True}))
    pg = await ctx.new_page(); await pg.goto('http://127.0.0.1:8811/'); await pg.wait_for_selector('#gsi', timeout=8000)
    await shot(pg, f'{lang}_hub_signin')
    for who, name in [('kitchen.head@forka.com', 'hub_home_head'), ('ceo@forka.com', 'hub_home_ceo')]:
        await pg.evaluate(f"window.__as='{who}'"); await pg.click('#gsi'); await pg.wait_for_timeout(600)
        await shot(pg, f'{lang}_{name}')
        if who == 'ceo@forka.com':
            await pg.click('[data-a=v-people]'); await pg.wait_for_timeout(300); await shot(pg, f'{lang}_hub_people')
        await pg.click('[data-a=out]'); await pg.wait_for_selector('#gsi')
    await pg.evaluate("window.__as='new.cook@forka.com'"); await pg.click('#gsi'); await pg.wait_for_timeout(600)
    await shot(pg, f'{lang}_hub_request')
    await ctx.close()

async def proc(b, lang):
    ctx = await b.new_context(viewport=VIEW, device_scale_factor=1.5)
    await ctx.add_init_script(f"try{{localStorage.setItem('pp-lang',JSON.stringify('{lang}'));localStorage.setItem('pp-me',JSON.stringify('Buyer (example)'))}}catch(e){{}}")
    await ctx.route('**/config.js*', lambda r: r.fulfill(body="window.FORKA_CONFIG={SHEET_URL:'',PIN:false,ERP_URL:''};", content_type='application/javascript'))
    pg = await ctx.new_page(); await pg.goto('http://127.0.0.1:8812/'); await pg.wait_for_timeout(1500)
    await pg.add_style_tag(content='.bn-warn{display:none!important}')      # sample-mode warning: real users never see it
    async def go(side, tab, name, extra='', click=None):
        await pg.evaluate(f"enterSide('{side}');tab='{tab}';{extra}render();window.scrollTo(0,0)"); await pg.wait_for_timeout(350)
        if click: await pg.click(click); await pg.wait_for_timeout(400)
        await shot(pg, f'{lang}_{name}')
    await go('dept', 'rnew', 'proc_newreq')
    await go('dept', 'rnew', 'proc_newreq_form', click='[data-rqkind=food]')
    await go('plan', 'lpo', 'proc_lpo_new', click='[data-act=ponew]')
    await go('ops', 'grn', 'proc_grn_new', click='[data-act=newgrn]')
    await go('ops', 'req', 'proc_bill_new', click='[data-act=tnew]')
    await go('dept', 'rmine', 'proc_myreq')
    await go('plan', 'prq', 'proc_requests')
    await go('plan', 'lpo', 'proc_lpo')
    await go('plan', 'fill', 'proc_inventory')
    await go('plan', 'sups', 'proc_suppliers')
    await go('ops', 'grn', 'proc_grn')
    await go('ops', 'req', 'proc_branchreq')
    await go('fin', 'pay', 'proc_pay')
    await go('fin', 'soa', 'proc_soa')
    await go('ceo', 'appr', 'proc_approvals')
    await ctx.close()

async def hire(b, lang):
    sys.argv = [sys.argv[0]]
    src = (ERP / 'tests' / 'hiring_test.py').read_text().replace('asyncio.run(main())', '')
    ht = {'__file__': str(ERP / 'tests' / 'hiring_test.py')}; exec(compile(src, 'ht', 'exec'), ht)
    ht['OLD_AI'][0] = False
    D = ht['DATA']
    D['reqs']['r1'].update(testQs=['Grill station: cook two dishes to the standard'], practical='Cook two dishes', purpose='Cook on the hot line', duties='Grill, prep and close the station')
    D['apps']['wabc']['list']['wabc']['ai'] = None
    D['pipe']['wabc'] = dict(D['apps']['wabc']['list']['wabc'], id='wabc', stage='screening', stageAt=ht['NOW'], history=[],
      ai={'summary': 'Line cook with 3 years in Kuwaiti and Gulf kitchens; grill and prep stations; worked busy lunch services.', 'role': 'Line cook, a Kuwaiti restaurant', 'years': 3, 'employers': ['A Kuwaiti restaurant', 'A hotel kitchen'],
          'languages': ['English', 'Arabic'], 'visaNotice': 'Own visa, 30 days notice', 'mustHaves': [{'item': 'Kuwaiti dishes', 'score': 4, 'evidence': 'Cooked machboos and grills daily'}, {'item': 'Hygiene', 'score': 1, 'evidence': 'Not in the CV'}, {'item': 'Speed', 'score': 3, 'evidence': 'Busy lunch service, 200 covers'}],
          'checks': ['No food hygiene certificate shown', 'Four months between jobs in 2025'], 'questions': ['How do you keep the grill line clean during a rush?'], 'at': ht['NOW']})
    for tok, views in [('TOKCEO-0000000000000000000', 'hr'), ('TOKCHEF-000000000000000000', 'head')]:
        ctx, pg, errs = await ht['ctx_for'](b, ht['CFG'], 1280, 760, token=tok)
        await ctx.add_init_script(f"try{{localStorage.setItem('forkaHireLang','{lang}')}}catch(e){{}}")
        await pg.goto('http://127.0.0.1:8813/hiring/'); await pg.wait_for_timeout(1300)
        if views == 'hr':
            await pg.evaluate("go('reqs')"); await shot(pg, f'{lang}_hire_requests')
            await pg.evaluate("go('pipeline')"); await shot(pg, f'{lang}_hire_candidates')
            await pg.evaluate("openCand('wabc')"); await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('#aisum')&&document.querySelector('#aisum').scrollIntoView({block:'center'})"); await shot(pg, f'{lang}_hire_aisum')
            await pg.evaluate("closeModal();DRAFT=null;openReq('r1')"); await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('#r_jd')&&document.querySelector('#r_jd').closest('.card').scrollIntoView({block:'start'})"); await shot(pg, f'{lang}_hire_jd')
            await pg.evaluate("closeModal();go('careers')"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('#aiguidecard')&&document.querySelector('#aiguidecard').scrollIntoView({block:'center'})"); await shot(pg, f'{lang}_hire_guidance')
            await pg.evaluate("go('approvals')"); await shot(pg, f'{lang}_hire_approvals')
            await pg.evaluate("openCand('csl')"); await pg.wait_for_timeout(300)
            if await pg.locator('text=Invite to interview').count(): await pg.click('text=Invite to interview')
            elif await pg.locator('text=دعوة للمقابلة').count(): await pg.click('text=دعوة للمقابلة')
            await pg.wait_for_timeout(400); await shot(pg, f'{lang}_hire_invite')
        else:
            await pg.evaluate("go('reqs')"); await pg.wait_for_timeout(200)
            await pg.evaluate("reqForm()"); await pg.wait_for_timeout(400); await shot(pg, f'{lang}_hire_newreq')
            await pg.evaluate("closeModal();go('pipeline');openCand('chid')"); await pg.wait_for_timeout(400)
            await pg.evaluate("const s=[...document.querySelectorAll('#dlg h3')].find(h=>/Interview|المقابلة/.test(h.textContent));s&&s.scrollIntoView({block:'start'})"); await shot(pg, f'{lang}_hire_scorecard')
        await ctx.close()

async def main():
    srvs = [subprocess.Popen([sys.executable, '-m', 'http.server', str(p), '--bind', '127.0.0.1'], cwd=d, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            for p, d in [(8811, ERP), (8812, PROC), (8813, ERP)]]
    time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            for lang in ['en', 'ar']:
                await hub(b, lang); await proc(b, lang); await hire(b, lang)
            await b.close()
    finally:
        for s in srvs: s.terminate()
asyncio.run(main())
