"""Forka Boards (preview) - browser checks. python3 tests/boards_test.py"""
import asyncio, os, pathlib, subprocess, sys, time, re
from playwright.async_api import async_playwright
ROOT=str(pathlib.Path(__file__).resolve().parent.parent); OUT=str(pathlib.Path(ROOT)/'tests'/'shots'); res=[]
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))
async def drag(pg, src, dst, dy=0):
    a = await pg.locator(src).bounding_box(); b = await pg.locator(dst).bounding_box()
    await pg.mouse.move(a['x']+a['width']/2, a['y']+a['height']/2); await pg.mouse.down()
    for i in range(1, 16):
        await pg.mouse.move(a['x']+a['width']/2+(b['x']+b['width']/2-a['x']-a['width']/2)*i/15, a['y']+a['height']/2+(b['y']+dy-a['y']-a['height']/2)*i/15); await pg.wait_for_timeout(16)
    await pg.mouse.up(); await pg.wait_for_timeout(150)
async def main():
    srv = subprocess.Popen([sys.executable,'-m','http.server','8799','--bind','127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            ctx = await b.new_context(viewport={'width':1440,'height':900}, device_scale_factor=2)
            pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
            await pg.goto('http://127.0.0.1:8799/boards/'); await pg.wait_for_timeout(1200)
            names = await pg.locator('.list .ltitle').all_inner_texts()
            check('Board opens with the six lists', names == ['To do','In-progress','Completed','Daily','Weekly','Monthly'], names)
            await pg.screenshot(path=OUT+'/boards_en.png')
            L = lambda n: f'.list:has(.ltitle:text-is("{n}"))'
            # add card
            await pg.click(L('To do')+' [data-a=addc]'); await pg.fill('#newc', 'Book the January staff training room'); await pg.keyboard.press('Enter')
            await pg.fill('#newc', 'Second quick card'); await pg.keyboard.press('Enter'); await pg.keyboard.press('Escape')
            cnt = await pg.locator(L('To do')+' .card').count()
            check('Add a card (Enter adds and keeps the box open for the next one)', cnt == 4, cnt)
            # drag card To do -> Completed
            await drag(pg, '.card:has-text("Book the January")', L('Completed')+' .card >> nth=0', dy=4)
            ok = await pg.locator(L('Completed')+' .card:has-text("Book the January")').count()
            first = (await pg.locator(L('Completed')+' .card').first.inner_text())
            check('Drag a card to another list, at the spot you drop it', ok == 1 and 'Book the January' in first, first)
            # reorder within list
            await drag(pg, L('Weekly')+' .card >> nth=3', L('Weekly')+' .card >> nth=0', dy=4)
            wk = await pg.locator(L('Weekly')+' .card .ct').all_inner_texts()
            check('Drag to reorder inside a list', 'Muhammad' in wk[0], wk)
            # drag list
            await drag(pg, L('Weekly')+' .lhead .ltitle', '.brand b', dy=140)
            names = await pg.locator('.list .ltitle').all_inner_texts()
            check('Drag a whole list to a new place', names[0] == 'Weekly', names)
            # open card + details
            await pg.click('.card:has-text("Book the January")'); await pg.wait_for_timeout(200)
            check('Clicking a card opens its details', await pg.locator('.md').count() == 1 and 'Completed' in await pg.inner_text('.msub'))
            await pg.click('[data-a=cl][data-v=hr]'); await pg.click('[data-a=cm][data-v=ka]')
            await pg.fill('#ckin','Ask HR for numbers'); await pg.keyboard.press('Enter'); await pg.fill('#ckin','Reserve the room'); await pg.keyboard.press('Enter')
            await pg.click('[data-a=ck][data-i="0"]')
            await pg.fill('#cdesc', 'Room for 30 people, projector needed.')
            await pg.fill('#cmt', 'I will call the hotel tomorrow.'); await pg.click('[data-a=cmt]')
            await pg.fill('#cdue', '2026-11-12'); await pg.dispatch_event('#cdue','change')
            await pg.screenshot(path=OUT+'/boards_card.png')
            check('Checklist shows progress (1 of 2 = 50%)', '50%' in await pg.inner_text('.prog'))
            check('Comment and move history show in Activity', 'call the hotel' in await pg.inner_text('.md') and 'moved this card from To do to Completed' in await pg.inner_text('.md'))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
            ct = await pg.inner_text('.card:has-text("Book the January")')
            check('Card front shows due date, checklist 1/2, comment count and member', '1/2' in ct and '12 Nov' in ct and 'KA' in ct, ct)
            # persistence
            await pg.reload(); await pg.wait_for_timeout(800)
            ct = await pg.inner_text('.card:has-text("Book the January")')
            check('Everything is still there after a reload', '1/2' in ct and (await pg.locator('.list .ltitle').first.inner_text()) == 'Weekly')
            # filter + search
            await pg.click('[data-a=filter]'); await pg.click('[data-a=fl][data-v=fin]')
            vis = await pg.locator('.card').count()
            check('Filter by label shows only those cards', vis == 3, vis)
            await pg.click('[data-a=fclear]'); await pg.fill('#q','maintenance'); await pg.wait_for_timeout(100)
            vis = await pg.locator('.card').count(); check('Search finds cards by words', vis == 3, vis)
            await pg.fill('#q',''); await pg.click('[data-a=filter]')
            await pg.click('.card:has-text("Second quick card")'); await pg.click('[data-a=cdel]')
            shown = await pg.locator('[role=alertdialog]').count()
            await pg.click('[data-a=ask-no]'); kept = await pg.locator('.md').count() == 1
            await pg.click('[data-a=cdel]'); await pg.click('[data-a=ask-yes]'); await pg.wait_for_timeout(100)
            check('Delete asks first (in the page), Cancel keeps it, Delete removes it', shown == 1 and kept and await pg.locator('.card:has-text("Second quick card")').count() == 0)
            # collapse list
            await pg.click(L('Daily')+' [data-a=lcol]'); check('Collapse a list', await pg.locator('.list.col').count() == 1)
            await pg.click('.list.col [data-a=lcol]')
            # add list + new board
            await pg.click('[data-a=addl]'); await pg.fill('#newl','Waiting on others'); await pg.keyboard.press('Enter'); await pg.keyboard.press('Escape')
            check('Add a list', 'Waiting on others' in await pg.locator('.list .ltitle').all_inner_texts())
            await pg.click('[data-a=boards]'); await pg.fill('#newb','Maintenance - Sharjah'); await pg.click('[data-a=bnew]')
            check('Create a new board (starts with To do / In progress / Done)', await pg.locator('.list .ltitle').all_inner_texts() == ['To do','In progress','Done'])
            await pg.click('[data-a=boards]'); await pg.click('.pop .mi:has-text("Executive Admin")')
            # Arabic
            await pg.click('[data-a=lang][data-v=ar]'); await pg.wait_for_timeout(200)
            check('Arabic switches the page right to left', await pg.get_attribute('html','dir') == 'rtl' and 'إضافة بطاقة' in await pg.inner_text('body'))
            await pg.screenshot(path=OUT+'/boards_ar.png')
            await pg.click('.card:has-text("Book the January")'); await pg.wait_for_timeout(150)
            await pg.screenshot(path=OUT+'/boards_card_ar.png'); await pg.keyboard.press('Escape')
            await pg.click('[data-a=lang][data-v=en]')
            check('No page errors (desktop)', not errs, errs[:3])
            await ctx.close()
            # phone
            ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, has_touch=True, is_mobile=True)
            pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('http://127.0.0.1:8799/boards/'); await pg.wait_for_timeout(1000)
            check('Phone: page fits the screen (lists scroll sideways inside the board)', await pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            await pg.screenshot(path=OUT+'/boards_phone.png')
            await pg.tap('.card >> nth=0'); await pg.wait_for_timeout(200)
            check('Phone: tap opens the card full screen', await pg.locator('.md').count() == 1)
            await pg.screenshot(path=OUT+'/boards_phone_card.png')
            check('No page errors (phone)', not errs, errs[:3])
            src = open(ROOT+'/boards/index.html').read()
            check('No emojis', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
            await b.close()
    finally: srv.terminate()
    print(f'{sum(res)}/{len(res)} boards checks passed'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
