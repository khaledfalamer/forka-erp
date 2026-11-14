"""Hiring (erp.forka.com/hiring) and careers page (apply.forka.com) - browser checks. python3 tests/hiring_test.py"""
import os, asyncio, json, pathlib, re, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = 8766
BASE = f'http://127.0.0.1:{PORT}'
CFG = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'x',PROCUREMENT_URL:'https://procurement.forka.com/',HIRING_URL:'https://hire.test/exec',APPLY_URL:'https://apply.forka.com/',ERP_HOME:'https://erp.forka.com/'};"
CFG_PREVIEW = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'x',HIRING_URL:''};"
SESS = {'TOKCEO-0000000000000000000': {'email': 'ceo@forka.com', 'name': 'Khaled Alamer', 'role': 'hr', 'ceo': True, 'dept': None},
        'TOKCHEF-000000000000000000': {'email': 'chef@kuwaitikitchen.com', 'name': 'Head Chef', 'role': 'head', 'ceo': False, 'dept': 'Kitchen'}}
DATA = {'reqs': {}, 'pipe': {}, 'jobs': {}, 'apps': {}, 'config': {}}
VER = [1]; CALLS = []; FAIL = [0]; OLD_AI = [True]   # OLD_AI: the Hiring script on Google has no AI yet   # FAIL: how many applications the fake server refuses as busy before accepting
DATA['reqs']['r1'] = {'id': 'r1', 'reqId': 'REQ-2611-01', 'title': 'Line Cook', 'dept': 'Kitchen', 'branch': 'Sharjah', 'status': 'open', 'headcount': 1, 'history': [], 'mustHaves': ['Kuwaiti dishes', 'Hygiene', 'Speed'], 'traits': ['Team cooperation'], 'knockout': ['2 years in a kitchen?'], 'ad': 'Cook with us', 'adAr': 'اطبخ معنا', 'titleAr': 'طباخ خط', 'knockoutAr': ['سنتان في مطبخ؟'], 'createdAt': 1793624193162, 'createdBy': 'ceo@forka.com', 'postedAt': 1793624734240, 'salMin': 3000, 'salMax': 4000, 'cur': 'AED'}
DATA['reqs']['r2'] = {'id': 'r2', 'title': 'Cashier', 'dept': 'Front of house', 'branch': 'Ajman', 'status': 'review', 'headcount': 2, 'history': [], 'mustHaves': ['Cash handling'], 'testQs': [], 'practical': '', 'traits': [], 'createdBy': 'ceo@forka.com', 'createdAt': 0}
DATA['jobs']['r2'] = {'id': 'r2', 'title': 'Cashier', 'dept': 'Front of house', 'branch': 'Ajman', 'open': False}
DATA['jobs']['r1'] = {'id': 'r1', 'title': 'Line Cook', 'dept': 'Kitchen', 'branch': 'Sharjah', 'knockout': ['2 years in a kitchen?'], 'open': True, 'postedAt': 1793624734240}
DATA['apps']['wabc'] = {'web': True, 'list': {'wabc': {'req': 'r1', 'jobTitle': 'Line Cook', 'name': 'Sara Ali', 'email': 'sara@mail.com', 'phone': '+971501234567', 'years': 3, 'answers': [['2 years in a kitchen?', 'Yes']], 'knockout': [], 'consent': True, 'cvFile': {'id': 'fileCV1234567890', 'drive': True, 'name': 'sara.pdf', 'size': 2048, 'type': 'application/pdf'}, 'source': 'Careers page', 'createdAt': 1793700000000, 'status': 'applied'}}}

NOW = int(time.time() * 1000); DAYMS = 864e5
DATA['pipe']['civ'] = {'id': 'civ', 'req': 'r1', 'name': 'Joseph Mensah', 'email': 'joseph@mail.com', 'phone': '050 123 4567', 'stage': 'interview', 'stageAt': NOW, 'history': [],
  'personality': {'qs': 'Walk me through your closing checklist.'},
  'iv': {'chef@kuwaitikitchen.com': {'who': 'head', 'tech': [4], 'comp': [4, 4, 2, 4, 5, 3], 'prac': [4], 'n': {'comp.2': 'Blamed the kitchen'}, 'rec': 'Hire', 'strengths': 'Fast and clean', 'concerns': 'Owning mistakes', 'done': True, 'at': NOW},
         'jennifer@forka.com': {'who': 'hr', 'comp': [4, 3, 5, 4, 5, 3], 'hr': [4, 3, 5, 4], 'n': {'comp.2': 'Owned a past mistake well'}, 'rec': 'No hire', 'strengths': 'Honest', 'concerns': 'Salary at top of range', 'done': True, 'at': NOW}}}
DATA['pipe']['chid'] = {'id': 'chid', 'req': 'r1', 'name': 'Hidden Case', 'email': 'h@mail.com', 'stage': 'interview', 'stageAt': NOW, 'history': [],
  'iv': {'jennifer@forka.com': {'who': 'hr', 'done': True, 'at': NOW, 'hidden': True}}}
DATA['pipe']['csl'] = {'id': 'csl', 'req': 'r1', 'name': 'Rami Haddad', 'email': 'rami@mail.com', 'phone': '0501112233', 'lang': 'ar', 'stage': 'shortlist', 'stageAt': NOW, 'history': []}
BOOK = {'token': 'tok-1234567890abcdef1234', 'kind': 'interview', 'name': 'Rami', 'job': 'Line Cook', 'jobAr': 'طباخ خط', 'lang': 'ar', 'mins': 45, 'mode': 'In person', 'place': 'Sharjah branch', 'note': 'Bring your passport copy', 'pick': None,
  'slots': [{'t': NOW + 2 * DAYMS, 'free': True}, {'t': NOW + 2 * DAYMS + 3600000, 'free': False}, {'t': NOW + 3 * DAYMS, 'free': True}]}

def handle(b):
    CALLS.append(b); a = b.get('action')
    if a == 'jobs':
        return {'ok': True, 'jobs': [dict(j, ad=DATA['reqs'].get(k, {}).get('ad', ''), adAr=DATA['reqs'].get(k, {}).get('adAr', ''), titleAr=DATA['reqs'].get(k, {}).get('titleAr', ''), knockoutAr=DATA['reqs'].get(k, {}).get('knockoutAr', [])) for k, j in DATA['jobs'].items() if j.get('open')], 'brand': None}
    if a == 'slot':
        return dict(BOOK, ok=True) if b.get('token') == BOOK['token'] else {'ok': False, 'error': 'missing'}
    if a == 'book':
        ok = any(x['t'] == b.get('t') and x['free'] for x in BOOK['slots'])
        return {'ok': True, 'pick': b['t']} if ok else {'ok': False, 'error': 'taken'}
    if a == 'apply':
        if FAIL[0] > 0: FAIL[0] -= 1; return {'ok': False, 'error': 'server'}
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
    if a == 'del':
        if not me['ceo'] and me['role'] != 'hr': return {'ok': False, 'error': 'role'}
        DATA[b['col']].pop(b['id'], None); VER[0] += 1; return {'ok': True, 'ver': 'v%d' % VER[0]}
    if a == 'invite':
        bk = {'token': 'tok-new-0000000000000000', 'kind': b['kind'], 'slots': b['slots'], 'mins': b['mins'], 'mode': b['mode'], 'place': b['place'], 'by': me['email'], 'byName': me['name'], 'at': NOW, 'pick': None}
        DATA['pipe'][b['id']].setdefault('books', {})[b['kind']] = bk; VER[0] += 1
        return {'ok': True, 'ver': 'v%d' % VER[0], 'link': 'https://apply.forka.com/#book=' + bk['token'], 'mailed': True, 'book': bk}
    if a == 'ai' and not OLD_AI[0]:
        return {'ok': True, 'text': '{"jd": "About the role: line cook.", "ad": "Cook with us in Sharjah.", "adAr": "اطبخ معنا", "knockout": ["2 years in a kitchen?"]}'}
    if a == 'put' and b.get('col') == 'config' and b.get('id') == 'aiguide':
        DATA['config']['aiguide'] = b['data']; VER[0] += 1; return {'ok': True, 'ver': 'v%d' % VER[0]}
    if a == 'aisum':
        return {'ok': True, 'ai': {'summary': 'Line cook with 3 years in Kuwaiti kitchens.', 'role': 'Line cook, Kuwaiti Kitchen', 'years': 3, 'employers': ['Kuwaiti Kitchen'], 'languages': ['English', 'Arabic'],
            'visaNotice': 'Own visa', 'mustHaves': [{'item': 'Kuwaiti dishes', 'score': 4, 'evidence': 'Cooked machboos daily'}, {'item': 'Hygiene', 'score': 1, 'evidence': 'Not in the CV'}, {'item': 'Speed', 'score': 3, 'evidence': 'Busy lunch service'}],
            'checks': ['No hygiene certificate shown'], 'questions': ['How do you keep the line clean in a rush?'], 'model': 'claude-opus-5-5'}}
    if a == 'cv': return {'ok': True, 'name': 'sara.txt', 'type': 'text/plain', 'data': 'Q1YgdGV4dA=='}  # headless Chrome downloads PDFs instead of showing them, so a text file stands in
    return {'ok': False, 'error': 'action'}

# A big job ad: 3,000 online applications. The server sends only what changed after the first download.
BIG = {'reqs': {'r1': DATA['reqs']['r1']}, 'pipe': {}, 'jobs': {'r1': DATA['jobs']['r1']}, 'apps': {}, 'config': {}}
for i in range(3000):
    BIG['apps']['w%04d' % i] = {'web': True, 'list': {'w%04d' % i: {'req': 'r1', 'jobTitle': 'Line Cook', 'name': 'Bulk Applicant %d' % i, 'email': 'b%d@mail.com' % i, 'phone': '+971500000000',
        'years': 2, 'answers': [], 'knockout': [], 'consent': True, 'createdAt': NOW - i * 1000, 'status': 'applied', 'cvText': 'Line cook, Sharjah. ' * 25}}}
BV = [1]; BT = {}; BCALLS = []
def big(b):
    BCALLS.append(b)
    if b.get('action') != 'load': return {'ok': False, 'error': 'action'}
    me = SESS['TOKCEO-0000000000000000000']; now = int(time.time() * 1000)
    if b.get('ver') == 'b%d' % BV[0]: return {'ok': True, 'same': True, 'ver': b['ver'], 'me': me}
    if b.get('since') and b.get('ver') and b.get('vk') == 'vk-ceo':
        return {'ok': True, 'ver': 'b%d' % BV[0], 'me': me, 'now': now, 'vk': 'vk-ceo', 'delta': True,
                'data': {c: {k: v for k, v in BIG[c].items() if BT.get(c + ':' + k, 0) > b['since']} for c in BIG}, 'ids': {c: list(BIG[c]) for c in BIG}}
    return {'ok': True, 'ver': 'b%d' % BV[0], 'me': me, 'now': now, 'vk': 'vk-ceo', 'data': BIG}

res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

async def ctx_for(b, cfg, w=1280, h=900, token=None, handler=None):
    ctx = await b.new_context(viewport={'width': w, 'height': h})
    await ctx.route('**/config.js*', lambda r: r.fulfill(body=cfg, content_type='application/javascript'))
    await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    async def hire(r):
        fn = handler or handle
        if r.request.method == 'GET': await r.fulfill(json=fn({'action': 'jobs'}))
        else: await r.fulfill(json=fn(json.loads(r.request.post_data or '{}')))
    await ctx.route('https://hire.test/**', hire)
    if token: await ctx.add_init_script(f"try{{localStorage.setItem('fa-token','{token}')}}catch(e){{}}")
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    return ctx, pg, errs

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=os.environ.get('SITE_ROOT', ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
            check('Link back to Forka Apps (bottom of the left menu)', await pg.locator('#side a[href="https://erp.forka.com/"]').count() == 1)
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
            # --- AI CV summary ---
            await pg.evaluate("go('pipeline')"); await pg.evaluate("openCand('wabc')"); await pg.wait_for_timeout(300)
            check('Candidate with a CV file shows "Summarise CV"', await pg.locator('#aisumbtn').count() == 1)
            await pg.click('#aisumbtn'); await pg.wait_for_timeout(500)
            sent = [c for c in CALLS if c.get('action') == 'aisum']
            check('Summarise sends the job and the private CV file id to the server (not the AI key)', sent and sent[-1].get('cv') == 'fileCV1234567890' and sent[-1].get('req') == 'r1')
            box = await pg.inner_text('#aisum') if await pg.locator('#aisum').count() else ''
            check('Summary, must-have scores with evidence, checks and questions show on the candidate', 'Line cook with 3 years' in box and 'Cooked machboos daily' in box and 'No hygiene certificate shown' in box and 'keep the line clean' in box, box[:200])
            saved = DATA['pipe'].get('wabc', {})
            check('The summary is saved, so it is not paid for again', saved.get('ai', {}).get('summary') and saved.get('cv', {}).get('0') == 4, saved.get('ai'))
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_ai_summary.png'), full_page=False)
            await pg.evaluate("closeModal();DRAFT=null")
            await pg.evaluate("aiBusy(null,async()=>{await askJSON('Write a JD')})"); await pg.wait_for_timeout(300)
            check('Old Hiring script on Google: the AI message says so (not just "try again")', 'still the old version' in await pg.inner_text('#toast'), await pg.inner_text('#toast'))
            # --- guidance for AI job descriptions ---
            OLD_AI[0] = False
            await pg.evaluate("go('careers')"); await pg.wait_for_timeout(300)
            check('Careers settings have a "Guidance for AI" box for HR', await pg.locator('#ai_guide').count() == 1)
            await pg.fill('#ai_guide', 'Always mention: free staff meal and visa provided. Never mention salary.')
            await pg.click('#aiguidecard button.btn'); await pg.wait_for_timeout(300)
            check('Guidance is saved in Hiring settings', 'free staff meal' in DATA['config'].get('aiguide', {}).get('text', ''))
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_ai_guidance.png'), full_page=True)
            await pg.evaluate("Object.assign(S.reqs.r1,{testQs:['Grill station'],practical:'Cook two dishes',purpose:'Cook on the hot line',duties:'Grill and prep'});openReq('r1')"); await pg.wait_for_timeout(300)
            await pg.fill('#r_ainote', 'Mention the night-shift allowance.')
            await pg.click('text=Draft JD + ads with AI'); await pg.wait_for_timeout(500)
            ai = [c for c in CALLS if c.get('action') == 'ai']
            pr = ai[-1]['prompt'] if ai else ''
            check('The AI request carries the guidance and the note for this job, before the instructions', pr.startswith("Forka HR's standing guidance") and 'free staff meal' in pr and 'night-shift allowance' in pr, pr[:200])
            check('The draft fills the job description and ads', 'About the role: line cook.' in await pg.input_value('#r_jd') and 'Cook with us' in await pg.input_value('#r_ad'))
            await pg.evaluate("closeModal()")
            # --- remote positions ---
            await pg.evaluate("go('reqs');reqForm()"); await pg.wait_for_timeout(300)
            check('Hiring request form has Work type: On site, Remote, Hybrid', await pg.evaluate("[...document.querySelectorAll('#f_work option')].map(o=>o.textContent).join(',')") == 'Choose…,On site,Remote,Hybrid')
            await pg.evaluate("""()=>{const f=(id,v)=>{const e=document.getElementById(id);e.value=v};f('f_title','Social Media Coordinator');f('f_dept',document.querySelector('#f_dept option:nth-child(2)').value);f('f_branch','');f('f_work','Remote');f('f_smax','6000');
              ['f_mh0','f_mh1','f_mh2'].forEach((id,i)=>f(id,'Must '+i));document.querySelector('.f_pr').checked=true;[...document.querySelectorAll('.f_tr')].slice(0,2).forEach(x=>x.checked=true)}""")
            await pg.evaluate("saveReq()"); await pg.wait_for_timeout(400)
            rr = [x for x in DATA['reqs'].values() if x.get('title') == 'Social Media Coordinator']
            check('A remote request saves without a branch', bool(rr) and rr[0].get('work') == 'Remote' and not rr[0].get('branch'), rr[:1] or await pg.inner_text('#toast'))
            await pg.evaluate("setLang('ar');go('reqs')"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_remote_list_ar.png'))
            await pg.evaluate("reqForm();document.getElementById('f_work').value='Remote'"); await pg.wait_for_timeout(300)
            await pg.locator('#f_work').scroll_into_view_if_needed(); await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_remote_form_ar.png'))
            check('Arabic: Work type and Remote are translated', 'نوع العمل' in await pg.inner_text('body') and 'عن بُعد' in await pg.inner_text('body'))
            await pg.evaluate("closeModal();setLang('en')"); await pg.wait_for_timeout(200)
            await pg.evaluate("go('reqs')"); await pg.wait_for_timeout(300)
            check('The requests list shows it as Remote', 'Remote' in await pg.inner_text('main') if await pg.locator('main').count() else 'Remote' in await pg.inner_text('body'))
            if rr:
                rid = rr[0]['id']
                await pg.evaluate(f"Object.assign(S.reqs['{rid}'],{{status:'open',testQs:['x'],practical:'Portfolio',purpose:'Run our social media',duties:'Posts'}});openReq('{rid}')"); await pg.wait_for_timeout(300)
                await pg.click('text=Draft JD + ads with AI'); await pg.wait_for_timeout(500)
                pr = [c for c in CALLS if c.get('action') == 'ai'][-1]['prompt']
                check('The AI is told the job is remote, so the JD and ads say so', 'This is a remote job' in pr, pr[:300])
                await pg.evaluate("closeModal()")
            # --- interview comparison ---
            await pg.evaluate("go('pipeline')"); await pg.evaluate("openCand('civ')"); await pg.wait_for_timeout(300)
            cmp = await pg.inner_text('.cmp')
            check('Comparison: both interviewers side by side with their notes', 'chef' in cmp.lower() and 'jennifer' in cmp.lower() and 'Blamed the kitchen' in cmp and 'Owned a past mistake well' in cmp, cmp[:300])
            check('Comparison: questions only one side asked say "not asked"', 'not asked' in cmp)
            check('Comparison: a 3-point gap on one question is flagged', await pg.locator('.cmp tr.gap').count() >= 1)
            check('Comparison: split hire / no hire is called out', 'disagree on hiring' in await pg.inner_text('#dlg'))
            await pg.locator('.cmp').scroll_into_view_if_needed(); await pg.locator('.card.sec', has=pg.locator('.cmp')).screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_compare.png'))
            # --- booking link ---
            await pg.evaluate("closeModal();DRAFT=null;openCand('csl')"); await pg.wait_for_timeout(200)
            await pg.click('text=Invite to interview'); await pg.wait_for_timeout(400)
            check('Invite to interview opens the time picker', 'Send interview times' in await pg.inner_text('#dlg'))
            await pg.locator('.slots button').nth(1).click(); await pg.locator('.slots button').nth(12).click(); await pg.wait_for_timeout(100)
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_schedule.png'))
            await pg.click('#schGo'); await pg.wait_for_timeout(500)
            inv = [c for c in CALLS if c.get('action') == 'invite']
            check('Booking link sent with the picked times and the branch', inv and len(inv[-1]['slots']) == 2 and inv[-1]['place'] == 'Sharjah branch' and inv[-1]['mode'] == 'In person', inv[-1:])
            wa = await pg.get_attribute('#dlg a[href^="https://wa.me/"]', 'href')
            check('One-click WhatsApp with a UAE number and the link (Arabic for an Arabic applicant)', wa and wa.startswith('https://wa.me/971501112233?text=') and 'apply.forka.com' in wa and '%D9%85' in wa, wa)
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_schedule_sent.png'))
            await pg.click('#dlg .btn.br'); await pg.wait_for_timeout(200)
            check('Candidate page shows "waiting for the candidate to pick"', 'waiting for the candidate' in await pg.inner_text('#dlg'))
            await pg.evaluate("closeModal();openReq('r2')"); await pg.wait_for_timeout(200)
            check('HR / CEO: every hiring request has Delete request, even before the scorecard is done', await pg.locator('#delreq').count() == 1)
            await pg.click('#delreq'); await pg.wait_for_timeout(150)
            box = await pg.inner_text('#askbox') if await pg.locator('#askbox').count() else ''
            check('Delete asks first, naming the request', 'cannot be undone' in box and 'Cashier' in box, box)
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_delete_confirm.png'))
            await pg.click('#sureNo'); await pg.wait_for_timeout(150)
            check('Cancel keeps it', 'r2' in DATA['reqs'] and await pg.locator('#askbox').count() == 0)
            await pg.click('#delreq'); await pg.click('#sureOk'); await pg.wait_for_timeout(500)
            check('Yes, delete: the request is gone (and its job leaves the careers page)', 'r2' not in DATA['reqs'] and 'r2' not in DATA['jobs'] and await pg.locator('#dlg .hd').count() == 0, list(DATA['reqs']))
            await pg.evaluate("Object.assign(S.reqs.r1,{testQs:['Grill station'],practical:'Cook two dishes',traits:S.reqs.r1.traits||[]});openReq('r1')"); await pg.wait_for_timeout(200); await pg.click('#delreq'); await pg.wait_for_timeout(200)
            check('A request with candidates is not deleted (says to close the role instead)', 'r1' in DATA['reqs'] and await pg.locator('#askbox').count() == 0 and 'Close the role instead' in await pg.inner_text('#toast'))
            await pg.evaluate("closeModal()")
            check('No page errors (CEO)', not errs, errs[:2])
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG, token='TOKCHEF-000000000000000000')
            await pg.goto(BASE + '/hiring/'); await pg.wait_for_timeout(1000)
            nav = await pg.inner_text('#nav')
            check('Department head sees the head menu only', 'Team' not in nav and 'approvals' not in nav and 'Candidates' in nav, nav)
            await pg.evaluate("openCand('chid')"); await pg.wait_for_timeout(200)
            t = await pg.inner_text('#dlg')
            check('Head: HR card stays hidden until the head submits', 'open here once you submit' in t and 'class="cmp"' not in await pg.inner_html('#dlg'), t[:600])
            check('Head: own questions are technical + competency + practical with a prompt for each', 'Technical' in t and 'tell me about a time' in t.lower() and 'HR questions' not in t)
            await pg.click('text=Submit my scorecard'); await pg.wait_for_timeout(150)
            check('Head: cannot submit with questions unscored', not any(c.get('action') == 'put' and c.get('id') == 'chid' for c in CALLS))
            await pg.evaluate("ivSheet('head',reqOf(DRAFT),DRAFT).forEach(s=>s.L.forEach((x,i)=>setScore('iv.'+s.k+'.'+i,4)));ivNote('comp.0','Led a team of 8');ivSet('rec','Hire')")
            await pg.click('text=Submit my scorecard'); await pg.wait_for_timeout(300)
            put = [c for c in CALLS if c.get('action') == 'put' and c.get('id') == 'chid']
            mine = put and put[-1]['data']['iv'].get('chef@kuwaitikitchen.com', {})
            check('Head: scorecard submitted with scores, a note per question and a recommendation', mine and mine.get('done') and mine.get('rec') == 'Hire' and mine['n']['comp.0'] == 'Led a team of 8' and mine['who'] == 'head', mine)
            await pg.locator('.card.sec', has=pg.locator('details')).screenshot(path=str(ROOT / 'tests' / 'shots' / 'hiring_head_card.png'))
            await pg.evaluate("closeModal();Object.assign(S.reqs.r1,{testQs:['Grill station'],practical:'Cook two dishes',traits:S.reqs.r1.traits||[]});openReq('r1')"); await pg.wait_for_timeout(200)
            check('Department heads do not get Delete request', await pg.locator('#delreq').count() == 0)
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
            DATA['jobs']['rrem'] = {'id': 'rrem', 'title': 'Social Media Coordinator', 'dept': 'Marketing', 'branch': 'Head Office', 'work': 'Remote', 'open': True, 'postedAt': 1793624734241}
            await pg.reload(); await pg.wait_for_timeout(800)
            card = await pg.inner_text('[data-job=rrem]')
            check('Careers page: a remote job says Remote (and not the office it reports to)', 'Remote' in card and 'Head Office' not in card, card)
            await pg.evaluate("lang='ar';render()") ; await pg.wait_for_timeout(200)
            check('...and عن بُعد in Arabic', 'عن بُعد' in await pg.inner_text('[data-job=rrem]'))
            await pg.locator('.jobs').screenshot(path=str(ROOT / 'tests' / 'shots' / 'careers_remote_ar.png'))
            await pg.evaluate("lang='en';render()"); del DATA['jobs']['rrem']; await pg.reload(); await pg.wait_for_timeout(800)
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
            body_ar = await pg.inner_text('body')
            check('Arabic page: job title and questions in Arabic when HR wrote them', 'طباخ خط' in body_ar and 'سنتان في مطبخ؟' in body_ar and '2 years in a kitchen' not in body_ar)
            check('Arabic page: department and branch in Arabic', 'المطبخ' in body_ar and 'الشارقة' in body_ar)
            await pg.click('[data-a=back]'); await pg.wait_for_timeout(150)
            body_ar = await pg.inner_text('body')
            check('Arabic page: intro and values in Arabic, no English left', 'نرد على كل متقدّم' in body_ar and 'Every candidate' not in body_ar and 'Food first' not in body_ar)
            check('No page errors (careers)', not errs, errs[:2])
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG)
            await pg.goto(BASE + '/apply/#job=r1'); await pg.wait_for_timeout(800)
            await pg.fill('[name=name]', 'Busy Day'); await pg.fill('[name=email]', 'busy@mail.com'); await pg.fill('[name=phone]', '+971 50 111 2222')
            await pg.click('[data-yn="0"][data-v=Yes]'); await pg.check('[name=consent]')
            FAIL[0] = 1; n0 = len([c for c in CALLS if c.get('action') == 'apply'])
            await pg.click('#f button[type=submit]'); await pg.wait_for_timeout(4500)
            tries = len([c for c in CALLS if c.get('action') == 'apply']) - n0
            check('Busy server: the application is sent again by itself and goes through', tries == 2 and 'AB12CD' in await pg.inner_text('body'), tries)
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG, 390, 844)
            await pg.goto(BASE + '/apply/#job=r1'); await pg.wait_for_timeout(800)
            check('Phone: job link opens straight to the job', await pg.locator('#f').count() == 1)
            check('Phone: no sideways scrolling', await pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'))
            await pg.click('#lang'); await pg.wait_for_timeout(200)
            check('Phone in Arabic: no sideways scrolling', await pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'), await pg.evaluate('document.documentElement.scrollWidth'))
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'apply_phone.png'), full_page=True)
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG, 390, 844)
            await pg.goto(BASE + '/apply/#book=' + BOOK['token']); await pg.wait_for_timeout(800)
            body = await pg.inner_text('body')
            check('Booking page opens in Arabic for an Arabic applicant', await pg.get_attribute('html', 'dir') == 'rtl' and 'اختر موعد المقابلة' in body and 'طباخ خط' in body, body[:200])
            check('Booking page: a taken time cannot be picked', await pg.locator('.tm:disabled').count() == 1)
            check('Booking page (phone): no sideways scrolling', await pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'))
            await pg.locator('.tm:not([disabled])').first.click(); await pg.wait_for_timeout(100)
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'apply_book_ar.png'), full_page=True)
            await pg.click('[data-a=book]'); await pg.wait_for_timeout(400)
            bk = [c for c in CALLS if c.get('action') == 'book']
            check('Candidate confirms a time', bk and bk[-1]['t'] == BOOK['slots'][0]['t'] and 'تم تأكيد موعدك' in await pg.inner_text('body'))
            await pg.goto(BASE + '/apply/#book=tok-bad-00000000000000000000'); await pg.reload(); await pg.wait_for_timeout(600)
            check('A wrong booking link says so', 'غير صالح' in await pg.inner_text('body') or 'not valid' in await pg.inner_text('body'))
            check('No page errors (booking)', not errs, errs[:2])
            await ctx.close()
            ctx, pg, errs = await ctx_for(b, CFG_PREVIEW)
            await pg.goto(BASE + '/apply/'); await pg.wait_for_timeout(500)
            check('Without the server address, the careers page says it is a preview', 'Preview' in await pg.inner_text('body'))
            await ctx.close()
            # ---------- a big job ad: 3,000 applications ----------
            ctx, pg, errs = await ctx_for(b, CFG, token='TOKCEO-0000000000000000000', handler=big)
            await pg.goto(BASE + '/hiring/'); await pg.wait_for_timeout(1500)
            check('3,000 applications load', await pg.evaluate("Object.keys(allCands()).length") == 3000)
            await pg.click('#nav >> text=Candidates'); await pg.wait_for_timeout(300)
            if 'List view' in await pg.inner_text('main'): await pg.click('text=List view'); await pg.wait_for_timeout(300)
            rows = await pg.locator('main table tr.click').count()
            check('The list shows 200 at a time, with "Show more"', rows == 200 and 'Show 200 more (2800 not shown)' in await pg.inner_text('main'), rows)
            ms = await pg.evaluate("(()=>{const t=performance.now();render();return performance.now()-t})()")
            check('Redrawing the page with 3,000 applications stays quick (under 1.5 s)', ms < 1500, ms)
            await pg.click('text=Show 200 more'); await pg.wait_for_timeout(300)
            check('"Show more" adds the next 200', await pg.locator('main table tr.click').count() == 400)
            BIG['apps']['wnew'] = {'web': True, 'list': {'wnew': {'req': 'r1', 'jobTitle': 'Line Cook', 'name': 'Brand New Applicant', 'email': 'new@mail.com', 'createdAt': NOW + 5000, 'status': 'applied', 'knockout': []}}}
            BT['apps:wnew'] = int(time.time() * 1000); del BIG['apps']['w0000']; BV[0] += 1
            await pg.evaluate("pull(true)"); await pg.wait_for_timeout(400)
            last = BCALLS[-1]
            check('A refresh asks only for what changed (sends the time and viewer key)', last.get('since') and last.get('vk') == 'vk-ceo' and last.get('ver'), last)
            names = await pg.evaluate("JSON.stringify(Object.values(allCands()).map(c=>c.name))")
            check('...the new application appears and the deleted one is gone', 'Brand New Applicant' in names and '"Bulk Applicant 0"' not in names and await pg.evaluate("Object.keys(allCands()).length") == 3000)
            n0 = len(BCALLS); await pg.reload(); await pg.wait_for_timeout(1500)
            first = BCALLS[n0] if len(BCALLS) > n0 else {}
            check('After a reload the page opens from this device and only checks for changes', first.get('ver') == 'b%d' % BV[0] and 'Brand New Applicant' in await pg.evaluate("JSON.stringify(Object.values(allCands()).map(c=>c.name))"), first)
            await pg.click('#nav >> text=Candidates'); await pg.wait_for_timeout(300)
            if 'Board view' in await pg.inner_text('main'): await pg.click('text=Board view'); await pg.wait_for_timeout(300)
            check('Board view: each stage shows 60 cards and says how many more', await pg.locator('.kanban .cc').count() <= 60 * 8 and 'more in this stage' in await pg.inner_text('main'))
            check('No page errors (3,000 applications)', not errs, errs[:2])
            await ctx.close()
            src = (ROOT / 'hiring' / 'index.html').read_text() + (ROOT / 'apply' / 'index.html').read_text()
            check('No emojis in Hiring or the careers page', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
            await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} hiring and careers checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
