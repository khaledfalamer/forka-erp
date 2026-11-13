"""Screenshots for the Forka Board staff guide (sample data of the preview, never real staff data).

Run from the repo root:  python3 docs/guides/board/capture.py
Opens boards/index.html in its preview mode on 127.0.0.1 (no live server is called), as the
"Operations Supervisor" (a staff member, not a head and not the CEO), in English and in Arabic.
Writes shots/<lang>_<name>.jpg plus shots/marks.json: the position of every numbered callout,
so build.py can draw the numbers onto the pictures.
"""
import asyncio, datetime, json, os, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
ERP = HERE.parents[2]
OUT = HERE / 'shots'
PORT = 8857
BASE = f'http://127.0.0.1:{PORT}'
DESK = {'width': 1280, 'height': 800}
PHONE = {'width': 390, 'height': 844}
ME = 'os'          # Operations Supervisor: staff in Operations and in Executive & Administration
MARKS = {}
NOW = datetime.datetime(2026, 11, 13, 6, 0, tzinfo=datetime.timezone.utc)   # 10:00 in Dubai on the guide's date
LOC = {'en': 'en-GB', 'ar': 'en-GB'}   # Arabic date boxes stay dd/mm/yyyy (Chromium shows broken Arabic placeholders)

# ---------- sample content in Arabic (the preview data is English only) ----------
AR = {
  'Ajman Branch Opening': 'افتتاح فرع عجمان', 'Executive Admin Task Board': 'لوحة مهام الإدارة التنفيذية',
  'Staff rota for opening week': 'جدول الموظفين لأسبوع الافتتاح', 'Hood installation sign-off': 'اعتماد تركيب شفاط المطبخ',
  'Soft opening day': 'يوم الافتتاح التجريبي', 'Approve the opening budget': 'اعتماد ميزانية الافتتاح',
  'POS and printers set up': 'تجهيز نقاط البيع والطابعات', 'Opening stock order': 'طلب مخزون الافتتاح',
  'Trade licence renewed': 'تجديد الرخصة التجارية', 'Signage approved': 'اعتماد اللوحات',
  'Dry store order': 'طلب المخزن الجاف', 'Chiller and freezer order': 'طلب المبردات والمجمدات', 'Cleaning supplies': 'مواد التنظيف',
  'Uniforms for new staff': 'الزي الموحد للموظفين الجدد', 'Menu boards printed': 'طباعة لوحات قائمة الطعام',
  'Opening day staff briefing': 'اجتماع تعريفي للموظفين قبل الافتتاح',
  'Confirm Weekly Finance and Bookkeeping Meetings with Ahmed': 'تأكيد الاجتماعات الأسبوعية للمالية مع أحمد',
  'Research Ways to Improve Administrative Operations': 'البحث عن طرق لتحسين العمليات الإدارية',
  'Daily Inbox Sweep': 'مراجعة البريد اليومية', 'Daily Log - Operations': 'السجل اليومي - العمليات',
  'Update Monthly November Training Schedules': 'تحديث جداول تدريب نوفمبر',
  'Identify Administrative Support Needs in Marketing Department': 'تحديد احتياجات الدعم الإداري في قسم التسويق',
  'Coordinate with Mr. Adam to set a Weekly Meeting with Maintenance': 'التنسيق مع السيد آدم لاجتماع أسبوعي مع الصيانة',
  'Schedule 1-hour Google Meet with Bilal (Pixel Accounting) to review October 2026 financial reports': 'اجتماع لمدة ساعة مع بلال لمراجعة تقارير أكتوبر المالية',
  'Consolidated Processes and Reports every Department': 'توحيد الإجراءات والتقارير لكل قسم',
  'Schedule Weekly Procurement Meetings': 'جدولة اجتماعات المشتريات الأسبوعية',
  'Weekly Forka Admins Meetings': 'الاجتماع الأسبوعي لإداريي فوركا', 'Weekly Maintenance Meetings with Omar': 'الاجتماع الأسبوعي للصيانة مع عمر',
  'Monthly Forka Admin Meeting': 'الاجتماع الشهري لإدارة فوركا',
  'In-progress': 'قيد التنفيذ', 'Completed': 'مكتملة', 'Daily': 'يومية', 'Weekly': 'أسبوعية', 'Monthly': 'شهرية',
  'Area': 'المنطقة', 'Kitchen': 'المطبخ', 'Front of house': 'الصالة', 'Store': 'المخزن', 'Cost (AED)': 'التكلفة (درهم)',
  'Kitchen hood delivery slipped one week.': 'تأخر توريد شفاط المطبخ أسبوعاً.',
  'AED 85,000 for stock, uniforms and the first month of marketing.': '85,000 درهم للمخزون والزي الموحد وأول شهر من التسويق.',
  'Good morning team. From today we follow our work in Forka Boards. Ask your head if you cannot see your board.': 'صباح الخير يا فريق. من اليوم نتابع عملنا في لوحات فوركا. اسأل مسؤول قسمك إذا لم تظهر لك لوحتك.',
  'Reminder: the November training schedule is on the HR board.': 'تذكير: جدول تدريب نوفمبر موجود على لوحة الموارد البشرية.',
  'Weekly meetings with every department are booked. Invites are in your calendars.': 'تم حجز الاجتماعات الأسبوعية مع كل الأقسام. الدعوات في تقاويمكم.',
  'Thank you. Please add the minutes to each card after the meeting.': 'شكراً. يرجى إضافة محضر الاجتماع إلى كل بطاقة بعد الاجتماع.',
  'Ajman: hood delivery slipped one week. Soft opening date stays the same for now.': 'عجمان: تأخر توريد الشفاط أسبوعاً. موعد الافتتاح التجريبي باقٍ كما هو حالياً.',
  'Maintenance technician for Sharjah and Ajman.': 'فني صيانة لفرعي الشارقة وعجمان.',
  'On site in Fujairah. Call the Maintenance Head for urgent jobs.': 'في موقع العمل بالفجيرة. للأعمال العاجلة اتصل بمسؤول الصيانة.',
}
# what the guide adds to the sample data, so every feature has something to show
ADD = {
 'en': dict(desc='Cover every shift from 23 to 30 Nov. Two cashiers on each evening shift.',
            check=['List the staff for each shift', 'Check days off and leave', 'Share the rota with the team'],
            c1='@Operations Supervisor please add the two new cashiers to the evening shifts.',
            c2='Done. The draft is attached. @Operations Head please check it.', file='Opening-week-rota.pdf',
            m1='@Operations Supervisor please check the POS printers with the supplier tomorrow.',
            m2='Thank you. I will finish the staff rota by Sunday.', dm='Can you send me the rota draft before you share it?',
            about='Operations Supervisor for the UAE branches. I work 9am to 6pm, Sunday to Thursday.', ooo='On leave. Please ask the Operations Head.',
            phone='+971 50 000 0000', newt='Order name badges for the opening team'),
 'ar': dict(desc='تغطية كل الورديات من 23 إلى 30 نوفمبر. أمينا صندوق في كل وردية مسائية.',
            check=['تحديد الموظفين لكل وردية', 'مراجعة أيام الراحة والإجازات', 'مشاركة الجدول مع الفريق'],
            c1='@مشرف العمليات يرجى إضافة أميني الصندوق الجديدين إلى الورديات المسائية.',
            c2='تم. المسودة مرفقة. @مسؤول العمليات يرجى مراجعتها.', file='جدول-أسبوع-الافتتاح.pdf',
            m1='@مشرف العمليات يرجى التأكد من طابعات نقاط البيع مع المورد غداً.',
            m2='شكراً. سأنهي جدول الموظفين يوم الأحد.', dm='هل يمكنك إرسال مسودة الجدول لي قبل مشاركتها؟',
            about='مشرف العمليات لفروع الإمارات. أعمل من 9 صباحاً إلى 6 مساءً، من الأحد إلى الخميس.', ooo='في إجازة. يرجى التواصل مع مسؤول العمليات.',
            phone='+971 50 000 0000', newt='طلب بطاقات أسماء لفريق الافتتاح'),
}

ENRICH = r"""([lang, AR, A]) => {
  const tr = s => lang === 'ar' && AR[s] ? AR[s] : s;
  D.me = 'os';
  const aj = Object.values(D.boards).find(b => b.name === 'Ajman Branch Opening');
  const ea = Object.values(D.boards).find(b => b.name === 'Executive Admin Task Board');
  const byT = (b, x) => cardsOf(b).find(c => c.title === x);
  const H = 3600e3;
  // the busy day for the calendar (+N more): three extra tasks on the same day as the staff rota
  const todo = D.lists[aj.lists[0]], rota = byT(aj, 'Staff rota for opening week');
  [['Uniforms for new staff', 'os', ['proc']], ['Menu boards printed', 'oh', ['mkt']], ['Opening day staff briefing', 'oh', []]].forEach(([title, who, labels]) => {
    const c = {id: uid('c'), title, desc: '', labels, members: [who], owner: who, due: rota.due, done: false, doneAt: null, repeat: '', priority: 'normal', check: [], log: [{at: Date.now() - 26 * H, by: 'oh', k: 'l_added', a: 'To do'}]};
    D.cards[c.id] = c; todo.cards.push(c.id) });
  // priorities and due dates that show every tag
  byT(aj, 'Hood installation sign-off').priority = 'urgent';
  rota.priority = 'high';
  byT(aj, 'Approve the opening budget').due = today() + day;          // due tomorrow: amber
  byT(aj, 'Trade licence renewed').due = today() - 3 * day;           // done with a date: green
  // the card opened in the guide
  rota.desc = A.desc;
  rota.check = A.check.map((t, i) => ({t, d: i === 0}));
  rota.follow = ['oh'];
  rota.log = [{at: Date.now() - 60 * 60e3, by: 'os', c: A.c2}, {at: Date.now() - 3 * H, by: 'oh', c: A.c1}, {at: Date.now() - 2 * 24 * H, by: 'oh', k: 'l_added', a: lang === 'ar' ? 'للعمل' : 'To do'}];
  rota.atts = [{id: 'att1', name: A.file, type: 'application/pdf', size: 48 * 1024, by: 'os', at: Date.now() - 60 * 60e3}];
  // alerts for the bell
  const pos = byT(aj, 'POS and printers set up');
  D.notes = [{id: 'n1', to: 'os', by: 'oh', k: 'mention', card: rota.id, at: Date.now() - 3 * H, read: false},
             {id: 'n2', to: 'os', by: 'oh', k: 'assign', card: pos.id, at: Date.now() - 5 * H, read: false},
             {id: 'n3', to: 'os', by: 'ea', k: 'comment', card: byT(ea, 'Research Ways to Improve Administrative Operations').id, at: Date.now() - 26 * H, read: true}];
  // chat: a mention in the Operations channel, a reply, and a direct message
  D.msgs = D.msgs || {};
  D.msgs.ops = (D.msgs.ops || []).concat([{id: 'm1', by: 'oh', at: Date.now() - 50 * 60e3, t: A.m1}, {id: 'm2', by: 'os', at: Date.now() - 40 * 60e3, t: A.m2}]);
  D.msgs[dmKey('os', 'oh')] = [{id: 'm3', by: 'oh', at: Date.now() - 30 * 60e3, t: A.dm}];
  // Arabic sample content
  if (lang === 'ar') {
    Object.values(D.lists).forEach(l => { if (!l.sys) l.name = tr(l.name) });
    Object.values(D.boards).forEach(b => { b.name = tr(b.name); if (b.status && b.status.note) b.status.note = tr(b.status.note);
      (b.fields || []).forEach(f => { f.name = tr(f.name); (f.opts || []).forEach(o => o.name = tr(o.name)) }) });
    Object.values(D.cards).forEach(c => { c.title = tr(c.title); c.desc = tr(c.desc); (c.subs || []).forEach(s => s.t = tr(s.t)) });
    Object.values(D.msgs).forEach(L => L.forEach(m => m.t = tr(m.t)));
    Object.values(D.prof || {}).forEach(p => { if (p.about) p.about = tr(p.about); if (p.ooo && p.ooo.note) p.ooo.note = tr(p.ooo.note) });
    (D.goals || []).forEach(g => g.title = g.title);
  }
  // in the live app staff never see the preview notes
  ['en', 'ar'].forEach(l => { T[l].attHint = T[l].attHintLive; T[l].chatNote = ''; T[l].emailNote = '' });
  home(); save(); render();
}"""

# a callout: CSS selector, anchor (s = start edge, e = end edge, t, b, c, ts = top-start corner ...), nth match, text filter
def M(sel, a='s', n=0, txt=None, dx=0, dy=0, lead=False):
    return dict(sel=sel, a=a, n=n, txt=txt, dx=dx, dy=dy, lead=lead)

POINT = r"""([m, clip]) => {
  let els = [...document.querySelectorAll(m.sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height });
  if (m.txt) els = els.filter(e => e.textContent.includes(m.txt));
  const el = els.at(m.n); if (!el) return null;
  const r = el.getBoundingClientRect(), rtl = document.documentElement.dir === 'rtl';
  let a = m.a.replace('s', rtl ? 'R' : 'L').replace('e', rtl ? 'L' : 'R');
  let x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
  if (a.includes('L')) x = r.left; if (a.includes('R')) x = r.right;
  if (a.includes('t')) y = r.top; if (a.includes('b')) y = r.bottom;
  // the number sits just outside the element, never on top of its text
  const G = m.lead ? 0 : 13; if (a.includes('L')) x -= G; if (a.includes('R')) x += G; if (a.includes('t')) y -= G; if (a.includes('b')) y += G;
  const dx = rtl ? -m.dx : m.dx;
  return {x: x + dx - (clip ? clip.x : 0), y: y + m.dy - (clip ? clip.y : 0)};
}"""

async def shot(pg, lang, name, marks=(), clip=None, el=None, pad=0, keep_mouse=False):
    """clip: dict x,y,width,height (CSS px) or el: selector of the element to crop to (plus pad)."""
    vp = pg.viewport_size
    if not keep_mouse:
        await pg.mouse.move(vp['width'] - 2, vp['height'] - 2)     # no hover colours on the buttons
    await pg.wait_for_timeout(300)
    if el:
        r = await pg.evaluate("s => { const r = document.querySelector(s).getBoundingClientRect(); return {x: r.left, y: r.top, width: r.width, height: r.height} }", el)
        clip = {'x': max(0, r['x'] - pad), 'y': max(0, r['y'] - pad)}
        clip['width'] = min(vp['width'], r['x'] + r['width'] + pad) - clip['x']
        clip['height'] = min(vp['height'], r['y'] + r['height'] + pad) - clip['y']
    pts = []
    for i, m in enumerate(marks):
        p = await pg.evaluate(POINT, [m, clip])
        if p is None:
            print(f'  ! {lang}_{name}: callout {i + 1} not found: {m["sel"]} {m["txt"] or ""}')
            continue
        pts.append({'n': i + 1, 'x': round(p['x'], 1), 'y': round(p['y'], 1), 'lead': m['lead']})
    w = clip['width'] if clip else vp['width']; h = clip['height'] if clip else vp['height']
    for q in pts:
        if not (-16 <= q['x'] <= w + 16 and -16 <= q['y'] <= h + 16):
            print(f'  ! {lang}_{name}: callout {q["n"]} is outside the picture ({q["x"]}, {q["y"]})')
    # leader lines: the number sits in the margin beside the picture (end side), a thin line runs to the target
    last = -99
    for q in sorted([q for q in pts if q['lead']], key=lambda q: q['y']):
        q['tx'], q['ty'] = q['x'], q['y']
        q['x'] = w + 26 if lang == 'en' else -26
        q['y'] = max(q['y'], last + 26); last = q['y']
    MARKS[f'{lang}_{name}'] = {'w': w, 'h': h, 'marks': pts}
    await pg.screenshot(path=str(OUT / f'{lang}_{name}.jpg'), type='jpeg', quality=86, clip=clip)
    print('shot', f'{lang}_{name}', len(pts), 'callouts')

# small pictures of each tag for the legend: (name, the first element that matches, the parts inside it to frame)
TAGS = [('pri_urgent', '.card.urg .pri', None), ('pri_high', '.card .pri.high', None), ('due_over', '.card.urg .due.over', None),
        ('due_soon', '.due.soon', None), ('due_plain', '.card:not(.done) .due:not(.over):not(.soon)', None), ('due_ok', '.card.done .due.ok', None),
        ('labels', '.card.urg .lbs', 'span'), ('ms', '.card.ms .ct', 'text'), ('wait', '.card .wt', None), ('ap', '.card .ap', None),
        ('badges', '.card .bd', ':scope > span:not(.who)'), ('field', '.card .fcs', 'span'), ('subs', '.card .ckc[title]', None)]

async def crop(pg, lang, name, sel, part=None, pad=3):
    r = await pg.evaluate("""([s, part]) => { const e = document.querySelector(s); if (!e) return null;
      let rs = [e.getBoundingClientRect()];
      if (part === 'text') { const g = document.createRange(); g.selectNodeContents(e); rs = [g.getBoundingClientRect()] }
      else if (part) rs = [...e.querySelectorAll(part)].map(x => x.getBoundingClientRect());
      const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top)), R = Math.max(...rs.map(r => r.right)), B = Math.max(...rs.map(r => r.bottom));
      return [l, t, R - l, B - t] }""", [sel, part])
    if not r:
        print(f'  ! {lang}_{name}: not found {sel}'); return
    clip = {'x': r[0] - pad, 'y': r[1] - pad, 'width': r[2] + 2 * pad, 'height': r[3] + 2 * pad}
    MARKS[f'{lang}_{name}'] = {'w': clip['width'], 'h': clip['height'], 'marks': []}
    await pg.screenshot(path=str(OUT / f'{lang}_{name}.png'), clip=clip)

async def guard(route):
    u = route.request.url
    if u.startswith(BASE) or u.startswith('https://fonts.googleapis.com/') or u.startswith('https://fonts.gstatic.com/'):
        return await route.continue_()
    print('  blocked', u)
    await route.abort()

HIDE = '.viewas,.top label.hide-sm{display:none!important}'   # the "View as" picker exists only in the preview

async def board_ctx(b, lang, viewport, scale=2):
    ctx = await b.new_context(viewport=viewport, device_scale_factor=scale, service_workers='block', locale=LOC[lang],
                              timezone_id='Asia/Dubai', has_touch=viewport is PHONE, is_mobile=viewport is PHONE)
    await ctx.clock.set_system_time(NOW)
    await ctx.add_init_script(f"try{{localStorage.setItem('fb-lang','{lang}');localStorage.setItem('fb-side','full')}}catch(e){{}}")
    await ctx.route('**/*', guard)
    pg = await ctx.new_page()
    await pg.goto(f'{BASE}/boards/'); await pg.wait_for_timeout(1200)
    await pg.evaluate(ENRICH, [lang, AR, ADD[lang]])
    await pg.add_style_tag(content=HIDE)
    await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(400)
    return ctx, pg

AJ = "Object.values(D.boards).find(b=>b.dept==='ops'&&!b.kind).id"
ROTA = "cardsOf(B()).find(c=>c.priority==='high').id"

async def desktop(b, lang):
    ctx, pg = await board_ctx(b, lang, DESK)
    A = ADD[lang]
    # 1. My tasks
    await shot(pg, lang, 'mine', [M('.side .nav[data-v=mine]', 'e'), M('.tabs .tab', 'e', 3), M('.vseg', 'e'),
                                  M('.mtbl .due', 's', 0), M('select.msec', 's', 0), M('.sech .lk2', 's', 0)])
    # sidebar and top bar
    await shot(pg, lang, 'side', [M('.bs-mini', 's'), M('.side .newt', 'e'), M('.side .nav[data-v=mine]', 'e'),
                                  M('.side .nav[data-v=projects]', 'e'), M('.side .nav[data-v=chat]', 'e'), M('.side .nav[data-v=people]', 'e'),
                                  M('.side .nav[data-v=goals]', 'e'), M('.side .nav[data-a=dept]', 'e', 1), M('.bs-apps', 'e')],
               clip={'x': 0, 'y': 52, 'width': 252, 'height': 748})
    await shot(pg, lang, 'topbar', [M('.top .seg', 'b'), M('.top .bell', 'b'), M('.top .meav', 'b')],
               clip={'x': 1280 - 330, 'y': 0, 'width': 330, 'height': 52} if lang == 'en' else {'x': 0, 'y': 0, 'width': 330, 'height': 52})
    await pg.evaluate('bMini(true)'); await pg.wait_for_timeout(300)
    await shot(pg, lang, 'side_mini', [], clip={'x': 0, 'y': 52, 'width': 80, 'height': 520})
    await pg.evaluate('bMini(false)')
    # My tasks calendar tab (used for the calendar page)
    await pg.click('.tabs .tab[data-v=cal]'); await pg.wait_for_timeout(300)
    await shot(pg, lang, 'mine_cal', [M('.tabs .tab[data-v=cal]', 'b')], clip={'x': 252, 'y': 52, 'width': 1028, 'height': 748})
    await pg.click('.tabs .tab[data-v=list]')
    # 2. the board
    await pg.evaluate(f"V.view='board';V.board={AJ};V.dept=null;render()"); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'board', [M('.list .lhead', 'ts', 0), M('.card', 'e', 0), M('.lfoot .addc', 's', 0),
                                   M('.bbar .vseg', 'b'), M('#fb-owner', 'b'), M('.search input', 's'), M('.bbar .pill[data-a=filter]', 'b')])
    # tags close-up: the To do list
    await shot(pg, lang, 'tags', [], el='.list[data-id]', pad=10)
    for key, sel, part in TAGS:
        await crop(pg, lang, 'tag_' + key, sel, part)
    # the filter bar in use
    await pg.select_option('#fb-owner', ME); await pg.wait_for_timeout(250)
    await pg.click('.qbar .chip[data-v=week]'); await pg.wait_for_timeout(300)
    await shot(pg, lang, 'filter', [M('.qbar .qsel', 'b', 0), M('.qbar .qsel', 'b', 1), M('.qbar .chip[data-v=week]', 'b'),
                                    M('.qbar .qcount', 'b'), M('.qbar .chip[data-a=fclear]', 'e'), M('.list .lcount', 'b', 0)],
               clip={'x': 252, 'y': 52, 'width': 1028, 'height': 380})
    await pg.click('.qbar .chip[data-a=fclear]'); await pg.wait_for_timeout(200)
    word = 'rota' if lang == 'en' else 'جدول'
    await pg.fill('#q', word); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'search', [M('.search input', 's'), M('.qbar .chip.on', 'b', 0), M('.card', 'e', 0)],
               clip={'x': 0, 'y': 0, 'width': 1280, 'height': 420})
    await pg.evaluate("V.f.q='';render()")
    # drag and drop, caught half way
    card = pg.locator('.card', has_text=('POS' if lang == 'en' else 'نقاط البيع')).first
    bb = await card.bounding_box()
    tgt = await pg.locator('.list').nth(2).bounding_box()
    await pg.mouse.move(bb['x'] + 40, bb['y'] + 20); await pg.mouse.down()
    await pg.mouse.move(bb['x'] + 60, bb['y'] + 30, steps=3)
    await pg.mouse.move(tgt['x'] + 60, tgt['y'] + 210, steps=12); await pg.wait_for_timeout(300)
    await shot(pg, lang, 'drag', [M('.ghost', 'e'), M('.ph', 's', 0)], clip={'x': 252, 'y': 146, 'width': 1028, 'height': 474}, keep_mouse=True)
    await pg.mouse.up(); await pg.wait_for_timeout(200)
    await pg.evaluate("const c=cardsOf(B()).find(c=>/POS|نقاط/.test(c.title));const L=Object.values(D.lists).find(l=>l.cards.includes(c.id));if(!/progress|قيد/i.test(LN(L))){moveCard(c.id,B().lists[1],0)}c.done=false;save();render()")
    # 3. the task card
    await pg.evaluate(f"V.card={ROTA};render()"); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'card', [M('.mhead > svg', 's'), M('.md .kv label', 's', 0), M('#cdue', 's'), M('.donebx', 'e'),
                                  M('#cpri', 's'), M('.side2 [data-a=follow]', 's'), M('#crep', 's'), M('#cmove', 's')],
               el='.md', pad=0)
    await pg.evaluate("document.querySelector('.md .sec .sh svg').closest('.sec');[...document.querySelectorAll('.md .sec')].find(s=>s.querySelector('#cdesc')).scrollIntoView({block:'start'})")
    await pg.wait_for_timeout(300)
    await shot(pg, lang, 'card_desc', [M('#cdesc', 'ts'), M('#subin', 's'), M('#wadd', 's'), M('.upl', 'e'), M('.att .btn', 'e', -1)],
               el='.md', pad=0)
    await pg.evaluate("[...document.querySelectorAll('.md .sec')].find(s=>s.querySelector('#ckin')).scrollIntoView({block:'start'})")
    await pg.wait_for_timeout(300)
    await pg.click('.cki input[data-i="1"]'); await pg.mouse.move(5, 5); await pg.wait_for_timeout(300)
    await pg.evaluate("[...document.querySelectorAll('.md .sec')].find(s=>s.querySelector('#ckin')).scrollIntoView({block:'start'})")
    await pg.wait_for_timeout(300)
    await shot(pg, lang, 'card_check', [M('.prog', 's', 0), M('.cki input', 's', 1), M('#ckin', 's'), M('#cmt', 'e'),
                                        M('.md [data-a=cmt]', 'e'), M('.bub .ment', 'b', 0)], el='.md', pad=0)
    await pg.evaluate("V.card=null;render()")
    # 4. new task: empty and filled
    await pg.evaluate("V.view='mine';V.board=null;render()"); await pg.wait_for_timeout(200)
    await pg.click('.side .newt'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ntgo]'); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'new_err', [M('.ntf .errbox', 's'), M('#nt-title', 's'), M('.ntf .lchips.own', 's'), M('#nt-due', 's'), M('[data-a=ntgo]', 'b')],
               el='.ntmd', pad=0)
    await pg.select_option('#nt-board', index=0); await pg.wait_for_timeout(200)
    await pg.fill('#nt-title', A['newt'])
    await pg.click(f'.ntf .pchip[data-v={ME}]'); await pg.wait_for_timeout(200)
    await pg.evaluate("const d=new Date(today()+5*day);document.getElementById('nt-due').value=ymd(d);document.getElementById('nt-due').dispatchEvent(new Event('input',{bubbles:true}));ntLive()")
    await pg.select_option('#nt-pri', 'high')
    await pg.evaluate("ntSync();V.nt.det=true;V.nt.labels=['proc'];V.nt.check='" + ("2 name badges per person\\nCheck the spelling of every name" if lang == 'en' else "بطاقتان لكل شخص\\nمراجعة كتابة كل اسم") + "';render()")
    await pg.wait_for_timeout(300)
    await shot(pg, lang, 'new_top', [M('.ntg legend', 's', 0), M('#nt-title', 's'), M('#nt-dept', 'b'), M('#nt-board', 'b'),
                                     M('#nt-list', 'b'), M('.ntf .pchip.on', 's', 0)], el='.ntmd', pad=0)
    await pg.evaluate("document.querySelector('.ntg legend').closest('.ntf').scrollTop=9999"); await pg.wait_for_timeout(300)
    await shot(pg, lang, 'new_bot', [M('.ntg legend', 's', 1), M('#nt-due', 'b'), M('#nt-pri', 'b'), M('#nt-det summary', 's'),
                                     M('#nt-check', 's'), M('[data-a=ntgo]', 'b')], el='.ntmd', pad=0)
    await pg.evaluate("V.nt=null;render()")
    # 5. calendar and timeline
    await pg.evaluate(f"V.view='board';V.board={AJ};V.bview='cal';render()"); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'cal', [M('.bbar .vseg button', 'b', 1), M('.calbar .ib', 's', 0), M('.calbar .pill', 'e'), M('.cchip.over', 's', 0),
                                 M('.cmore', 'e', 0), M('.cald.today .dadd', 'b')], clip={'x': 252, 'y': 52, 'width': 1028, 'height': 748})
    await pg.click('.cmore'); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'cal_day', [M('.dayi', 's', 0), M('.dayf .btn', 'b', 1)], el='.dayd', pad=0)
    await pg.evaluate("V.calDay=null;V.bview='tl';render()"); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'timeline', [M('.bbar .vseg button', 'b', 2), M('.tnowl', 'e', 0), M('.tbar.over', 'e', 0), M('.tms', 'e', 0), M('.tbar[aria-label*="–"]', 'b', 0), M('button.tll', 's', 0)],
               clip={'x': 252, 'y': 52, 'width': 1028, 'height': 748})
    await pg.evaluate("V.bview='board';render()")
    # 6. chat
    await pg.evaluate("V.view='chat';V.ch='ops';V.board=null;markSeen('ops');render();scrollChat()"); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'chat', [M('.chl h5', 's', 0), M('.chi', 'e', 0), M('.chl h5', 's', 1), M('#dmnew', 's'),
                                  M('.msg .ment', 'b', 0), M('#chin', 's'), M('[data-a=chsend]', 'b')], clip={'x': 252, 'y': 52, 'width': 1028, 'height': 748})
    # 7. alerts
    await pg.evaluate("V.view='mine';render()"); await pg.wait_for_timeout(200)
    await pg.click('[data-a=bell]'); await pg.wait_for_timeout(400)
    r = await pg.evaluate("(()=>{const r=document.getElementById('pop').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()")
    x0 = max(0, r[0] - 40); x1 = min(1280, r[2] + 40)
    await shot(pg, lang, 'bell', [M('.top .bell', 'b'), M('.note-i.unread', 's', 0), M('.note-i', 's', 2), M('#pop [data-a=nread]', 's'), M('#emailme', 's')],
               clip={'x': x0, 'y': 0, 'width': x1 - x0, 'height': r[3] + 20})
    await pg.click('[data-a=bell]'); await pg.wait_for_timeout(200)
    # 8. people and profile
    await pg.evaluate("V.pop=null;V.view='people';render()"); await pg.wait_for_timeout(300)
    await pg.fill('#pq2', 'Technician' if lang == 'en' else 'الفني'); await pg.wait_for_timeout(300)
    await shot(pg, lang, 'people', [M('.side .nav[data-v=people]', 'e'), M('#pq2', 's'), M('.pcard', 's', 0), M('.awt', 'e', 0)],
               clip={'x': 0, 'y': 52, 'width': 1000 if lang == 'en' else 1280, 'height': 368})
    await pg.evaluate(f"V.prof='{ME}';V.profEdit=true;render()"); await pg.wait_for_timeout(300)
    await pg.fill('#pr-phone', A['phone']); await pg.fill('#pr-about', A['about'])
    await pg.evaluate("const f=d=>ymd(today()+d*day);document.getElementById('pr-from').value=f(14);document.getElementById('pr-to').value=f(18)")
    await pg.fill('#pr-note', A['ooo']); await pg.wait_for_timeout(200)
    await shot(pg, lang, 'profile', [M('#pr-phone', 's'), M('#pr-about', 's'), M('#pr-from', 'b'), M('#pr-to', 'b'),
                                     M('#pr-note', 'b'), M('[data-a=profsave]', 'b')], el='.md', pad=0)
    await ctx.close()

async def phone(b, lang):
    ctx, pg = await board_ctx(b, lang, PHONE, scale=2)
    await shot(pg, lang, 'm_mine', [M('.menu-b', 'b'), M('.tabs .tab', 'b', 0)])
    await pg.evaluate("V.side=true;render()"); await pg.wait_for_timeout(300)
    await shot(pg, lang, 'm_menu', [M('.side .newt', 'e')])
    await pg.evaluate(f"V.side=false;V.view='board';V.board={AJ};render()"); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'm_board', [M('.card', 'e', 0)])
    await pg.evaluate(f"V.card={ROTA};render()"); await pg.wait_for_timeout(400)
    await shot(pg, lang, 'm_card', [])
    await ctx.close()

async def hub(b, lang):
    me = dict(email='ops.supervisor@forka.com', name='Operations Supervisor' if lang == 'en' else 'مشرف العمليات', title='Operations Supervisor', level='staff',
              status='active', apps=dict(proc=0, hire=0, branch=0), sides=[], method='google')
    gis = "window.google={accounts:{id:{_cb:null,initialize(o){this._cb=o.callback},prompt(){},renderButton(el){el.innerHTML='<button id=\"gsi\">G</button>';el.querySelector('#gsi').onclick=()=>this._cb({credential:'tok:x'})}}}};"
    cfg = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'x.apps.googleusercontent.com',PROCUREMENT_URL:'',HIRING_URL:'',BOARDS_URL:'https://boards.test/exec',PROCUREMENT_SERVER:'',ERP_HOME:'/'};"
    ctx = await b.new_context(viewport=DESK, device_scale_factor=2, service_workers='block', timezone_id='Asia/Dubai')
    await ctx.clock.set_system_time(NOW)
    await ctx.add_init_script(f"try{{localStorage.setItem('fa-lang','{lang}')}}catch(e){{}}")
    async def route(r):
        u = r.request.url
        if 'config.js' in u: return await r.fulfill(body=cfg, content_type='application/javascript')
        if u.startswith(BASE) or 'fonts.g' in u: return await r.continue_()
        if 'gsi/client' in u: return await r.fulfill(body=gis, content_type='application/javascript')
        if 'accounts.test' in u: return await r.fulfill(json={'ok': True, 'me': me, 'token': 'S1', 'ver': 'v1'})
        return await r.fulfill(json={'ok': True})          # fake test addresses only; nothing real is called
    await ctx.route('**/*', route)
    pg = await ctx.new_page(); await pg.goto(f'{BASE}/'); await pg.wait_for_timeout(1500)
    if await pg.locator('#gsi').count(): await pg.click('#gsi'); await pg.wait_for_timeout(1200)
    await pg.evaluate('document.fonts.ready')
    await shot(pg, lang, 'hub', [M('[data-app=boards]', 'te', dx=-34, dy=34)], clip={'x': 0, 'y': 0, 'width': 1280, 'height': 640})
    await ctx.close()

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ERP, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            for lang in (sys.argv[1:] or ['en', 'ar']):
                loc = LOC[lang]   # one browser per language, so date boxes show dates the local way (19/11/2026)
                b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None, channel=None if os.environ.get('PW_CHROMIUM') else 'chromium',
                                            args=[f'--lang={loc}'], env=dict(os.environ, LANG=loc.replace('-', '_') + '.UTF-8', LANGUAGE=loc.replace('-', '_')))
                await hub(b, lang); await desktop(b, lang); await phone(b, lang)
                await b.close()
    finally:
        srv.terminate()
    old = json.loads((OUT / 'marks.json').read_text()) if (OUT / 'marks.json').exists() else {}
    old.update(MARKS)
    (OUT / 'marks.json').write_text(json.dumps(old, indent=1, ensure_ascii=False))

asyncio.run(main())
