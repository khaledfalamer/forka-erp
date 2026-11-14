"""Forka Hire page redesign (Phase 3 + careers editor): request in 4 steps with red required fields and a saved draft,
requests table (search, filters, sorting, saved views), candidates list with stage summary, talent pool masking and
"Show" (with the fallback for the old Hiring script), dashboard, CEO approvals, careers editor save states, no sideways
scrolling in English and Arabic, no emojis, no page errors. Demo data only, fake server. python3 tests/hire_redesign_test.py
Screenshots: SHOTS=/some/folder python3 tests/hire_redesign_test.py"""
import asyncio, copy, json, os, pathlib, re, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = 8768
BASE = f'http://127.0.0.1:{PORT}'
SHOTS = os.environ.get('SHOTS')
CFG = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'x',HIRING_URL:'https://hire.test/exec',APPLY_URL:'https://apply.forka.com/',ERP_HOME:'https://erp.forka.com/'};"
CEO, HR, CHEF = 'TOKCEO-0000000000000000000', 'TOKHR0-0000000000000000000', 'TOKCHEF-000000000000000000'
SESS = {CEO: {'email': 'ceo@forka.com', 'name': 'Khaled Alamer', 'role': 'hr', 'ceo': True, 'dept': None},
        HR: {'email': 'hr.demo@forka.com', 'name': 'Demo HR', 'role': 'hr', 'ceo': False, 'dept': None},
        CHEF: {'email': 'chef.demo@forka.com', 'name': 'Demo Chef', 'role': 'head', 'ceo': False, 'dept': 'Kitchen'}}
NOW = int(time.time() * 1000); D = 864e5

def req(i, title, dept, branch, status, age, **x):
    return dict({'id': i, 'title': title, 'dept': dept, 'branch': branch, 'work': 'On site', 'status': status, 'headcount': 1, 'reason': 'Replacement', 'salMin': 3000, 'salMax': 4500, 'cur': 'AED',
                 'mustHaves': ['2 years in a similar role', 'Food safety basics', 'Arabic or English'], 'testQs': ['Guest complaint'], 'practical': 'Trial shift', 'practicals': ['Trial shift'], 'traits': ['Team cooperation', 'Calm under pressure'],
                 'createdAt': int(NOW - age * D), 'createdBy': 'ceo@forka.com', 'joinBy': int(NOW + 30 * D), 'history': []}, **x)
def cand(i, name, rq, stage, age, **x):
    return dict({'id': i, 'req': rq, 'name': name, 'email': name.split()[0].lower() + '.demo@example.com', 'phone': '+971 50 000 00' + str(10 + len(i)), 'source': 'Careers page', 'consent': True,
                 'stage': stage, 'stageAt': int(NOW - age * D), 'createdAt': int(NOW - (age + 3) * D), 'history': []}, **x)
def seed():
    R = {r['id']: r for r in [
        req('q1', 'Branch Supervisor', 'Operations', 'Sharjah', 'open', 20, reqId='REQ-2611-01', postedAt=int(NOW - 15 * D)),
        req('q2', 'Commis Chef', 'Kitchen', 'Fujairah', 'requested', 5),
        req('q3', 'Barista', 'Service', 'Mayar Cafe', 'ready', 9, reqId='REQ-2611-03'),
        req('q4', 'Social Media Coordinator', 'Marketing', '', 'approved', 7, work='Remote', reqId='REQ-2611-04'),
        req('q5', 'Cashier', 'Service', 'Umm Al Quwain', 'review', 6, reqId='REQ-2611-05', scorecardAt=int(NOW - 1 * D)),
        req('q6', 'Line Cook', 'Kitchen', 'Sharjah', 'open', 40, reqId='REQ-2610-02', postedAt=int(NOW - 35 * D))]}
    P = {c['id']: c for c in [
        cand('c1', 'Omar Demo', 'q1', 'applied', 0), cand('c2', 'Lina Demo', 'q1', 'screening', 1), cand('c3', 'Yusuf Demo', 'q1', 'personality', 2),
        cand('c4', 'Rania Demo', 'q1', 'shortlist', 5), cand('c5', 'Sami Demo', 'q6', 'interview', 2), cand('c6', 'Huda Demo', 'q6', 'shortlist', 1),
        cand('c7', 'Karim Demo', 'q1', 'references', 2), cand('c8', 'Mona Demo', 'q6', 'final', 1),
        cand('c9', 'Tariq Demo', 'q1', 'approval', 1, fin={'total': 7000, 'basic': 2100, 'nego': True, 'rec': 'Strong'}),
        cand('c10', 'Nadia Demo', 'q6', 'offer', 1), cand('c11', 'Faris Demo', 'q6', 'hired', 3, hiredAt=int(NOW - 3 * D), createdAt=int(NOW - 21 * D)),
        cand('p1', 'Pooled Demo', 'q6', 'pool', 10, phone='+971 50 123 4521', email='pooled.demo@gmail.com', poolNote='Strong, not now'),
        cand('p2', 'Rejected Demo', 'q1', 'rejected', 8, phone='050 765 4398', email='rejected.demo@mail.com', reject={'reason': 'Salary above range'})]}
    J = {k: {'id': k, 'title': R[k]['title'], 'dept': R[k]['dept'], 'branch': R[k]['branch'], 'open': True, 'postedAt': R[k].get('postedAt')} for k in ['q1', 'q6']}
    return {'reqs': R, 'pipe': P, 'jobs': J, 'apps': {}, 'config': {'team': {'members': {'hr.demo@forka.com': {'name': 'Demo HR', 'role': 'hr'}, 'chef.demo@forka.com': {'name': 'Demo Chef', 'role': 'head', 'dept': 'Kitchen'}}}}}

def mask_phone(p):
    d = re.sub(r'\D', '', p); plus = p.strip().startswith('+'); cc = d[:3] if plus else ''; rest = d[len(cc):]
    return ('+' + cc + ' ' if cc else '') + rest[0] + '• ••• ••' + rest[-2:]
def mask_email(e): return e[0] + '•••' + e[e.index('@'):]

class Server:
    """Stands in for the Hiring script. new=True: masks the talent pool and knows "reveal". new=False: the old script."""
    def __init__(s, data, new=True): s.data, s.new, s.calls, s.ver = data, new, [], 1
    def __call__(s, b):
        s.calls.append(b); a = b.get('action'); me = SESS.get(b.get('token'))
        if a == 'jobs': return {'ok': True, 'jobs': [], 'brand': None}
        if not me: return {'ok': False, 'error': 'session'}
        if a == 'load':
            v = copy.deepcopy(s.data)
            if me['role'] == 'head':
                mine = {k for k, r in v['reqs'].items() if r['dept'] == me['dept'] or r.get('createdBy') == me['email']}
                v['reqs'] = {k: r for k, r in v['reqs'].items() if k in mine}; v['pipe'] = {k: c for k, c in v['pipe'].items() if c['req'] in mine}
            if s.new:
                for c in v['pipe'].values():
                    if c['stage'] in ('rejected', 'pool'): c['phone'] = mask_phone(c['phone']); c['email'] = mask_email(c['email'])
            return {'ok': True, 'ver': 'v%d' % s.ver, 'me': me, 'data': v}
        if a == 'put':
            s.data[b['col']][b['id']] = b['data']; s.ver += 1; return {'ok': True, 'ver': 'v%d' % s.ver}
        if a == 'reveal' and s.new:
            c = s.data['pipe'].get(b.get('id'))
            if not c: return {'ok': False, 'error': 'missing'}
            if me['role'] != 'hr': return {'ok': False, 'error': 'role'}
            return {'ok': True, 'id': c['id'], 'phone': c['phone'], 'email': c['email']}
        return {'ok': False, 'error': 'action'}

res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

async def open_hire(b, srv, token=CEO, w=1366, h=900, lang='en', scale=None):
    scale = scale or (2 if SHOTS else 1)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=scale)
    await ctx.route('**/config.js*', lambda r: r.fulfill(body=CFG, content_type='application/javascript'))
    await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    async def hire(r):
        if r.request.method == 'GET': await r.fulfill(json=srv({'action': 'jobs'}))
        else: await r.fulfill(json=srv(json.loads(r.request.post_data or '{}')))
    await ctx.route('https://hire.test/**', hire)
    await ctx.add_init_script(f"try{{localStorage.setItem('fa-token','{token}');localStorage.setItem('forkaHireLang','{lang}');localStorage.setItem('forkaHireSide','full')}}catch(e){{}}")
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(BASE + '/hiring/'); await pg.wait_for_timeout(900)
    return ctx, pg, errs

async def go(pg, page): await pg.evaluate(f"go('{page}')"); await pg.wait_for_timeout(150)
async def no_hscroll(pg): return await pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
async def shot(pg, name, full=False):
    if SHOTS: pathlib.Path(SHOTS).mkdir(parents=True, exist_ok=True); await pg.screenshot(path=str(pathlib.Path(SHOTS) / (name + '.png')), full_page=full)
async def main_text(pg): return await pg.inner_text('main')

async def main():
    srv_p = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=os.environ.get('SITE_ROOT', ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1); allerrs = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            # ---------- dashboard (CEO) ----------
            srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv); allerrs.append(errs)
            t = await main_text(pg)
            check('Dashboard: top row has open roles, candidates in process, overdue approvals, median days to hire', all(x in t for x in ['Open roles', 'Candidates in process', 'Overdue approvals', 'Median days to hire']), t[:300])
            kp = await pg.locator('.hx-kpis .kpi .v').all_inner_texts()
            check('Dashboard: the numbers are right (2 open, 10 in process, median 18 days)', kp[0] == '2' and kp[1] == '10' and kp[3] == '18', kp)
            check('Dashboard: date-range and role filters', await pg.locator('#dsh_range option').count() == 4 and await pg.locator('#dsh_role option').count() == 7)
            await pg.select_option('#dsh_role', 'q6'); await pg.wait_for_timeout(150)
            kp2 = await pg.locator('.hx-kpis .kpi .v').all_inner_texts()
            check('Dashboard: the role filter changes the numbers', kp2[0] == '1' and kp2[1] == '4', kp2)
            await pg.select_option('#dsh_role', ''); await pg.select_option('#dsh_range', '30'); await pg.wait_for_timeout(150)
            check('Dashboard: the date filter keeps recent work (all demo work is within 30 days)', (await pg.locator('.hx-kpis .kpi .v').all_inner_texts())[1] == '10')
            await pg.select_option('#dsh_range', '')
            na = await pg.inner_text('.hx-na')
            check('Next action queue names the owner, the SLA and an action button', 'Approve vacancy' in na and 'Final approval' in na and 'Owner' in na and '/ 2 days' in na and await pg.locator('.hx-na li .btn').count() >= 8, na[:300])
            check('Next action: overdue items come first and show in red', await pg.locator('.hx-na li').first.evaluate("e=>e.classList.contains('late')"))
            check('Next action: a long queue shows 8 with "Show all"', await pg.locator('.hx-na li').count() == 8 and await pg.locator('text=Show all').count() == 1)
            check('No big "Nothing waiting" panel', 'Nothing waiting' not in t)
            steps = pg.locator('.hx-step button')
            check('Pipeline is one stepper with a count for each of the 10 stages', await steps.count() == 10 and (await steps.nth(4).inner_text()).split()[0] == '1')
            await shot(pg, 'dashboard_en_1366')
            await steps.nth(4).click(); await pg.wait_for_timeout(200)
            rows = await pg.locator('main table tr.click').all_inner_texts()
            check('Clicking a stage opens the candidates list filtered to it', await pg.evaluate("V.page") == 'pipeline' and await pg.evaluate("V.pv") == 'list' and len(rows) == 1 and 'Sami Demo' in rows[0] and 'Interview' in rows[0], rows)
            # ---------- CEO approvals ----------
            await go(pg, 'approvals')
            qs = pg.locator('.hx-appr .card')
            check('CEO approvals: two compact queues with SLA', await qs.count() == 2 and 'Commis Chef' in await qs.nth(0).inner_text() and 'Tariq Demo' in await qs.nth(1).inner_text() and await pg.locator('.hx-q .tag').count() >= 2)
            n0 = len([c for c in srv.calls if c.get('action') == 'put'])
            await pg.locator('.hx-appr .card').nth(1).locator('text=Review').click(); await pg.wait_for_timeout(200)
            check('Final candidate opens for the CEO, who approves in the candidate file as before (not from the list)', 'Approve' in await pg.inner_text('#dlg .ft') and len([c for c in srv.calls if c.get('action') == 'put']) == n0)
            await pg.evaluate("closeModal();DRAFT=null")
            await pg.locator('.hx-q .btn.ok').first.click(); await pg.wait_for_timeout(300)
            check('Approve vacancy from the queue still runs the same CEO approval (status approved, REQ number)', srv.data['reqs']['q2']['status'] == 'approved' and srv.data['reqs']['q2'].get('reqId', '').startswith('REQ-'), srv.data['reqs']['q2'].get('status'))
            check('Empty queue says so clearly', 'No vacancies waiting.' in await main_text(pg))
            await ctx.close()
            # ---------- request in 4 steps ----------
            srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv, token=HR); allerrs.append(errs)
            await go(pg, 'reqs'); await pg.click('main .top .btn.br'); await pg.wait_for_timeout(250)
            check('Request form: progress with 4 steps', (await pg.locator('#w_prog li').all_inner_texts()) == ['1\nRole & location', '2\nCompensation & timing', '3\nEvaluation plan', '4\nReview & submit'], await pg.locator('#w_prog li').all_inner_texts())
            check('Required fields are marked', await pg.locator('[data-wstep="1"] .hx-req').count() == 3)
            check('Only step 1 shows, with Next (no Back)', await pg.locator('[data-wstep="1"]').is_visible() and not await pg.locator('[data-wstep="2"]').is_visible() and await pg.locator('#w_next').is_visible() and not await pg.locator('#w_back').is_visible())
            await shot(pg, 'wizard_step1_en_1366')
            await pg.click('#w_next'); await pg.wait_for_timeout(150)
            check('Next with empty required fields: they turn red with a message next to each, and the step stays', await pg.evaluate("V.rstep") == 1 and await pg.locator('#f_title.hx-bad').count() == 1 and await pg.locator('#f_dept.hx-bad').count() == 1 and await pg.locator('#f_branch.hx-bad').count() == 1 and 'Write the role title' in await pg.inner_text('#e_f_title'))
            red = await pg.evaluate("getComputedStyle(document.getElementById('f_title')).borderColor")
            check('...the border is really red', red.replace(' ', '') in ('rgb(165,67,47)',), red)
            await pg.fill('#f_title', 'Shift Leader'); await pg.wait_for_timeout(100)
            check('Fixing a field clears its red at once', await pg.locator('#f_title.hx-bad').count() == 0 and await pg.locator('#f_dept.hx-bad').count() == 1)
            await pg.select_option('#f_dept', 'Operations'); await pg.select_option('#f_work', 'Remote'); await pg.wait_for_timeout(100)
            check('Remote job: the branch is not required (same rule as before)', await pg.locator('#f_branch.hx-bad').count() == 0)
            await pg.select_option('#f_work', 'On site'); await pg.select_option('#f_branch', 'Sharjah'); await pg.fill('#f_purpose', 'Lead the evening shift.')
            await pg.wait_for_timeout(600)
            check('"Draft saved" shows while typing, and the draft is kept for this person', (await pg.inner_text('#w_saved')).startswith('Draft saved') and 'Shift Leader' in (await pg.evaluate("localStorage.getItem('forkaHireReqDraft:hr.demo@forka.com')") or ''))
            await pg.click('#w_next'); await pg.wait_for_timeout(150)
            check('Step 2: compensation and timing, with Back', await pg.locator('[data-wstep="2"]').is_visible() and await pg.locator('#w_back').is_visible() and await pg.locator('#w_prog li.done').count() == 1)
            await pg.click('#w_next'); await pg.wait_for_timeout(150)
            check('Step 2: salary top is required', await pg.evaluate("V.rstep") == 2 and await pg.locator('#f_smax.hx-bad').count() == 1)
            await pg.fill('#f_smin', '5000'); await pg.fill('#f_smax', '6500'); await pg.click('#w_next'); await pg.wait_for_timeout(150)
            await pg.click('#w_next'); await pg.wait_for_timeout(150)
            check('Step 3: must-haves, practical test and traits turn red when missing', await pg.evaluate("V.rstep") == 3 and await pg.locator('[data-wstep="3"] .hx-bad').count() == 5)
            await pg.evaluate("closeModal()"); await pg.wait_for_timeout(100)
            await pg.click('main .top .btn.br'); await pg.wait_for_timeout(250)
            check('Closing keeps the draft: it comes back where you were', await pg.input_value('#f_title') == 'Shift Leader' and await pg.evaluate("V.rstep") == 3 and 'Your draft is back' in await pg.inner_text('#dlg'))
            for i, m in enumerate(['3 years leading a shift', 'Food safety', 'Arabic and English']): await pg.fill(f'#f_mh{i}', m)
            await pg.check('.f_pr[value="Trial shift"]'); await pg.check('.f_tr[value="Team cooperation"]'); await pg.check('.f_tr[value="Calm under pressure"]')
            await pg.click('#w_next'); await pg.wait_for_timeout(200)
            rv = await pg.inner_text('#w_review')
            check('Step 4: review of everything, with Edit per part and Send for CEO approval', await pg.evaluate("V.rstep") == 4 and 'Shift Leader' in rv and '5,000–6,500 AED' in rv and 'Trial shift' in rv and await pg.locator('#w_review .btn').count() == 3 and await pg.locator('#w_send').is_visible())
            await shot(pg, 'wizard_step4_en_1366')
            await pg.locator('#w_review .btn').nth(1).click(); await pg.wait_for_timeout(100)
            check('Edit goes back to that step', await pg.evaluate("V.rstep") == 2)
            await pg.click('#w_prog li:nth-child(4) button'); await pg.wait_for_timeout(100)
            await pg.click('#w_send'); await pg.wait_for_timeout(400)
            new = [r for r in srv.data['reqs'].values() if r.get('title') == 'Shift Leader']
            check('Send: saved as before (status "requested", waits for the CEO)', new and new[0]['status'] == 'requested' and new[0]['createdBy'] == 'hr.demo@forka.com' and new[0]['mustHaves'] == ['3 years leading a shift', 'Food safety', 'Arabic and English'] and new[0]['salMax'] == 6500 and new[0]['practical'] == 'Trial shift', new[:1])
            check('...and the draft is cleared', await pg.evaluate("localStorage.getItem('forkaHireReqDraft:hr.demo@forka.com')") is None)
            await pg.evaluate("reqForm()"); await pg.wait_for_timeout(200)
            await pg.evaluate("document.getElementById('f_title').value='X';saveReq()"); await pg.wait_for_timeout(200)
            check('Send with gaps (called directly): opens the first step with a gap, fields in red, nothing saved', await pg.evaluate("V.rstep") == 1 and await pg.locator('#f_dept.hx-bad').count() == 1 and not [r for r in srv.data['reqs'].values() if r.get('title') == 'X'])
            await pg.evaluate("closeModal();reqDraftClear()")
            # ---------- requests table ----------
            await go(pg, 'reqs')
            def titles(): return pg.locator('main table tbody tr.click td:nth-child(2)').all_inner_texts()
            check('Requests table: all requests, newest first', len(await titles()) == 7 and (await titles())[0].startswith('Shift Leader'))
            await pg.fill('#rq_q', 'cook'); await pg.wait_for_timeout(450)
            check('Search filters as you type', [x.split(' ×')[0] for x in await titles()] == ['Line Cook'] and await pg.evaluate("document.activeElement.id") == 'rq_q')
            await pg.fill('#rq_q', ''); await pg.wait_for_timeout(450)
            await pg.select_option('#rq_status', 'open'); await pg.wait_for_timeout(150)
            check('Status filter', sorted(x.split(' ×')[0] for x in await titles()) == ['Branch Supervisor', 'Line Cook'])
            await pg.select_option('#rq_dept', 'Kitchen'); await pg.wait_for_timeout(150)
            check('Department filter combines with status', [x.split(' ×')[0] for x in await titles()] == ['Line Cook'] and 'Showing 1 of 7' in await main_text(pg))
            await pg.locator('#rq_view').scroll_into_view_if_needed(); await pg.click('#rq_save'); await pg.wait_for_timeout(150)
            await pg.fill('#askIn', 'Open kitchen roles'); await pg.click('#askOk'); await pg.wait_for_timeout(200)
            sv = json.loads(await pg.evaluate("localStorage.getItem('forkaHireViews:hr.demo@forka.com')") or '{}')
            check('Saved view stored for this person', sv.get('reqs', [{}])[0].get('name') == 'Open kitchen roles' and sv['reqs'][0]['f']['dept'] == 'Kitchen', sv)
            await pg.click('text=Clear filters'); await pg.wait_for_timeout(150)
            check('Clear filters shows everything again', len(await titles()) == 7)
            await pg.select_option('#rq_view', 'Open kitchen roles'); await pg.wait_for_timeout(150)
            check('Choosing the saved view brings its filters back', [x.split(' ×')[0] for x in await titles()] == ['Line Cook'])
            await pg.click('text=Clear filters'); await pg.wait_for_timeout(150)
            await pg.click('th button:has-text("Role")'); await pg.wait_for_timeout(150)
            tt = [x.split(' ×')[0] for x in await titles()]
            check('Sorting by Role (A to Z), marked for screen readers', tt == sorted(tt) and await pg.get_attribute('th[aria-sort="ascending"]', 'aria-sort') == 'ascending', tt)
            await pg.click('th button:has-text("Role")'); await pg.wait_for_timeout(150)
            tt = [x.split(' ×')[0] for x in await titles()]
            check('...click again for Z to A', tt == sorted(tt, reverse=True), tt)
            await pg.select_option('#rq_branch', 'Remote'); await pg.wait_for_timeout(150)
            check('Branch filter has Remote jobs', [x.split(' ×')[0] for x in await titles()] == ['Social Media Coordinator'])
            await pg.click('text=Clear filters'); await pg.wait_for_timeout(150)
            await shot(pg, 'requests_en_1366')
            # ---------- candidates ----------
            await go(pg, 'pipeline')
            check('Candidates: the list is the default view, Board is an option', await pg.locator('main table tr.click').count() == 13 and await pg.locator('.hx-seg button.on').inner_text() == 'List view' and await pg.locator('.hx-seg button:has-text("Board view")').count() == 1)
            first = await pg.locator('main table tr.click').filter(has_text='Sami Demo').locator('td').nth(3).inner_text()
            check('Stage column names the current stage, with its step (5/10)', 'Interview' in first and '5/10' in first, first)
            await pg.click('.hx-chip:has-text("Shortlist")'); await pg.wait_for_timeout(150)
            check('Stage summary chips filter the list', sorted(await pg.locator('main table tr.click td:nth-child(2) b').all_inner_texts()) == ['Huda Demo', 'Rania Demo'])
            await shot(pg, 'candidates_en_1366')
            await pg.click('.hx-chip:has-text("All stages")'); await pg.wait_for_timeout(100)
            await pg.locator('main table tr.click').filter(has_text='Sami Demo').locator('input[type=checkbox]').check(); await pg.wait_for_timeout(100)
            check('Bulk actions still there (selection count)', '1 selected' in await main_text(pg) and await pg.locator('.hx-bulk .btn:not([disabled])').count() == 3)
            await pg.evaluate("V.sel.clear();openCand('c5')"); await pg.wait_for_timeout(200)
            sh = await pg.inner_text('.hx-sh')
            check('Candidate file: one compact line names the current stage, owner and next step (no 10-step strip)', 'Interview' in sh and '5/10' in sh and 'Next' in sh and 'References' in sh and await pg.locator('#dlg .steps').count() == 0, sh)
            await pg.evaluate("closeModal();DRAFT=null")
            await pg.click('.hx-seg button:has-text("Board view")'); await pg.wait_for_timeout(150)
            check('Board view still works', await pg.locator('.kanban .col').count() == 10)
            await pg.click('.hx-seg button:has-text("List view")')
            # ---------- talent pool ----------
            await go(pg, 'pool')
            t = await main_text(pg)
            check('Talent pool: phone and email masked', '+971 5• ••• ••21' in t and 'p•••@gmail.com' in t and '0• ••• ••98' in t and 'r•••@mail.com' in t, t[:400])
            check('...the full ones are not in the page at all', 'pooled.demo@gmail.com' not in await pg.content() and '123 4521' not in await pg.content())
            await shot(pg, 'talent_pool_masked_en_1366')
            n0 = len(srv.calls)
            await pg.locator('main tr.click').filter(has_text='Pooled Demo').locator('.hx-show').click(); await pg.wait_for_timeout(300)
            rc = [c for c in srv.calls[n0:] if c.get('action') == 'reveal']
            t = await main_text(pg)
            check('Show asks the server (reveal, logged there) and shows the full phone and email', rc and rc[0]['id'] == 'p1' and '+971 50 123 4521' in t and 'pooled.demo@gmail.com' in t and await pg.evaluate("V.page") == 'pool', rc)
            check('...only for that candidate', 'r•••@mail.com' in t)
            await pg.evaluate("openCand('p2')"); await pg.wait_for_timeout(200)
            check('Candidate file of a pool candidate: masked too, with Show', 'r•••@mail.com' in await pg.inner_text('#dlg') and await pg.locator('#dlg .hx-show').count() == 1)
            await pg.evaluate("closeModal();DRAFT=null")
            await ctx.close()
            # old Hiring script (not pasted yet): no masking on the server, "reveal" unknown -> uses what the page has
            srv = Server(seed(), new=False); ctx, pg, errs = await open_hire(b, srv, token=HR); allerrs.append(errs)
            await go(pg, 'pool')
            check('Old Hiring script: the page still masks', 'p•••@gmail.com' in await main_text(pg))
            await pg.locator('main tr.click').filter(has_text='Pooled Demo').locator('.hx-show').click(); await pg.wait_for_timeout(300)
            check('Old Hiring script: Show falls back to the details already in the page (nothing breaks)', 'pooled.demo@gmail.com' in await main_text(pg) and any(c.get('action') == 'reveal' for c in srv.calls) and not errs, errs)
            await ctx.close()
            # head: no talent pool page; anything outside their department says "HR only"
            srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv, token=CHEF); allerrs.append(errs)
            check('Head: no Talent pool page (same as before)', 'Talent pool' not in await pg.inner_text('#nav'))
            check('Head: details outside their department say "HR only", no Show', await pg.evaluate("(()=>{const h=contactHTML({id:'zz',req:'q1',phone:'+971501234521',email:'a.b@mail.com'});return h.includes('HR only')&&!h.includes('hx-show')})()"))
            await go(pg, 'pipeline')
            check('Head: candidates list keeps the shortlist-onward rule', sorted(await pg.locator('main table tr.click td:nth-child(1) b').all_inner_texts()) == ['Faris Demo', 'Huda Demo', 'Mona Demo', 'Nadia Demo', 'Sami Demo'])
            check('Head: no Add applicant, no bulk actions', await pg.locator('text=Add applicant').count() == 0 and await pg.locator('.hx-bulk').count() == 0)
            await go(pg, 'dash')
            na = await pg.inner_text('.hx-na')
            check('Head dashboard: their own next actions (reply on shortlist, score the interview)', 'Pick for interview or decline' in na and 'Score the interview' in na and 'Approve vacancy' not in na, na)
            await ctx.close()
            # ---------- empty states and the posting flow ----------
            d0 = seed(); d0['pipe'] = {}; d0['jobs'] = {}
            for r in d0['reqs'].values(): r['status'] = 'requested'
            srv = Server(d0); ctx, pg, errs = await open_hire(b, srv, token=HR); allerrs.append(errs)
            e = await pg.inner_text('.hx-na-card')
            check('Empty Next action: a helpful message and a button', 'None of your 6 hiring requests is posted yet.' in e and await pg.locator('.hx-na-card .btn:has-text("Post a role")').count() == 1, e)
            await go(pg, 'pipeline')
            check('Candidates with no open role: "Post a role" button instead of a dead end', await pg.locator('main .btn:has-text("Post a role")').count() == 1)
            await pg.click('main .btn:has-text("Post a role")'); await pg.wait_for_timeout(250)
            check('Post a role with nothing approved yet: opens a new hiring request', await pg.evaluate("V.page") == 'reqs' and await pg.locator('#w_prog').count() == 1)
            await pg.evaluate("closeModal();S.reqs.q3.status='ready';postFlow()"); await pg.wait_for_timeout(200)
            check('Post a role with roles ready: opens the roles waiting to be posted', await pg.evaluate("V.page") == 'reqs' and await pg.evaluate("V.rf.status") == 'ready' and [x.split(' ×')[0] for x in await pg.locator('main table tbody tr.click td:nth-child(2)').all_inner_texts()] == ['Barista'])
            await pg.evaluate("S.reqs.q3.status='requested';addApplicant()"); await pg.wait_for_timeout(150)
            check('Add applicant with no open role: says why, with a button to post a role', 'Post a role first' in await pg.inner_text('#dlg') and await pg.locator('#dlg .btn:has-text("Post a role")').count() == 1)
            await pg.evaluate("closeModal()")
            await ctx.close()
            d0 = seed(); d0['pipe'] = {}
            for r in d0['reqs'].values(): r['status'] = 'requested'
            srv = Server(d0); ctx, pg, errs = await open_hire(b, srv, token=CHEF); allerrs.append(errs)
            await go(pg, 'pipeline')
            check('Head (not allowed to post): no "Post a role" button', await pg.locator('main .btn:has-text("Post a role")').count() == 0 and 'shortlist' in (await main_text(pg)).lower())
            await ctx.close()
            # ---------- careers editor ----------
            srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv, token=HR); allerrs.append(errs)
            await go(pg, 'careers')
            ed = await pg.locator('.hx-ced-ed').bounding_box(); pv = await pg.locator('.hx-ced-pv').bounding_box()
            check('Careers editor: editor and live preview side by side', pv['x'] > ed['x'] + ed['width'] - 5 and abs(pv['y'] - ed['y']) < 5, (ed, pv))
            check('Three parts, each with its own Save and "Saved" state', await pg.locator('.hx-bs').count() == 3 and await pg.locator('.hx-st.ok').count() == 3 and await pg.locator('.hx-bs .btn[disabled]').count() == 3)
            n0 = len(srv.calls)
            await pg.fill('#b_intro', 'We cook real food in demo branches.'); await pg.wait_for_timeout(150)
            check('Typing: that part says "Unsaved", the preview updates at once, nothing is sent yet', await pg.inner_text('#st_intro') == 'Unsaved' and 'We cook real food in demo branches.' in await pg.inner_text('#pvFrame') and await pg.locator('.hx-st.ok').count() == 2 and not [c for c in srv.calls[n0:] if c.get('action') == 'put'])
            await shot(pg, 'careers_editor_en_1366')
            await pg.click('#bs_intro'); await pg.wait_for_timeout(300)
            put = [c for c in srv.calls[n0:] if c.get('action') == 'put']
            check('Save sends only that part (the others keep the public standard words)', put and put[-1]['id'] == 'brand' and put[-1]['data'] == {'intro': 'We cook real food in demo branches.'}, put[-1:] and put[-1]['data'])
            check('...and says "Saved" with the time', re.match(r'^Saved \d\d:\d\d$', await pg.inner_text('#st_intro')) is not None, await pg.inner_text('#st_intro'))
            await pg.click('.hx-seg button:has-text("Phone")'); await pg.wait_for_timeout(250)
            w = (await pg.locator('#pvBody').bounding_box())['width']
            check('Desktop / Phone preview toggle', 'phone' in (await pg.get_attribute('#pvFrame', 'class')) and w <= 362, w)
            check('Guidance for AI is kept', await pg.locator('#aiguidecard #ai_guide').count() == 1)
            await ctx.close()
            # ---------- Arabic ----------
            srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv, token=CEO, lang='ar'); allerrs.append(errs)
            t = await main_text(pg)
            check('Arabic dashboard is translated', all(x in t for x in ['الإجراء التالي', 'موافقات متأخرة', 'مسار المرشحين', 'الفترة']) and not any(x in t for x in ['Next action', 'Overdue approvals', 'Median days', 'Date range', 'Owner', 'Review']), t[:300])
            await shot(pg, 'dashboard_ar_1366')
            await go(pg, 'reqs'); t = await main_text(pg)
            check('Arabic requests table: filters and views translated', all(x in t for x in ['طرق العرض المحفوظة', 'حفظ طريقة العرض', 'كل الحالات']) and 'Saved views' not in t and 'Clear filters' not in t)
            await pg.evaluate("reqForm()"); await pg.wait_for_timeout(250); await pg.click('#w_next'); await pg.wait_for_timeout(150)
            dt = await pg.inner_text('#dlg')
            check('Arabic request steps: steps, required messages and buttons translated', all(x in dt for x in ['الوظيفة والموقع', 'خطة التقييم', 'اكتب المسمى الوظيفي', 'التالي']) and not any(x in dt for x in ['Write the role title', 'Role & location', 'Step 1 of 4']), dt[:300])
            fb = await pg.locator('#f_title').bounding_box(); eb = await pg.locator('#e_f_title').bounding_box()
            check('Arabic: the error sits under its field, right-aligned', abs((fb['x'] + fb['width']) - (eb['x'] + eb['width'])) < 3)
            await shot(pg, 'wizard_step1_ar_1366')
            await pg.evaluate("closeModal()"); await go(pg, 'pool'); t = await main_text(pg)
            check('Arabic talent pool: masked numbers stay readable, "Show" translated', '+971 5• ••• ••21' in t and 'إظهار' in t and 'HR only' not in t)
            await go(pg, 'careers'); t = await main_text(pg)
            check('Arabic careers editor translated', all(x in t for x in ['من نحن', 'لماذا تعمل معنا', 'المزايا', 'معاينة مباشرة']))
            await ctx.close()
            # ---------- no sideways page scroll, dialogs inside the screen, phones ----------
            bad = []
            for (w, h) in [(390, 844), (768, 1024), (1366, 900)]:
                for lang in ['en', 'ar']:
                    srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv, token=CEO, w=w, h=h, lang=lang); allerrs.append(errs)
                    for page in ['dash', 'approvals', 'reqs', 'pipeline', 'pool', 'careers', 'team']:
                        await go(pg, page)
                        if not await no_hscroll(pg): bad.append((w, lang, page))
                    await go(pg, 'pipeline'); await pg.evaluate("V.pv='board';render()"); await pg.wait_for_timeout(100)
                    if not await no_hscroll(pg): bad.append((w, lang, 'board'))
                    await pg.evaluate("V.pv='list';render();reqForm()"); await pg.wait_for_timeout(200)
                    for st in range(4):
                        bx = await pg.locator('#dlg').bounding_box()
                        if bx['x'] < -1 or bx['x'] + bx['width'] > w + 1 or not await no_hscroll(pg): bad.append((w, lang, 'wizard', st))
                        await pg.evaluate(f"V.rstep={st + 2};wShow()") if st < 3 else None
                    await pg.evaluate("closeModal();openCand('c9')"); await pg.wait_for_timeout(150)
                    bx = await pg.locator('#dlg').bounding_box()
                    if bx['x'] < -1 or bx['x'] + bx['width'] > w + 1: bad.append((w, lang, 'candidate dialog'))
                    await pg.evaluate("closeModal();DRAFT=null")
                    await ctx.close()
            check('No page-level sideways scroll at 390x844, 768x1024, 1366x900 in English and Arabic; dialogs fit the screen', not bad, bad)
            srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv, token=CEO, w=390, h=844); allerrs.append(errs)
            small = []
            for page in ['dash', 'reqs', 'pipeline', 'pool', 'careers']:
                await go(pg, page)
                small += await pg.evaluate("""p=>[...document.querySelectorAll('main .btn, main .hx-chip, main .hx-step button, main .hx-seg button, main select, main input:not([type=checkbox])')].filter(e=>e.offsetParent).filter(e=>{const r=e.getBoundingClientRect();return r.height<43.5}).map(e=>p+': '+(e.textContent||e.id||e.tagName).trim().slice(0,30))""", page)
            await pg.evaluate("reqForm()"); await pg.wait_for_timeout(200)
            small += await pg.evaluate("""[...document.querySelectorAll('#dlg .btn, #dlg select, #dlg input:not([type=checkbox]), #dlg .hx-prog button')].filter(e=>e.offsetParent).filter(e=>e.getBoundingClientRect().height<43.5).map(e=>'wizard: '+(e.textContent||e.id).trim().slice(0,30))""")
            check('Phone: buttons, chips and fields are at least 44px tall', not small, small[:8])
            await pg.evaluate("closeModal()")
            await go(pg, 'reqs'); await shot(pg, 'requests_en_390', full=True)
            await go(pg, 'dash'); await shot(pg, 'dashboard_en_390', full=True)
            await pg.evaluate("reqForm()"); await pg.wait_for_timeout(200); await shot(pg, 'wizard_step1_en_390')
            await pg.evaluate("V.rstep=4;wShow()"); await shot(pg, 'wizard_step4_en_390')
            await pg.evaluate("closeModal()"); await go(pg, 'pool'); await shot(pg, 'talent_pool_masked_en_390', full=True)
            await go(pg, 'pipeline'); await shot(pg, 'candidates_en_390', full=True)
            await go(pg, 'careers'); await shot(pg, 'careers_editor_en_390', full=True)
            await go(pg, 'reqs'); await pg.focus('#rq_q'); await pg.keyboard.press('Tab')
            ow = await pg.evaluate("(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle+' '+s.outlineWidth})()")
            check('Keyboard focus is visible', ow.startswith('solid') and not ow.endswith(' 0px'), ow)
            await ctx.close()
            if SHOTS:
                srv = Server(seed()); ctx, pg, errs = await open_hire(b, srv, token=CEO, w=390, h=844, lang='ar', scale=2)
                await shot(pg, 'dashboard_ar_390', full=True)
                await go(pg, 'reqs'); await shot(pg, 'requests_ar_390', full=True)
                await pg.evaluate("reqForm()"); await pg.wait_for_timeout(200); await shot(pg, 'wizard_step1_ar_390')
                await pg.evaluate("V.rstep=4;wShow()"); await shot(pg, 'wizard_step4_ar_390')
                await pg.evaluate("closeModal()"); await go(pg, 'pipeline'); await shot(pg, 'candidates_ar_390', full=True)
                await go(pg, 'pool'); await shot(pg, 'talent_pool_masked_ar_390', full=True)
                await go(pg, 'careers'); await shot(pg, 'careers_editor_ar_390', full=True)
                await ctx.close()
                ctx, pg, errs = await open_hire(b, srv, token=CEO, w=1366, h=900, lang='ar', scale=2)
                await go(pg, 'reqs'); await shot(pg, 'requests_ar_1366')
                await pg.evaluate("reqForm()"); await pg.wait_for_timeout(200); await pg.evaluate("V.rstep=4;wShow()"); await shot(pg, 'wizard_step4_ar_1366'); await pg.evaluate("closeModal()")
                await go(pg, 'pipeline'); await shot(pg, 'candidates_ar_1366')
                await go(pg, 'pool'); await shot(pg, 'talent_pool_masked_ar_1366')
                await go(pg, 'careers'); await shot(pg, 'careers_editor_ar_1366')
                await go(pg, 'approvals'); await shot(pg, 'ceo_approvals_ar_1366')
                await ctx.close()
                ctx, pg, errs = await open_hire(b, srv, token=CEO, w=1366, h=900, scale=2)
                await go(pg, 'approvals'); await shot(pg, 'ceo_approvals_en_1366')
                await ctx.close()
            src = (ROOT / 'hiring' / 'index.html').read_text()
            check('No emojis in Hire', not re.search('[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F]', src))
            flat = [e for x in allerrs for e in x]
            check('No page errors', not flat, flat[:3])
            await b.close()
    finally:
        srv_p.terminate()
    print(f'{sum(res)}/{len(res)} Hire redesign checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
