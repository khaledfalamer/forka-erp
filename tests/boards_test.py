"""Forka Boards (preview with departments) - browser checks. python3 tests/boards_test.py"""
import asyncio, os, pathlib, subprocess, sys, time, re
from playwright.async_api import async_playwright

ROOT = str(pathlib.Path(__file__).resolve().parent.parent); OUT = str(pathlib.Path(ROOT) / 'tests' / 'shots'); pathlib.Path(OUT).mkdir(exist_ok=True)
PORT = 8799; URL = f'http://127.0.0.1:{PORT}/boards/'
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

async def drag(pg, src, dst, dy=0):
    a = await pg.locator(src).bounding_box(); b = await pg.locator(dst).bounding_box()
    await pg.mouse.move(a['x']+a['width']/2, a['y']+a['height']/2); await pg.mouse.down()
    for i in range(1, 16):
        await pg.mouse.move(a['x']+a['width']/2+(b['x']+b['width']/2-a['x']-a['width']/2)*i/15, a['y']+a['height']/2+(b['y']+dy-a['y']-a['height']/2)*i/15); await pg.wait_for_timeout(16)
    await pg.mouse.up(); await pg.wait_for_timeout(150)

async def view_as(pg, pid):
    await pg.select_option('#viewas', pid); await pg.wait_for_timeout(150)

async def open_board(pg, dept, name):
    await pg.click(f'.side [data-a=dept][data-id={dept}]'); await pg.wait_for_timeout(100)
    await pg.click(f'.tile:has(h3:text-is("{name}"))'); await pg.wait_for_timeout(150)

L = lambda n: f'.list:has(.ltitle:text-is("{n}"))'

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(1200)

            # ---------- CEO ----------
            body = await pg.inner_text('.page')
            rows = await pg.locator('.page table >> nth=0').locator('tr.click').count()
            check('CEO opens on Company progress with all 8 departments', 'Company progress' in body and rows == 8, rows)
            check('Company progress shows overdue work (Finance is behind)', 'Bank reconciliation for two accounts is late' in body and await pg.locator('.kpi.bad').count() == 1)
            check('Projects are listed with their head\'s status (Off track first)', (await pg.locator('.page table >> nth=1').locator('tr.click .st').first.inner_text()).strip() == 'Off track')
            await pg.screenshot(path=OUT + '/boards_ceo.png')
            await pg.click('.side [data-a=go][data-v=mine]'); await pg.wait_for_timeout(100)
            check('My tasks lists what is assigned to the CEO, overdue first', 'Coordinate with Mr. Adam' in await pg.inner_text('.page'))
            check('CEO sees every department in the side bar', await pg.locator('.side [data-a=dept]').count() == 8)

            # ---------- board basics (CEO is admin everywhere) ----------
            await open_board(pg, 'ops', 'Executive Admin Task Board')
            names = await pg.locator('.list .ltitle').all_inner_texts()
            check('Board opens with its lists', names == ['To do', 'In-progress', 'Completed', 'Daily', 'Weekly', 'Monthly'], names)
            await pg.screenshot(path=OUT + '/boards_en.png')
            await pg.click(L('To do') + ' [data-a=addc]'); await pg.fill('#newc', 'Book the January staff training room'); await pg.keyboard.press('Enter')
            await pg.fill('#newc', 'Second quick card'); await pg.keyboard.press('Enter'); await pg.keyboard.press('Escape')
            cnt = await pg.locator(L('To do') + ' .card').count()
            check('Add a card (Enter adds and keeps the box open for the next one)', cnt == 4, cnt)
            await drag(pg, '.card:has-text("Book the January")', L('Completed') + ' .card >> nth=0', dy=4)
            first = await pg.locator(L('Completed') + ' .card').first.inner_text()
            check('Drag a card to another list, at the spot you drop it', 'Book the January' in first, first)
            check('Dropping a card in a Done/Completed list marks it complete', await pg.locator(L('Completed') + ' .card.done:has-text("Book the January")').count() == 1)
            await drag(pg, L('In-progress') + ' .card >> nth=2', L('In-progress') + ' .card >> nth=0', dy=4)
            wk = await pg.locator(L('In-progress') + ' .card .ct').all_inner_texts()
            check('Drag to reorder inside a list', 'Confirm Weekly Finance' in wk[0], wk)
            await drag(pg, L('Completed') + ' .lhead .ltitle', '.crumb', dy=140)
            names = await pg.locator('.list .ltitle').all_inner_texts()
            check('Department head / CEO can drag a whole list', names[0] == 'Completed', names)
            await pg.click('.card:has-text("Book the January")'); await pg.wait_for_timeout(200)
            check('Clicking a card opens its details', await pg.locator('.md').count() == 1)
            await pg.click('[data-a=cl][data-v=hr]'); await pg.click('[data-a=cm][data-v=os]')
            await pg.fill('#ckin', 'Ask HR for numbers'); await pg.keyboard.press('Enter'); await pg.fill('#ckin', 'Reserve the room'); await pg.keyboard.press('Enter')
            await pg.click('[data-a=ck][data-i="0"]')
            await pg.fill('#cdesc', 'Room for 30 people, projector needed.')
            await pg.fill('#cmt', 'I will call the hotel tomorrow.'); await pg.click('[data-a=cmt]')
            await pg.fill('#cdue', '2026-11-12'); await pg.dispatch_event('#cdue', 'change')
            check('Card people come from the board\'s team', await pg.locator('.md [data-a=cm]').count() == 3)
            check('Checklist shows progress (1 of 2 = 50%)', '50%' in await pg.inner_text('.prog'))
            check('Comment and move history show in Activity', 'call the hotel' in await pg.inner_text('.md') and 'moved this card from To do to Completed' in await pg.inner_text('.md'))
            await pg.screenshot(path=OUT + '/boards_card.png')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
            ct = await pg.inner_text('.card:has-text("Book the January")')
            check('Card front shows due date, checklist 1/2 and the person', '1/2' in ct and '12 Nov' in ct and 'OS' in ct, ct)
            await pg.click('.card:has-text("Second quick card")'); await pg.click('[data-a=cdel]')
            shown = await pg.locator('[role=alertdialog]').count(); await pg.click('[data-a=ask-no]'); kept = await pg.locator('.md').count() == 1
            await pg.click('[data-a=cdel]'); await pg.click('[data-a=ask-yes]'); await pg.wait_for_timeout(100)
            check('Delete asks first (in the page), Cancel keeps it, Delete removes it', shown == 1 and kept and await pg.locator('.card:has-text("Second quick card")').count() == 0)
            await pg.click('[data-a=filter]'); await pg.click('[data-a=fl][data-v=fin]')
            vis = await pg.locator('.card').count(); check('Filter by label shows only those cards', vis == 2, vis)
            await pg.click('[data-a=fclear]'); await pg.fill('#q', 'maintenance'); await pg.wait_for_timeout(100)
            vis = await pg.locator('.card').count(); check('Search finds cards on this board', vis == 2, vis)
            await pg.fill('#q', ''); await pg.click('[data-a=filter]')
            await pg.click(L('Daily') + ' [data-a=lcol]'); check('Collapse a list', await pg.locator('.list.col').count() == 1)
            await pg.click('.list.col [data-a=lcol]')
            await pg.reload(); await pg.wait_for_timeout(800)
            await open_board(pg, 'ops', 'Executive Admin Task Board')
            check('Everything is still there after a reload', '1/2' in await pg.inner_text('.card:has-text("Book the January")') and (await pg.locator('.list .ltitle').first.inner_text()) == 'Completed')

            # ---------- department head ----------
            await view_as(pg, 'mh')
            check('Marketing head opens on My tasks, without Company progress', 'My tasks' in await pg.inner_text('.page h1') and await pg.locator('.side [data-v=progress]').count() == 0)
            ids = await pg.eval_on_selector_all('.side [data-a=dept]', 'e=>e.map(x=>x.dataset.id)')
            check('Marketing head sees only Marketing', ids == ['mkt'], ids)
            await pg.click('.side [data-a=dept][data-id=mkt]'); await pg.click('[data-a=bnew-open]'); await pg.fill('#newb', 'Ramadan Menu Launch'); await pg.click('[data-a=bnew]'); await pg.wait_for_timeout(150)
            check('Head creates a board (To do / In progress / Done)', await pg.locator('.list .ltitle').all_inner_texts() == ['To do', 'In progress', 'Done'])
            await pg.click('[data-a=members]'); await pg.click('.pop [data-a=mtoggle][data-v=md]'); await pg.click('.pop [data-a=mtoggle][data-v=ph]')
            check('Head picks the people for the board (own department and others)', await pg.locator('.bbar .members .av').count() == 3)
            await pg.screenshot(path=OUT + '/boards_members.png'); await pg.keyboard.press('Escape')
            await pg.click('.bbar [data-a=status]'); await pg.click('[data-a=stset][data-v=risk]'); await pg.fill('#stnote', 'Photographer not booked yet.'); await pg.click('[data-a=stsave]')
            check('Head sets the project status with a note', 'At risk' in await pg.inner_text('.bbar'))

            # ---------- staff ----------
            await view_as(pg, 'md')
            await pg.click('.side [data-a=dept][data-id=mkt]')
            tiles = await pg.locator('.tile h3').all_inner_texts()
            check('A person added by the head now sees that board', 'Ramadan Menu Launch' in tiles and 'December Campaign' in tiles, tiles)
            check('Staff cannot create boards', await pg.locator('[data-a=bnew-open]').count() == 0)
            await pg.click('.tile:has(h3:text-is("Ramadan Menu Launch"))')
            check('Staff cannot change the team, the status or the lists', await pg.locator('[data-a=members]').count() == 0 and await pg.locator('button.st').count() == 0 and await pg.locator('[data-a=addl]').count() == 0)
            await pg.click(L('To do') + ' [data-a=addc]'); await pg.fill('#newc', 'Shoot the new dishes'); await pg.keyboard.press('Enter'); await pg.keyboard.press('Escape')
            check('Staff can add and work on cards', await pg.locator('.card:has-text("Shoot the new dishes")').count() == 1)
            await view_as(pg, 'os')
            ids = await pg.eval_on_selector_all('.side [data-a=dept]', 'e=>e.map(x=>x.dataset.id)')
            check('Operations supervisor sees Operations only, and only boards they are on', ids == ['ops'], ids)
            await pg.click('.side [data-a=dept][data-id=ops]')
            check('...two Operations boards', sorted(await pg.locator('.tile h3').all_inner_texts()) == ['Ajman Branch Opening', 'Executive Admin Task Board'])
            await pg.click('.side [data-a=go][data-v=mine]')
            check('My tasks shows the card the CEO assigned them', 'Book the January' not in await pg.inner_text('.page') and 'Daily Inbox Sweep' in await pg.inner_text('.page'))
            await pg.screenshot(path=OUT + '/boards_mine.png')

            # ---------- back to CEO: the head's status shows on Company progress ----------
            await view_as(pg, 'ka')
            body = await pg.inner_text('.page')
            check('CEO sees the new board and the head\'s note on Company progress', 'Ramadan Menu Launch' in body and 'Photographer not booked yet.' in body)
            await pg.click('[data-a=lang][data-v=ar]'); await pg.wait_for_timeout(200)
            check('Arabic switches the page right to left', await pg.get_attribute('html', 'dir') == 'rtl' and 'تقدّم الشركة' in await pg.inner_text('body'))
            await pg.screenshot(path=OUT + '/boards_ceo_ar.png')
            await open_board(pg, 'ops', 'Executive Admin Task Board')
            await pg.screenshot(path=OUT + '/boards_ar.png')
            await pg.click('[data-a=lang][data-v=en]')
            check('No page errors (desktop)', not errs, errs[:3])
            await ctx.close()

            # ---------- phone ----------
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, has_touch=True, is_mobile=True)
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(1000)
            check('Phone: page fits the screen', await pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            await pg.screenshot(path=OUT + '/boards_phone_ceo.png')
            await pg.tap('[data-a=side]'); await pg.wait_for_timeout(300); await pg.tap('.side [data-a=dept][data-id=ops]'); await pg.wait_for_timeout(200)
            await pg.tap('.tile:has(h3:text-is("Executive Admin Task Board"))'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=OUT + '/boards_phone.png')
            await pg.tap('.card >> nth=0'); await pg.wait_for_timeout(200)
            check('Phone: menu opens departments; tap opens a card full screen', await pg.locator('.md').count() == 1)
            check('No page errors (phone)', not errs, errs[:3])
            src = open(ROOT + '/boards/index.html', encoding='utf-8').read()
            check('No emojis', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
            await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} boards checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
