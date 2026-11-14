"""Board task rules (Khaled, 14 Nov 2026): the creator, the department head and the CEO change the details; people a task
is given to do the work, redirect it within their team, add a supervisor and ask to archive; restore and Undo.
Sample-data preview on 127.0.0.1 with "View as". python3 tests/board_rules_test.py   (SHOTS=dir also saves screenshots)"""
import asyncio, os, pathlib, re, subprocess, sys, time
from playwright.async_api import async_playwright
ROOT = str(pathlib.Path(__file__).resolve().parent.parent); PORT = 8781; URL = f'http://127.0.0.1:{PORT}/boards/?demo'
SHOTS = os.environ.get('SHOTS')
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

L = lambda n: f'.list:has(.ltitle:text-is("{n}"))'
CARD = 'Instagram posts - week 1'      # December Campaign: created by the Marketing Head (mh), given to the Designer (md)
ROTA = 'Staff rota for opening week'   # Ajman Branch Opening: created by the Operations Head (oh), given to the Operations Supervisor (os)

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
            await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
            await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.evaluate("localStorage.clear()"); await pg.goto(URL); await pg.wait_for_timeout(1000)
            async def shot(name):
                if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, name))
            async def as_(pid):
                await pg.keyboard.press('Escape'); await pg.keyboard.press('Escape')
                await pg.select_option('#viewas', pid); await pg.wait_for_timeout(150)
            async def board(dept, name):
                await pg.click(f'.side [data-a=dept][data-id={dept}]'); await pg.wait_for_timeout(100)
                await pg.click(f'.tile:has(h3:text-is("{name}"))'); await pg.wait_for_timeout(150)
            async def card(title):
                await pg.click(f'.card:has-text("{title}")'); await pg.wait_for_timeout(150)
            async def bell():
                await pg.click('[data-a=bell]'); await pg.wait_for_timeout(100); t = await pg.inner_text('#pop'); await pg.keyboard.press('Escape'); return t
            # a cashier joins Operations and the Ajman board, so the supervisor has a teammate to hand work to
            await pg.evaluate("person('u1').depts={ops:'staff'};Object.values(D.boards).find(b=>b.name==='Ajman Branch Opening').members.push('u1');save();render()")

            # ---------- the creator ----------
            await as_('mh'); await board('mkt', 'December Campaign'); await card(CARD)
            check('Creator: title, description and checklist are editable', await pg.locator('textarea#mt').count() == 1 and await pg.locator('#cdesc').count() == 1 and await pg.locator('#ckin').count() == 1 and await pg.locator('#ronote').count() == 0)
            await pg.fill('#cdesc', 'Three posts, one per day.'); await pg.fill('#ckin', 'Post 4'); await pg.click('[data-a=ckadd]'); await pg.wait_for_timeout(100)
            check('Creator changes the description and adds a checklist item', 'Post 4' in await pg.inner_text('.md') and await pg.evaluate(f"Object.values(D.cards).find(c=>c.title==='{CARD}').desc") == 'Three posts, one per day.')
            check('Creator sees Archive (no "Ask to archive")', await pg.locator('[data-a=carch]').count() == 1 and await pg.locator('[data-a=arqask]').count() == 0)
            await shot('1-card-as-creator.png')

            # ---------- the assigned person ----------
            await as_('md'); await board('mkt', 'December Campaign'); await card(CARD)
            note = await pg.inner_text('#ronote')
            check('Assigned: details are read-only text with the note who may change them', await pg.locator('textarea#mt').count() == 0 and await pg.locator('h2#mtro').count() == 1 and await pg.locator('#cdesc').count() == 0
                  and await pg.locator('#cdescro').count() == 1 and 'Only Marketing Head (who created this task) or the department head can change the details.' in note, note)
            check('Assigned: no inputs for dates, priority, type, labels, repeats; no checklist add or remove', all([await pg.locator(s).count() == 0 for s in ['#cdue', '#cstart', '#cpri', '#ctype', '#crep', '[data-a=cl]', '#ckin', '[data-a=ckdel]', '#wadd', '[data-a=cm]']]))
            check('Assigned: Redirect, Supervisor and Ask to archive are there (Archive is not)', await pg.locator('[data-a=redir]').count() == 1 and await pg.locator('#csupv').count() == 1 and await pg.locator('[data-a=arqask]').count() == 1 and await pg.locator('[data-a=carch]').count() == 0)
            await shot('2-card-as-assigned.png')
            await pg.click('.cki:has-text("Post 3") input[type=checkbox]'); await pg.wait_for_timeout(100)
            check('Assigned: ticks a checklist item', await pg.evaluate(f"Object.values(D.cards).find(c=>c.title==='{CARD}').check.filter(x=>x.d).length") == 3)
            await pg.fill('#cmt', 'Post 3 is live.'); await pg.click('[data-a=cmt]'); await pg.wait_for_timeout(100)
            check('Assigned: comments', 'Post 3 is live.' in await pg.inner_text('.md'))
            todo = await pg.eval_on_selector('#cmove', 'e=>[...e.options].find(o=>o.text==="To do").value')
            await pg.select_option('#cmove', todo); await pg.wait_for_timeout(100)
            await pg.click('[data-a=cdone]'); await pg.wait_for_timeout(100)
            st = await pg.evaluate(f"(c=>[listOf(c.id).name,c.done])(Object.values(D.cards).find(c=>c.title==='{CARD}'))")
            check('Assigned: moves it to another list and marks it complete', st == ['To do', True], st)
            await pg.click('[data-a=cdone]'); await pg.wait_for_timeout(100)

            # ---------- ask to archive -> decline, then accept, Undo, restore ----------
            await pg.click('[data-a=arqask]'); await pg.fill('#arqwhy', 'Posted already'); await pg.click('[data-a=arqsend]'); await pg.wait_for_timeout(150)
            check('Ask to archive: the card shows "Archive requested by Designer" for everyone', 'Archive requested by Designer' in await pg.inner_text('#arqb') and await pg.locator('#arqb [data-a=arqok]').count() == 0)
            await as_('nt'); await pg.evaluate(f"V.card=Object.values(D.cards).find(c=>c.title==='{CARD}').id;render()"); await pg.wait_for_timeout(100)
            check('...also for someone else who opens it', 'Archive requested by Designer' in await pg.inner_text('#arqb'))
            await as_('mh')
            check('The creator gets an alert', 'Designer asked to archive your task' in await bell())
            await board('mkt', 'December Campaign')
            check('The card front shows "Archive requested"', await pg.locator(f'.card:has-text("{CARD}") .arqt').count() == 1)
            await card(CARD)
            check('Creator sees the banner with Accept and Decline', await pg.locator('#arqb [data-a=arqok]').count() == 1 and await pg.locator('#arqb [data-a=arqno]').count() == 1 and 'Posted already' in await pg.inner_text('#arqb'))
            await shot('3-creator-archive-request.png')
            await pg.click('#arqb [data-a=arqno]'); await pg.wait_for_timeout(100)
            check('Decline clears the request and logs it', await pg.locator('#arqb').count() == 0 and 'declined the archive request' in await pg.inner_text('.md'))
            await as_('md')
            check('The person who asked is told', 'Marketing Head did not agree to archive the task' in await bell())
            await board('mkt', 'December Campaign'); await card(CARD); await pg.click('[data-a=arqask]'); await pg.click('[data-a=arqsend]'); await pg.wait_for_timeout(100)
            await as_('mh'); await board('mkt', 'December Campaign'); await card(CARD); await pg.click('#arqb [data-a=arqok]'); await pg.wait_for_timeout(150)
            check('Accept archives it, with an Undo button', await pg.locator(f'.card:has-text("{CARD}")').count() == 0 and await pg.locator('.toast [data-a=undo]').count() == 1)
            await pg.click('.toast [data-a=undo]'); await pg.wait_for_timeout(150)
            check('Undo brings it back', await pg.locator(f'.card:has-text("{CARD}")').count() == 1)
            await card(CARD); await pg.click('[data-a=carch]'); await pg.wait_for_timeout(100)
            await pg.click('[data-a=bmenu]'); await pg.click('[data-a=archv]'); await pg.wait_for_timeout(100)
            check('Archived items lists it with Restore for the creator', await pg.locator(f'#pop .arch:has-text("{CARD}") [data-a=crestore]').count() == 1)
            await shot('5-archived-items.png')
            await pg.keyboard.press('Escape'); await pg.click('.side [data-a=go][data-v=mine]'); await pg.wait_for_timeout(100)
            check('My tasks lists "Archived tasks you created" with Restore', CARD in await pg.inner_text('#myarch'))
            await pg.click(f'#myarch tr:has-text("{CARD}") [data-a=crestore]'); await pg.wait_for_timeout(100)
            check('Restore from My tasks puts it back on the board', await pg.evaluate(f"!Object.values(D.cards).find(c=>c.title==='{CARD}').archived"))
            await as_('md'); await board('mkt', 'December Campaign'); await card(CARD)
            check('Assigned person cannot archive directly', await pg.locator('[data-a=carch]').count() == 0)
            await pg.keyboard.press('Escape'); await pg.click('[data-a=bmenu]'); await pg.click('[data-a=archv]'); await pg.wait_for_timeout(100)
            await pg.keyboard.press('Escape')

            # ---------- redirect within the team, supervisor ----------
            await as_('os'); await board('ops', 'Ajman Branch Opening'); await card(ROTA)
            await pg.click('[data-a=redir]'); await pg.wait_for_timeout(100)
            names = await pg.locator('#pop [data-a=redirgo]').all_inner_texts()
            check('Redirect: only people from my own team on this board (no Technician from Maintenance)', any('Cashier' in n for n in names) and not any('Technician' in n for n in names), names)
            await shot('4-redirect-picker.png')
            await pg.click('#pop [data-a=redirgo][data-v=u1]'); await pg.wait_for_timeout(150)
            c = await pg.evaluate(f"Object.values(D.cards).find(c=>c.title==='{ROTA}')")
            check('Redirect: the Cashier takes my place and it is logged', c['members'] == ['u1'] and c['owner'] == 'u1' and any(x.get('k') == 'l_redir' for x in c['log']) and 'redirected this task from Operations Supervisor to Cashier' in await pg.inner_text('.md'), c['members'])
            check('...after that I see the details read-only and cannot redirect again', await pg.locator('[data-a=redir]').count() == 0 and await pg.locator('#cmove').count() == 0)
            await as_('u1')
            check('The new person gets an alert', 'Operations Supervisor redirected a task to you' in await bell())
            await board('ops', 'Ajman Branch Opening'); await card(ROTA)
            opts = await pg.eval_on_selector('#csup', 'e=>[...e.options].map(o=>o.value)')
            check('Supervisor: chosen from my team only', 'os' in opts and 'nt' not in opts and 'md' not in opts, opts)
            await pg.select_option('#csup', 'os'); await pg.wait_for_timeout(100)
            check('Supervisor set and logged', 'Operations Supervisor' in await pg.inner_text('#csupv') and 'made Operations Supervisor the supervisor' in await pg.inner_text('.md'))
            await pg.fill('#cmt', 'Rota draft is on the drive.'); await pg.click('[data-a=cmt]'); await pg.wait_for_timeout(100)
            await as_('oh')
            check('The creator is told about the redirect', 'Operations Supervisor redirected your task to Cashier' in await bell())
            await as_('os')
            al = await bell()
            check('The supervisor gets alerts like a follower', 'Cashier made you the supervisor of a task' in al and 'Cashier commented' in al, al[:300])
            await pg.click('.side [data-a=go][data-v=mine]'); await pg.wait_for_timeout(100)
            check('My tasks lists the tasks I supervise', ROTA in await pg.inner_text('#mysup'))

            # ---------- someone on the board, not given the task ----------
            await as_('nt'); await board('ops', 'Ajman Branch Opening'); await card(ROTA)
            check('Not assigned: read-only, no complete or move, no redirect or ask to archive; can comment', await pg.locator('[data-a=cdone]').count() == 0 and await pg.locator('#cmove').count() == 0
                  and await pg.locator('[data-a=redir]').count() == 0 and await pg.locator('[data-a=arqask]').count() == 0 and await pg.locator('#cmt').count() == 1 and 'You can comment and follow it.' in await pg.inner_text('#ronote'))
            await pg.click('[data-a=follow]'); await pg.wait_for_timeout(100)
            check('Not assigned: can follow', await pg.evaluate(f"Object.values(D.cards).find(c=>c.title==='{ROTA}').follow.includes('nt')"))
            await pg.keyboard.press('Escape')
            n0 = await pg.evaluate(f"listOf(Object.values(D.cards).find(c=>c.title==='{ROTA}').id).name")
            a = await pg.locator(f'.card:has-text("{ROTA}")').bounding_box(); t2 = await pg.locator(L('Done')).bounding_box()
            await pg.mouse.move(a['x'] + 20, a['y'] + 10); await pg.mouse.down()
            for i in range(1, 12): await pg.mouse.move(a['x'] + 20 + (t2['x'] + 40 - a['x']) * i / 11, a['y'] + 10); await pg.wait_for_timeout(16)
            await pg.mouse.up(); await pg.wait_for_timeout(150); await pg.keyboard.press('Escape')
            check('Not assigned: cannot drag the card to another list', await pg.evaluate(f"listOf(Object.values(D.cards).find(c=>c.title==='{ROTA}').id).name") == n0)

            # ---------- department heads ----------
            await as_('oh'); await board('ops', 'Ajman Branch Opening'); await card('POS and printers set up')
            check('The department head changes details of a task (on a board of the department they lead)', await pg.locator('textarea#mt').count() == 1 and await pg.locator('[data-a=carch]').count() == 1)
            await as_('ph')
            ed = await pg.evaluate(f"cap(Object.values(D.cards).find(c=>c.title==='{CARD}')).ed")
            check('A head of another department may not change the details', ed is False)

            # ---------- CEO ----------
            await as_('ka'); await board('mkt', 'December Campaign'); await card(CARD)
            check('CEO can do everything (details, archive, assign)', await pg.locator('textarea#mt').count() == 1 and await pg.locator('#cdue').count() == 1 and await pg.locator('[data-a=carch]').count() == 1 and await pg.locator('[data-a=cm]').count() > 0)
            await pg.fill('textarea#mt', CARD + ' (CEO)'); await pg.keyboard.press('Tab'); await pg.wait_for_timeout(100)
            check('CEO changes the title', await pg.evaluate(f"Object.values(D.cards).some(c=>c.title==='{CARD} (CEO)')"))
            await pg.fill('textarea#mt', CARD); await pg.keyboard.press('Tab')

            # ---------- Arabic ----------
            await as_('md'); await pg.click('[data-a=lang][data-v=ar]'); await pg.wait_for_timeout(150)
            await board('mkt', 'December Campaign'); await card(CARD)
            body = await pg.inner_text('.md')
            check('Arabic: right to left, read-only note, Redirect, Supervisor and Ask to archive in Arabic', await pg.get_attribute('html', 'dir') == 'rtl' and 'منشئ هذه المهمة' in body and 'تحويل' in body and 'المشرف' in body and 'طلب الأرشفة' in body, body[:200])
            await shot('6-card-arabic.png')
            await pg.keyboard.press('Escape'); await pg.click('[data-a=lang][data-v=en]')
            check('No page errors', not errs, errs[:3])
            src = open(os.path.join(ROOT, 'boards', 'index.html'), encoding='utf-8').read() + await pg.inner_text('body')
            check('No emojis', not re.search('[\U0001F300-\U0001FAFF\u2600-\u27BF]', src))
            await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} Board task rules checks passed'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
