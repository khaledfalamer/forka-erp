"""Forka Boards page redesign (Phase 4): company progress, projects, board, calendar, timeline, new task.
Preview mode only (demo data in this browser, no server). python3 tests/boards_redesign_test.py"""
import asyncio, os, pathlib, re, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = str(pathlib.Path(__file__).resolve().parent.parent); PORT = 8781; URL = f'http://127.0.0.1:{PORT}/boards/?demo'
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

# Five demo tasks on one day, so that day is crowded
CROWD = """(()=>{const b=Object.values(D.boards).find(x=>x.name==='Executive Admin Task Board');const l=D.lists[b.lists[0]];const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+2);
 ['Call the landlord about the lease','Send the weekly sales summary','Check the new menu prices','Book the fire safety inspection','Order printed table cards']
 .forEach((t,i)=>{const c={id:'crowd'+i,title:t,desc:'',labels:[],members:['ea'],owner:'ea',due:d.getTime(),done:false,repeat:'',priority:i===0?'urgent':'normal',check:[],log:[]};D.cards[c.id]=c;l.cards.push(c.id)});
 const c=D.cards.crowd1;c.title='A very long task title that keeps going and going so that it needs far more than two lines on a narrow card in the board view';save();render()})()"""
BOARD = "V.view='board';V.board=Object.values(D.boards).find(x=>x.name==='Executive Admin Task Board').id;V.bview='board';V.f={q:'',members:[],labels:[],due:'',fields:[]};render()"
SIDEWAYS = """()=>{const W=innerWidth;if(document.documentElement.scrollWidth>W+1)return 'document '+document.documentElement.scrollWidth;
  for(const e of document.querySelectorAll('.main *, .md, .md *')){const r=e.getBoundingClientRect();if(!r.width||(r.right<=W+1&&r.left>=-1))continue;
    let p=e.parentElement,clip=false;while(p&&p!==document.body){const o=getComputedStyle(p).overflowX;if(o!=='visible'){clip=true;break}p=p.parentElement}
    if(!clip)return e.tagName+'.'+e.className+' '+Math.round(r.left)+'..'+Math.round(r.right)}return ''}"""

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=os.environ.get('SITE_ROOT', ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None); errs = []
            async def page(w, h, lang='en', mobile=False):
                ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile)
                await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
                await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
                pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
                await pg.goto(URL); await pg.wait_for_timeout(900)
                if lang == 'ar': await pg.evaluate("lang='ar';render()")
                await pg.evaluate(CROWD)
                return ctx, pg

            ctx, pg = await page(1366, 900)
            # ---------- Company progress ----------
            n_proj = await pg.locator('.page table >> nth=1').locator('tr.click').count()
            check('Progress: date range, company/department switch and 4 number cards', await pg.locator('#pg-range').count() == 1 and await pg.locator('[data-a=pgscope]').count() == 2 and await pg.locator('button.kpi').count() == 4)
            await pg.click('button.kpi[data-v=over]'); await pg.wait_for_timeout(100)
            rows = pg.locator('.page table >> nth=1').locator('tr.click'); n_over = await rows.count()
            overs = [int(x) for x in await rows.locator('td.num').all_inner_texts()]
            check('Progress: clicking "Overdue" shows only projects with overdue work', 0 < n_over < n_proj and all(v > 0 for v in overs) and await pg.locator('button.kpi[data-v=over][aria-pressed=true]').count() == 1, (n_proj, n_over, overs))
            check('Progress: the filter is named, with "Show all"', 'Showing only: Overdue' in await pg.inner_text('.pgshow'))
            await pg.click('.pgshow [data-a=pgk]'); await pg.wait_for_timeout(100)
            check('Progress: "Show all" brings every project back', await pg.locator('.page table >> nth=1').locator('tr.click').count() == n_proj)
            await pg.click('.pgsum [data-v="st:off"]'); await pg.wait_for_timeout(100)
            check('Progress: status summary filters projects by status', await pg.locator('.page table >> nth=1').locator('tr.click').count() == 1)
            await pg.click('.pgsum [data-v="st:off"]')
            before = await pg.inner_text('button.kpi[data-v=done]')
            await pg.select_option('#pg-range', '30'); await pg.wait_for_timeout(100)
            check('Progress: period changes the "done" card to 30 days', 'last 30 days' in await pg.inner_text('button.kpi[data-v=done]') and 'last 7 days' in before)
            await pg.select_option('#pg-range', '7')
            await pg.click('[data-a=pgscope][data-v=mine]'); await pg.wait_for_timeout(100)
            await pg.select_option('#pg-dept', 'fin'); await pg.wait_for_timeout(100)
            check('Progress: "My department" shows one department', await pg.locator('.page table >> nth=0').locator('tr.click').count() == 1)
            await pg.click('[data-a=pgscope][data-v=all]'); await pg.wait_for_timeout(100)
            check('Progress: back to all 9 departments', await pg.locator('.page table >> nth=0').locator('tr.click').count() == 9)
            check('Progress: rows show a chevron', await pg.locator('.page table >> nth=0').locator('tr.click td.chev svg').count() == 9)
            kb = await pg.locator('.kpis').bounding_box()
            check('Progress: summary fits above the fold', kb['y'] + kb['height'] < 900, kb)

            # ---------- Projects ----------
            await pg.click('.side [data-a=go][data-v=projects]'); await pg.wait_for_timeout(100)
            pos = await pg.evaluate("[...document.querySelector('#projtbl tr.click').cells].slice(0,2).map(td=>getComputedStyle(td).position)")
            check('Projects: Project and Status columns are pinned', pos == ['sticky', 'sticky'], pos)
            await pg.click('#projtbl [data-a=psort][data-v=name]'); await pg.wait_for_timeout(100)
            names = await pg.locator('#projtbl tr.click td:first-child b').all_inner_texts()
            check('Projects: click a header to sort (A to Z)', names == sorted(names, key=str.lower) and await pg.locator('#projtbl th[aria-sort=ascending]').count() == 1, names)
            await pg.click('#projtbl [data-a=psort][data-v=name]'); await pg.wait_for_timeout(100)
            names2 = await pg.locator('#projtbl tr.click td:first-child b').all_inner_texts()
            check('Projects: click again to reverse', names2 == list(reversed(names)) and await pg.locator('#projtbl th[aria-sort=descending]').count() == 1)
            await pg.select_option('#pf-dept', 'fin'); await pg.wait_for_timeout(100); n_fin = await pg.locator('#projtbl tr.click').count()
            await pg.reload(); await pg.wait_for_timeout(800); await pg.click('.side [data-a=go][data-v=projects]'); await pg.wait_for_timeout(100)
            check('Projects: filter and sort are remembered after a reload', await pg.input_value('#pf-dept') == 'fin' and await pg.locator('#projtbl tr.click').count() == n_fin and await pg.locator('#projtbl th[aria-sort=descending] [data-v=name]').count() == 1)
            await pg.click('[data-a=pfclear]'); await pg.wait_for_timeout(100)
            check('Projects: "Clear filters" shows every project again', await pg.input_value('#pf-dept') == '' and await pg.locator('#projtbl tr.click').count() == await pg.evaluate('boards().length'))
            check('Projects: rows show hover chevron', await pg.locator('#projtbl tr.click td.chev').count() == await pg.locator('#projtbl tr.click').count())

            # ---------- Board ----------
            await pg.evaluate(BOARD); await pg.wait_for_timeout(150)
            ct = pg.locator('.card[data-id=crowd1] .ct')
            clamp = await ct.evaluate("e=>[getComputedStyle(e).webkitLineClamp,e.getAttribute('title'),e.textContent.trim(),e.clientHeight,e.scrollHeight]")
            check('Board: long card titles are cut at 2 lines, with the full title as tooltip and in the page text', str(clamp[0]) == '2' and clamp[1].startswith('A very long') and clamp[2].endswith('board view') and clamp[4] > clamp[3], clamp)
            urg = pg.locator('.card[data-id=crowd0]')
            check('Board: Urgent is one strong signal (solid red tag and red edge), separate from the date', await urg.locator('.cmeta .pri.urgent').count() == 1 and await urg.locator('.cmeta .due').count() == 1 and 'urg' in (await urg.get_attribute('class')))
            check('Board: each list shows its count and a visible add button', await pg.locator('.list:not(.col) .lcount').count() == await pg.locator('.list:not(.col)').count() and await pg.locator('.list:not(.col) .ladd').count() == await pg.locator('.list:not(.col)').count())
            n0 = await pg.locator('.card').count()
            await pg.select_option('#fb-pri', 'urgent'); await pg.wait_for_timeout(100)
            n_u = await pg.locator('.card').count()
            check('Board: filter bar, priority', n_u >= 1 and n_u < n0 and await pg.locator('.card .pri.urgent').count() == n_u, (n0, n_u))
            await pg.select_option('#fb-pri', ''); await pg.select_option('#fb-owner', 'ea'); await pg.wait_for_timeout(100)
            owners = await pg.evaluate("[...document.querySelectorAll('.card[data-id]')].map(e=>own(D.cards[e.dataset.id]))")
            check('Board: filter bar, owner', owners and all(o == 'ea' for o in owners), owners)
            await pg.select_option('#fb-owner', ''); await pg.click('.qbar [data-a=fd][data-v=week]'); await pg.wait_for_timeout(100)
            ok = await pg.evaluate("[...document.querySelectorAll('.card[data-id]')].every(e=>{const c=D.cards[e.dataset.id];return c.due&&c.due>=today()&&c.due<today()+7*day&&!c.done})")
            check('Board: filter bar, due this week', ok and await pg.locator('.card').count() < n0)
            await pg.fill('#q', 'landlord'); await pg.wait_for_timeout(100)
            check('Board: search shows in the filter bar and can be cleared', 'landlord' in await pg.inner_text('.qbar'))
            await pg.click('[data-a=fclear]'); await pg.wait_for_timeout(100)
            check('Board: clear brings all cards back', await pg.locator('.card').count() == n0)
            await pg.click('.list:has(.ltitle:text-is("To do")) .ladd'); await pg.wait_for_timeout(100)
            check('Board: the column add button opens New task on that list', await pg.locator('.ntf').count() == 1 and 'To do' in await pg.inner_text('#nt-list option:checked'))

            # ---------- New task form ----------
            check('New task: groups Essentials, Schedule and Details', [x.strip() for x in await pg.locator('.ntg > legend').all_inner_texts()] == ['Essentials', 'Schedule'] and await pg.locator('details.ntdet').count() == 1)
            check('New task: Details is folded (optional)', await pg.locator('details.ntdet[open]').count() == 0 and not await pg.locator('#nt-desc').is_visible())
            check('New task: shows "Department > Board" at the top', 'Executive & Administration' in await pg.inner_text('#nt-crumb') and 'Executive Admin Task Board' in await pg.inner_text('#nt-crumb'))
            await pg.click('[data-a=ntgo]'); await pg.wait_for_timeout(100)
            check('New task: empty title, owner and due date turn red with a message next to each', await pg.locator('.ntf .miss').count() == 3 and await pg.locator('#nt-e-members:not([hidden])').count() == 1 and await pg.locator('#nt-e-due:not([hidden])').count() == 1 and await pg.locator('#nt-due[aria-invalid=true]').count() == 1)
            await pg.fill('#nt-due', '2026-12-01'); await pg.wait_for_timeout(100)
            check('New task: the due date stops being red once filled in', await pg.locator('#nt-due.miss').count() == 0 and await pg.locator('#nt-e-due[hidden]').count() == 1)
            fb = await pg.locator('.ntfoot').bounding_box(); md = await pg.locator('.ntmd').bounding_box()
            check('New task: Cancel / Create stay in the footer, inside the screen', fb['y'] + fb['height'] <= 900 and md['y'] >= 0 and await pg.locator('.ntfoot [data-a=ntgo]').count() == 1, (fb, md))
            await pg.click('#nt-det summary'); await pg.click('.ntf [data-a=ntm][data-v=ea]'); await pg.wait_for_timeout(100)
            check('New task: Details stays open after picking a person', await pg.locator('details.ntdet[open]').count() == 1)
            await pg.fill('#nt-title', 'Plan the staff dinner'); await pg.fill('#nt-check', 'Pick a date\nBook a room'); await pg.click('[data-a=ntgo]'); await pg.wait_for_timeout(150)
            c = await pg.evaluate("Object.values(D.cards).find(c=>c.title==='Plan the staff dinner')")
            check('New task: same save as before (person, owner, due date, checklist, list)', c and c['members'] == ['ea'] and c['owner'] == 'ea' and len(c['check']) == 2 and await pg.locator('.list:has(.ltitle:text-is("To do")) .card:has-text("Plan the staff dinner")').count() == 1, c)

            # ---------- Calendar ----------
            await pg.evaluate("V.bview='cal';render()"); await pg.wait_for_timeout(100)
            k = await pg.evaluate("ymd(D.cards.crowd0.due)"); nd = await pg.evaluate(f"cardsOf(B()).filter(c=>c.due&&ymd(c.due)==='{k}').length")
            day = pg.locator(f'.cald[data-day="{k}"]')
            check('Calendar: a crowded day shows the first tasks and "+N more"', nd >= 5 and await day.locator('.cchip').count() == 2 and (await day.locator('.cmore').inner_text()).strip() == f'+{nd-2} more', nd)
            await day.locator('.cmore').click(); await pg.wait_for_timeout(100)
            check('Calendar: "+N more" opens every task of that day', await pg.locator('.dayd .dayi').count() == nd)
            await pg.click('.dayd .dayi >> nth=0'); await pg.wait_for_timeout(100)
            check('Calendar: clicking a task in the day list opens it', await pg.locator('.md .mt').count() >= 1 and await pg.locator('.dayd').count() == 0)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
            await pg.click('.cald.today .dnb'); await pg.wait_for_timeout(100)
            check('Calendar: clicking a day opens that day', await pg.locator('.dayd').count() == 1)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
            check('Calendar: Escape closes the day', await pg.locator('.dayd').count() == 0)
            await pg.evaluate("V.bview='tl';render()"); await pg.wait_for_timeout(100)
            check('Timeline: names column is pinned and labelled, with a Today marker', (await pg.inner_text('.tlnh')).strip() == 'Task' and await pg.evaluate("getComputedStyle(document.querySelector('.tll')).position") == 'sticky' and await pg.locator('.tnowl').count() == 1)
            await ctx.close()

            # ---------- every size, English and Arabic: no sideways page scroll ----------
            for w, h, mobile in [(390, 844, True), (768, 1024, False), (1366, 900, False)]:
                for lang in ['en', 'ar']:
                    ctx, pg = await page(w, h, lang, mobile); bad = []
                    for name, js in [('progress', "V.view='progress';render()"), ('projects', "V.view='projects';render()"), ('board', BOARD),
                                     ('calendar', "V.bview='cal';render()"), ('timeline', "V.bview='tl';render()"), ('new task', "V.bview='board';render();openNew({});V.nt.bad=['title','due','members'];render()")]:
                        await pg.evaluate(js); await pg.wait_for_timeout(80)
                        r = await pg.evaluate(SIDEWAYS)
                        if r: bad.append((name, r))
                    md = await pg.locator('.ntmd').bounding_box()
                    check(f'{w}x{h} {lang.upper()}: no sideways page scroll on progress, projects, board, calendar, timeline, new task', not bad, bad)
                    check(f'{w}x{h} {lang.upper()}: New task dialog fits the screen', md['x'] >= -1 and md['x'] + md['width'] <= w + 1 and md['y'] >= -1 and md['y'] + md['height'] <= h + 1, md)
                    if mobile:
                        small = await pg.evaluate("""()=>[...document.querySelectorAll('.ntmd button, .ntmd select, .ntmd input')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44&&!e.closest('.lchips')).map(e=>e.id||e.className)""")
                        check(f'Phone {lang.upper()}: New task controls are at least 44px tall', not small, small)
                        cols = await pg.evaluate("getComputedStyle(document.querySelector('.ntmd .g3')).gridTemplateColumns.split(' ').length")
                        check(f'Phone {lang.upper()}: New task is one column', cols == 1, cols)
                        await pg.evaluate("V.nt=null;" + BOARD); await pg.wait_for_timeout(80)
                        small = await pg.evaluate("""()=>[...document.querySelectorAll('.bbar button, .qbar button, .qbar .qsel, .lhead button, .lfoot button')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44).map(e=>e.className)""")
                        check(f'Phone {lang.upper()}: board controls are at least 44px tall', not small, small)
                    if lang == 'ar' and w == 1366:
                        await pg.evaluate("V.nt=null;V.view='progress';render()")
                        check('Arabic: progress labels are in Arabic', 'كل الشركة' in await pg.inner_text('.pgbar') and 'المشاريع حسب الحالة' in await pg.inner_text('.pgsum'))
                    await ctx.close()

            src = open(ROOT + '/boards/index.html', encoding='utf-8').read() if not os.environ.get('SITE_ROOT') else ''.join(open(f, encoding='utf-8').read() for f in __import__('glob').glob(ROOT + '/app/src/board/**/*.ts*', recursive=True))
            check('No emojis', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
            check('No page errors', not errs, errs[:3])
            await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} board redesign checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
