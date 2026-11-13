"""Build the Forka Board staff guide PDFs (English and Arabic) from content.py and the screenshots.

Run from the repo root:
    python3 docs/guides/board/capture.py      # screenshots + callout positions (shots/)
    python3 docs/guides/board/build.py        # Forka-Board-Staff-Guide-EN.pdf and -AR.pdf
Add --png=DIR to also render every page to DIR/<lang>-NN.png for checking.
The PDF is made from HTML with Chromium (Playwright), so the web fonts and right-to-left Arabic come out right.
"""
import asyncio, html, json, os, pathlib, sys
from playwright.async_api import async_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import content as C

HERE = pathlib.Path(__file__).resolve().parent
ERP = HERE.parents[2]
SHOTS = HERE / 'shots'
MARKS = json.loads((SHOTS / 'marks.json').read_text())
OUTNAME = {'en': 'Forka-Board-Staff-Guide-EN.pdf', 'ar': 'Forka-Board-Staff-Guide-AR.pdf'}
LANG = 'en'

def T(pair):
    """pick the English or Arabic text of a pair"""
    return pair[0] if LANG == 'en' else pair[1]

def e(s):
    return html.escape(s, quote=True)

def uri(p):
    return pathlib.Path(p).resolve().as_uri()

# ---------- pieces ----------
def fig(name, width, start=0, cap=None, cls='', frame='shot'):
    """a screenshot in a soft frame, with the numbered callouts drawn on it.
    width in mm; start shifts the numbers (start=6 makes the first callout 7)."""
    key = f'{LANG}_{name}'
    m = MARKS[key]
    w, h = m['w'], m['h']
    ext = 'png' if name.startswith('tag_') else 'jpg'
    hmm = width * h / w
    marks = ''.join(f'<span class="mk" style="left:{q["x"] / w * 100:.2f}%;top:{q["y"] / h * 100:.2f}%">{q["n"] + start}</span>' for q in m['marks'])
    capt = f'<figcaption>{e(cap)}</figcaption>' if cap else ''
    return (f'<figure class="fig {cls}" style="width:{width}mm"><div class="{frame}" style="height:{hmm:.2f}mm">'
            f'<img src="{uri(SHOTS / f"{key}.{ext}")}" alt=""></div><div class="mks" style="height:{hmm:.2f}mm">{marks}</div>{capt}</figure>')

def tagimg(name, scale=0.27):
    key = f'{LANG}_tag_{name}'
    m = MARKS[key]
    return f'<img class="tagimg" src="{uri(SHOTS / f"{key}.png")}" style="width:{m["w"] * scale:.2f}mm;height:{m["h"] * scale:.2f}mm" alt="">'

def steps(items, start=0, cols=1, cls=''):
    li = ''.join(f'<li><span class="n">{i + 1 + start}</span><div><b>{e(T(t))}</b> {e(T(x))}</div></li>' for i, (t, x) in enumerate(items))
    return f'<ol class="steps c{cols} {cls}">{li}</ol>'

def note(text, kind='head', title=None):
    label = {'head': ('Good to know', 'معلومة مفيدة'), 'tip': ('Tip', 'نصيحة'), 'req': None}[kind]
    t = title or (T(label) if label else '')
    return f'<div class="note {kind}"><div class="nt">{e(t)}</div><p>{e(text)}</p></div>'

def row(a, b, cls=''):
    return f'<div class="row {cls}"><div>{a}</div><div>{b}</div></div>'

PAGE_NO = [0]
def page(body, sec=None, title=None, lead=None, cls=''):
    PAGE_NO[0] += 1
    n = PAGE_NO[0]
    head = ''
    if sec:
        head = (f'<header class="ph"><span class="kick"><b>{sec:02d}</b>{e(T(C.SECTIONS[sec - 1]))}</span><i></i></header>')
    if title:
        head += f'<h1>{e(T(title))}</h1>'
    if lead:
        head += f'<p class="lead">{e(T(lead))}</p>'
    foot = (f'<footer><span>{e(T(C.FOOT))} · {e(T(C.DATE))}</span><span class="pn">{n:02d}</span></footer>') if n > 1 else ''
    return f'<section class="page {cls}"><div class="in">{head}{body}</div>{foot}</section>'

# ---------- pages ----------
def cover():
    icon = (ERP / 'logos' / 'forka-board-icon.svg').read_text()
    icon = icon[icon.index('<svg'):].replace('width="64" height="64"', 'class="big"')
    return page(f'''
      <div class="cv-mark">{icon}</div>
      <img class="cv-logo" src="{uri(ERP / 'logos' / 'forka-board-logo.png')}" alt="Forka Board">
      <div class="cv-title"><h1>{e(T(C.COVER['title']))}<br><em>{e(T(C.COVER['title2']))}</em></h1>
        <span class="cv-rule"></span><p>{e(T(C.COVER['sub']))}</p></div>
      <div class="cv-shot"><img src="{uri(SHOTS / f'{LANG}_board.jpg')}" alt=""></div>
      <div class="cv-meta"><b>{e(T(C.COVER['org']))}</b><span>{e(T(C.COVER['meta']))}</span></div>''', cls='cover')

def contents(starts):
    items = ''.join(f'<li><span class="cn">{i + 1:02d}</span><span class="ct">{e(T(s))}</span><span class="dots"></span><span class="cp">{starts[i]:02d}</span></li>'
                    for i, s in enumerate(C.SECTIONS))
    items += f'<li class="qr"><span class="cn">—</span><span class="ct">{e(T(C.QUICK))}</span><span class="dots"></span><span class="cp">{starts[-1]:02d}</span></li>'
    K = C.CONTENTS
    sample = f'<span class="mk inl">1</span>'
    return page(f'''
      <h1 class="toc-h">{e(T(K['title']))}</h1>
      <ol class="toc">{items}</ol>
      <div class="howgrid">
        <div class="how"><div class="hn">{sample}</div><h3>{e(T(K['how_t']))}</h3><p>{e(T(K['how']))}</p></div>
        <div class="how"><h3>{e(T(K['who_t']))}</h3><p>{e(T(K['who']))}</p></div>
        <div class="how"><h3>{e(T(K['help_t']))}</h3><p>{e(T(K['help']))}</p></div>
      </div>''', cls='toc-page')

def p_open():
    P = C.PAGES['open']
    body = fig('hub', 176, cap=T(P['hubcap']))
    right = fig('topbar', 84, start=1, cap=T(P['topcap'])) + steps(P['top'], start=1)
    left = steps(P['hub'], cls='big') + note(T(P['note']))
    body += row(left, right, 'r5050 mt6')
    body += note(T(P['tip']), 'tip')
    return page(body, 1, P['title'], P['lead'])

def p_menu():
    P = C.PAGES['menu']
    pics = (f'<div class="sidepics">{fig("side", 54)}'
            f'<div class="mini">{fig("side_mini", 15, cap=T(P["minicap"]))}</div></div>')
    return page(row(pics, steps(P['steps']), 'r-side'), 1, P['title'], P['lead'])

def p_phone():
    P = C.PAGES['phone']
    cells = ''
    for name, (t, x) in zip(['m_mine', 'm_menu', 'm_board', 'm_card'], P['caps']):
        cells += f'<div class="ph-cell">{fig(name, 44, frame="shot phone")}<div><h4>{e(T(t))}</h4><p>{e(T(x))}</p></div></div>'
    return page(f'<div class="phones">{cells}</div>' + note(T(P['tip']), 'tip'), 1, P['title'], P['lead'])

def p_full(key, shot, sec, cols=2, extra=''):
    P = C.PAGES[key]
    body = fig(shot, 176, cap=T(P['cap'])) + steps(P['steps'], cols=cols)
    if P.get('note'):
        body += note(T(P['note']))
    return page(body + extra, sec, P['title'], P['lead'])

def p_wide(key, shot, sec, width=164):
    P = C.PAGES[key]
    body = fig(shot, width, cap=T(P['cap']), cls='center') + steps(P['steps'], cols=2)
    if P.get('note'):
        body += note(T(P['note']))
    return page(body, sec, P['title'], P['lead'])

def p_side(key, shot, sec, width=110):
    P = C.PAGES[key]
    body = row(fig(shot, width, cap=T(P['cap'])), steps(P['steps']), 'r-fig')
    if P.get('note'):
        body += note(T(P['note']))
    return page(body, sec, P['title'], P['lead'])

def p_tags():
    P = C.PAGES['tags']
    rows = ''.join(f'<div class="lg"><div class="lgi">{tagimg(k)}</div><div class="lgt"><b>{e(T(t))}</b> {e(T(x))}</div></div>' for k, (t, x) in P['rows'])
    return page(row(fig('tags', 60, cap=T(P['cap'])), f'<div class="legend">{rows}</div>', 'r-tags'), 3, P['title'], P['lead'])

def p_filter():
    P = C.PAGES['filter']
    body = fig('filter', 176, cap=T(P['cap'])) + steps(P['steps'], cols=3)
    body += fig('search', 176, start=6, cap=T(P['cap2']), cls='mt4') + steps(P['steps2'], start=6, cols=3)
    return page(body, 3, P['title'], P['lead'])

def p_move():
    P = C.PAGES['move']
    more = ''.join(f'<li>{e(T(x))}</li>' for x in P['more'])
    body = fig('drag', 176, cap=T(P['cap'])) + steps(P['steps'], cols=2)
    body += f'<div class="more"><h3>{e(T(P["more_t"]))}</h3><ul>{more}</ul></div>' + note(T(P['note']))
    return page(body, 4, P['title'], P['lead'])

def p_new_fill():
    P = C.PAGES['new_fill']
    a = fig('new_top', 84, cap=T(P['cap'])) + steps(P['steps'])
    b = fig('new_bot', 84, start=6, cap=T(P['cap2'])) + steps(P['steps2'], start=6)
    body = row(a, b, 'r5050') + note(T(P['req']), 'req', T(P['req_t']))
    return page(body, 5, P['title'], P['lead'])

def p_cal():
    P = C.PAGES['cal']
    body = fig('cal', 150, cap=T(P['cap']), cls='center') + steps(P['steps'], cols=3)
    body += row(fig('cal_day', 78, start=6, cap=T(P['cap2'])), steps(P['steps2'], start=6) + note(T(P['note'])), 'r-fig2 mt4')
    return page(body, 6, P['title'], P['lead'])

def p_people():
    P = C.PAGES['people']
    body = fig('people', 176, cap=T(P['cap'])) + steps(P['steps'], cols=2)
    body += f'<p class="intro2">{e(T(P["intro2"]))}</p>'
    body += row(fig('profile', 84, start=4, cap=T(P['cap2'])), steps(P['steps2'], start=4, cols=1, cls='tight'), 'r5050')
    return page(body, 8, P['title'], P['lead'])

def p_tips():
    P = C.PAGES['tips']
    cards = ''.join(f'<div class="tcard"><span class="tn">{i + 1}</span><h3>{e(T(t))}</h3><p>{e(T(x))}</p></div>' for i, (t, x) in enumerate(P['tips']))
    ex = (f'<div class="ex"><div class="ok"><small>{e(T(P["good_t"]))}</small><b>{e(T(P["good"]))}</b></div>'
          f'<div class="no"><small>{e(T(P["bad_t"]))}</small><b>{e(T(P["bad"]))}</b></div></div>')
    day = ''.join(f'<li>{e(T(x))}</li>' for x in P['day'])
    body = f'<div class="tips">{cards}</div>{ex}<div class="day"><h3>{e(T(P["day_t"]))}</h3><ol>{day}</ol></div>'
    return page(body, 9, P['title'], P['lead'])

def p_quick():
    P = C.PAGES['quick']
    rows = ''.join(f'<tr><th>{e(T(a))}</th><td>{e(T(b))}</td></tr>' for a, b in P['rows'])
    tags = ''.join(f'<div class="qt">{tagimg(k, 0.3)}<span>{e(T(x))}</span></div>' for k, x in P['tags'])
    body = (f'<table class="qr"><thead><tr><th>{e(T(P["head"][0]))}</th><th>{e(T(P["head"][1]))}</th></tr></thead><tbody>{rows}</tbody></table>'
            f'<div class="qtags"><h3>{e(T(P["tags_t"]))}</h3><div class="qtrow">{tags}</div></div>'
            f'<div class="qhelp"><img src="{uri(ERP / "logos" / "forka-board-icon.svg")}" alt=""><span>{e(T(P["help"]))}</span></div>')
    return page(body, None, P['title'], P['lead'], cls='quick')

def build_pages():
    PAGE_NO[0] = 0
    out = [cover(), None]          # contents filled in once the section pages are numbered
    PAGE_NO[0] = 2
    starts = []
    seq = [
        (1, p_open), (1, p_menu), (1, p_phone),
        (2, lambda: p_full('mine', 'mine', 2)),
        (3, lambda: p_full('board', 'board', 3, cols=2)), (3, p_tags), (3, p_filter),
        (4, lambda: p_wide('card', 'card', 4, 140)), (4, lambda: p_wide('card_desc', 'card_desc', 4, 156)), (4, lambda: p_wide('card_check', 'card_check', 4)), (4, p_move),
        (5, lambda: p_side('new_err', 'new_err', 5, width=124)), (5, p_new_fill),
        (6, p_cal), (6, lambda: p_full('timeline', 'timeline', 6, cols=3)),
        (7, lambda: p_full('chat', 'chat', 7, cols=2)),
        (8, lambda: p_side('bell', 'bell', 8, width=92)), (8, p_people),
        (9, p_tips), (10, p_quick),
    ]
    for sec, fn in seq:
        if len(starts) < sec:
            starts.append(PAGE_NO[0] + 1)
        out.append(fn())
    keep = PAGE_NO[0]
    PAGE_NO[0] = 1
    out[1] = contents(starts)
    PAGE_NO[0] = keep
    return out

FONTS = ('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'
         '&family=Inter+Tight:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=block')

CSS = r"""
@page{size:A4;margin:0}
*{box-sizing:border-box}
:root{--paper:#fdfbf7;--paper2:#f6f3ee;--ink:#2B2B2B;--muted:#6c645a;--teal:#397F8F;--teal-d:#2c6876;--teal-l:#e4eff1;--bronze:#8C6A3F;--line:#e5ded2;
  --sans:'Inter Tight',sans-serif;--serif:'EB Garamond',Georgia,serif}
html[dir=rtl]{--sans:'IBM Plex Sans Arabic',sans-serif;--serif:'IBM Plex Sans Arabic',sans-serif}
html,body{margin:0;padding:0;background:#ccc}
body{font-family:var(--sans);color:var(--ink);font-size:9.6pt;line-height:1.42;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html[dir=rtl] body{font-size:9.4pt;line-height:1.6}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:var(--paper);page-break-after:always;break-after:page}
.page .in{position:absolute;inset:15mm 17mm 18mm 17mm}
footer{position:absolute;left:17mm;right:17mm;bottom:8.5mm;display:flex;justify-content:space-between;align-items:center;font-size:7.6pt;color:#8a8176;letter-spacing:.02em}
footer .pn{font-weight:600;color:var(--ink);display:flex;align-items:center;gap:2.2mm}
footer .pn::before{content:'';width:6mm;height:.6mm;background:var(--teal);border-radius:1mm}
/* section header */
.ph{display:flex;align-items:center;gap:3mm;margin-bottom:3.2mm}
.kick{font-size:7.6pt;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--teal);display:flex;align-items:center;gap:2.2mm;white-space:nowrap}
html[dir=rtl] .kick{letter-spacing:0;font-size:8.6pt}
.kick b{display:inline-flex;align-items:center;justify-content:center;min-width:7mm;height:5mm;padding:0 1.4mm;border-radius:2.5mm;background:var(--teal);color:#fff;letter-spacing:.04em;font-size:7.4pt}
.ph i{flex:1;height:.25mm;background:var(--line)}
h1{font-family:var(--serif);font-weight:500;font-size:27pt;line-height:1.08;margin:0 0 2.4mm;letter-spacing:-.005em}
html[dir=rtl] h1{font-weight:600;font-size:22pt;line-height:1.35}
.lead{font-size:10.6pt;color:var(--muted);margin:0 0 5mm;max-width:150mm}
/* figures */
.fig{margin:0;position:relative}
.fig.center{margin-inline:auto}
.shot{border-radius:2.6mm;overflow:hidden;border:.25mm solid #ddd4c6;background:#fff;box-shadow:0 1.6mm 4.5mm rgba(43,43,43,.11),0 .3mm .9mm rgba(43,43,43,.08)}
.shot img{display:block;width:100%;height:100%;object-fit:cover}
.shot.phone{border:1.6mm solid #2B2B2B;border-radius:6mm;box-shadow:0 2mm 6mm rgba(43,43,43,.18)}
.mks{position:absolute;left:0;right:0;top:0;pointer-events:none}
.mk{position:absolute;width:5mm;height:5mm;margin:-2.5mm 0 0 -2.5mm;border-radius:50%;background:var(--teal);color:#fff;font:600 7.6pt/1 'Inter Tight',sans-serif;
  display:flex;align-items:center;justify-content:center;border:.45mm solid #fff;box-shadow:0 .35mm 1.1mm rgba(0,0,0,.28)}
.mk.inl{position:relative;display:inline-flex;margin:0;vertical-align:middle}
.phone + .mks .mk{width:4.4mm;height:4.4mm;margin:-2.2mm 0 0 -2.2mm;font-size:7pt}
figcaption{font-size:7.6pt;color:#8a8176;margin-top:2.2mm;letter-spacing:.01em}
figcaption::before{content:'';display:inline-block;width:3mm;height:.5mm;background:var(--bronze);vertical-align:middle;margin-inline-end:1.6mm}
/* the shots' marks layer must cover the image box: */
.fig{display:block}
.fig > .mks{position:absolute;top:0;left:0;right:0}
/* steps */
.steps{list-style:none;margin:5mm 0 0;padding:0;display:grid;gap:2.6mm 7mm}
.steps.c2{grid-template-columns:1fr 1fr}.steps.c3{grid-template-columns:1fr 1fr 1fr}
.steps li{display:grid;grid-template-columns:5mm 1fr;gap:2.6mm;align-items:start;break-inside:avoid}
.steps .n{width:5mm;height:5mm;border-radius:50%;background:var(--teal);color:#fff;font:600 7.6pt/1 'Inter Tight',sans-serif;display:flex;align-items:center;justify-content:center;margin-top:.1mm}
.steps b{font-weight:600;display:block;margin-bottom:.3mm}
html[dir=rtl] .steps .n{margin-top:.9mm}
.steps.big li{grid-template-columns:7mm 1fr}.steps.big .n{width:7mm;height:7mm;font-size:9pt}.steps.big b{font-size:11pt;font-family:var(--serif);font-weight:600}
.steps.tight{gap:2mm;margin-top:0}
/* rows */
.row{display:grid;gap:8mm;align-items:start}
.r5050{grid-template-columns:1fr 1fr}
.r-fig{grid-template-columns:auto 1fr}.r-fig .steps{margin-top:0}
.r-fig2{grid-template-columns:auto 1fr}.r-fig2 .steps{margin-top:0}
.r-side{grid-template-columns:auto 1fr}.r-side .steps{margin-top:0;gap:3.4mm}
.r-tags{grid-template-columns:auto 1fr;gap:9mm}
.mt6{margin-top:6mm}.mt4{margin-top:6mm}
.sidepics{display:flex;gap:6mm;align-items:flex-start}
.mini{margin-top:0}
/* notes */
.note{margin-top:5mm;padding:3.2mm 4.2mm;border-radius:2.4mm;background:var(--paper2);border-inline-start:1mm solid var(--bronze);break-inside:avoid}
.note .nt{font-size:7.2pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--bronze);margin-bottom:.8mm}
html[dir=rtl] .note .nt{letter-spacing:0;font-size:8.2pt}
.note p{margin:0}
.note.tip{background:var(--teal-l);border-color:var(--teal)}.note.tip .nt{color:var(--teal-d)}
.note.req{background:#fff;border:.3mm solid var(--line);border-inline-start:1mm solid var(--teal)}.note.req .nt{color:var(--teal-d);text-transform:none;letter-spacing:0;font-size:10pt;font-family:var(--serif);font-weight:600}
/* phones */
.phones{display:grid;grid-template-columns:1fr 1fr;gap:7mm 8mm;margin-top:1mm}
.ph-cell{display:grid;grid-template-columns:44mm 1fr;gap:5mm;align-items:end}
.ph-cell h4{margin:0 0 1.5mm;font-family:var(--serif);font-weight:600;font-size:12pt}
html[dir=rtl] .ph-cell h4{font-size:11pt}
.ph-cell p{margin:0;font-size:8.6pt;color:var(--muted)}
/* tags legend */
.legend{display:flex;flex-direction:column;gap:2.4mm}
.lg{display:grid;grid-template-columns:40mm 1fr;gap:4mm;align-items:center;padding-bottom:2.4mm;border-bottom:.25mm solid var(--line)}
.lg:last-child{border-bottom:0}
.lgi{background:#fffdf9;border:.25mm solid var(--line);border-radius:1.6mm;padding:1.6mm;display:flex;align-items:center;min-height:9mm;overflow:hidden}
.tagimg{display:block;max-width:100%;object-fit:contain;object-position:left center}
html[dir=rtl] .tagimg{object-position:right center}
.lgt{font-size:9pt}.lgt b{font-weight:600}
/* move page */
.more{margin-top:5mm}
.more h3,.day h3,.qtags h3{font-family:var(--serif);font-weight:600;font-size:13pt;margin:0 0 2mm}
.more ul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:2mm 7mm}
.more li{padding-inline-start:5mm;position:relative}
.more li::before{content:'';position:absolute;inset-inline-start:0;top:1.9mm;width:2mm;height:2mm;border-radius:50%;border:.5mm solid var(--teal)}
html[dir=rtl] .more li::before{top:2.6mm}
.intro2{margin:6mm 0 3mm;font-weight:600}
/* tips */
.tips{display:grid;grid-template-columns:1fr 1fr;gap:4.5mm}
.tcard{background:#fff;border:.25mm solid var(--line);border-radius:3mm;padding:5mm 5mm 4.5mm;position:relative;box-shadow:0 .8mm 2.4mm rgba(43,43,43,.05)}
.tcard .tn{font-family:'EB Garamond',serif;font-size:30pt;line-height:1;color:var(--teal);opacity:.9;position:absolute;top:3.6mm;inset-inline-end:5mm}
.tcard h3{margin:0 0 1.6mm;font-family:var(--serif);font-size:13.5pt;font-weight:600;padding-inline-end:12mm}
html[dir=rtl] .tcard h3{font-size:12pt}
.tcard p{margin:0;color:var(--muted)}
.ex{display:grid;grid-template-columns:1.6fr 1fr;gap:4.5mm;margin-top:5mm}
.ex > div{border-radius:3mm;padding:4mm 5mm}
.ex small{display:block;font-size:7.2pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:1mm}
html[dir=rtl] .ex small{letter-spacing:0;font-size:8.4pt}
.ex b{font-size:12pt;font-weight:600}
.ex .ok{background:#e9f0e4;color:#35542a}.ex .no{background:#f6e7e3;color:#8a3324}
.ex .no b{text-decoration:line-through;text-decoration-thickness:.3mm}
.day{margin-top:6mm;background:var(--ink);color:#f3eee6;border-radius:3mm;padding:5mm 6mm}
.day h3{color:#fff}
.day ol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;counter-reset:d}
.day li{counter-increment:d;font-size:9pt;color:#e6dfd3}
.day li::before{content:counter(d);display:flex;width:6mm;height:6mm;border-radius:50%;border:.4mm solid #7fb3bf;color:#bfe0e7;align-items:center;justify-content:center;font:600 8pt 'Inter Tight';margin-bottom:2mm}
/* quick reference */
table.qr{width:100%;border-collapse:separate;border-spacing:0;font-size:9.2pt;background:#fff;border:.25mm solid var(--line);border-radius:3mm;overflow:hidden}
table.qr thead th{background:var(--teal);color:#fff;text-align:start;font-weight:600;padding:2.6mm 4mm;font-size:8.4pt;letter-spacing:.06em;text-transform:uppercase}
html[dir=rtl] table.qr thead th{letter-spacing:0;font-size:9pt}
table.qr tbody th{text-align:start;font-weight:600;width:38%;padding:2.3mm 4mm;border-top:.25mm solid var(--line);vertical-align:top}
table.qr tbody td{padding:2.3mm 4mm;border-top:.25mm solid var(--line);color:#3d3833}
table.qr tbody tr:nth-child(even){background:#faf7f2}
.qtags{margin-top:6mm}
.qtrow{display:flex;flex-wrap:wrap;gap:3mm 6mm}
.qt{display:flex;align-items:center;gap:2.4mm;background:#fff;border:.25mm solid var(--line);border-radius:2mm;padding:1.8mm 3mm}
.qt span{font-size:8.8pt}
.qhelp{margin-top:6mm;display:flex;align-items:center;gap:3mm;font-family:var(--serif);font-size:13pt;color:var(--teal-d)}
html[dir=rtl] .qhelp{font-size:12pt}
.qhelp img{width:9mm;height:9mm}
/* contents */
.toc-page .in{top:24mm}
.toc-h{font-size:40pt;margin-bottom:8mm}
html[dir=rtl] .toc-h{font-size:30pt}
.toc{list-style:none;margin:0;padding:0;border-top:.3mm solid var(--ink)}
.toc li{display:flex;align-items:baseline;gap:4mm;padding:3.3mm 0;border-bottom:.25mm solid var(--line)}
.toc .cn{font:600 9pt 'Inter Tight';color:var(--teal);width:8mm}
.toc .ct{font-family:var(--serif);font-size:15.5pt;font-weight:500}
html[dir=rtl] .toc .ct{font-size:13pt;font-weight:500}
.toc .dots{flex:1;border-bottom:.35mm dotted #c9bfb1;transform:translateY(-1.2mm)}
.toc .cp{font:600 10pt 'Inter Tight';color:var(--ink)}
.toc li.qr .ct{color:var(--teal-d)}
.howgrid{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:5mm;margin-top:12mm}
.how{background:var(--paper2);border-radius:3mm;padding:5mm;position:relative}
.how h3{margin:0 0 2mm;font-family:var(--serif);font-size:12.5pt;font-weight:600}
html[dir=rtl] .how h3{font-size:11.5pt}
.how p{margin:0;font-size:8.8pt;color:var(--muted)}
.how .hn{position:absolute;top:4.6mm;inset-inline-end:5mm}
/* cover */
.cover{background:var(--paper2)}
.cover .in{inset:0}
.cv-mark{position:absolute;top:-38mm;inset-inline-end:-44mm;width:190mm;height:190mm;opacity:.05}
.cv-mark svg{width:100%;height:100%}
.cv-logo{position:absolute;top:22mm;inset-inline-start:20mm;width:60mm}
.cv-title{position:absolute;top:70mm;inset-inline-start:20mm;inset-inline-end:24mm}
.cv-title h1{font-size:47pt;line-height:1.04;font-weight:500;margin:0;letter-spacing:-.01em}
.cv-title h1 em{font-style:italic;color:var(--teal-d);font-weight:400}
html[dir=rtl] .cv-title h1{font-size:40pt;line-height:1.35;font-weight:700}
html[dir=rtl] .cv-title h1 em{font-style:normal;font-weight:500}
.cv-rule{display:block;width:26mm;height:.7mm;background:var(--bronze);margin:8mm 0 6mm}
.cv-title p{font-size:12.5pt;color:var(--muted);max-width:120mm;margin:0}
.cv-shot{position:absolute;top:139mm;inset-inline-start:34mm;width:200mm;border-radius:3.5mm;overflow:hidden;border:.3mm solid #d9cfbf;
  box-shadow:0 4mm 12mm rgba(43,43,43,.16),0 1mm 3mm rgba(43,43,43,.1)}
.cv-shot img{display:block;width:100%}
.cv-meta{position:absolute;bottom:13mm;inset-inline-start:20mm;inset-inline-end:20mm;display:flex;justify-content:space-between;align-items:baseline;font-size:8.6pt;color:var(--muted);border-top:.25mm solid #d8cfc1;padding-top:3.5mm}
.cv-meta b{color:var(--ink);font-family:var(--serif);font-size:12pt;font-weight:600}
"""

def html_doc(pages):
    d = 'rtl' if LANG == 'ar' else 'ltr'
    return (f'<!DOCTYPE html><html lang="{LANG}" dir="{d}"><head><meta charset="utf-8"><title>{e(T(C.COVER["title"]))}</title>'
            f'<link rel="stylesheet" href="{FONTS}"><style>{CSS}</style></head><body>{"".join(pages)}</body></html>')

async def main():
    global LANG
    png = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--png=')), None)
    langs = [a for a in sys.argv[1:] if not a.startswith('--')] or ['en', 'ar']
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
        for lang in langs:
            LANG = lang
            src = HERE / f'_guide-{lang}.html'
            src.write_text(html_doc(build_pages()))
            pg = await b.new_page(viewport={'width': 794, 'height': 1123})
            await pg.goto(src.as_uri()); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(500)
            # report anything that spills out of its page
            bad = await pg.evaluate("""() => [...document.querySelectorAll('.page')].map((p, i) => {
                const box = p.querySelector('.in').getBoundingClientRect(); let worst = 0;
                p.querySelectorAll('.in *').forEach(el => { if (el.closest('.cover')) return; const r = el.getBoundingClientRect(); if (r.height) worst = Math.max(worst, r.bottom - box.bottom) });
                return [i + 1, Math.round(worst)] }).filter(x => x[1] > 1)""")
            for n, px in bad:
                print(f'  ! {lang} page {n}: content runs {px}px past the bottom margin')
            out = HERE / OUTNAME[lang]
            await pg.pdf(path=str(out), format='A4', print_background=True, prefer_css_page_size=True, margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
            n = await pg.evaluate("document.querySelectorAll('.page').length")
            print(f'{out.name}: {n} pages')
            await pg.close()
            src.unlink()
            if png:
                import pypdfium2 as pdfium
                prev = pathlib.Path(png); prev.mkdir(parents=True, exist_ok=True)
                doc = pdfium.PdfDocument(str(out))
                for i in range(len(doc)):
                    doc[i].render(scale=1.6).to_pil().save(prev / f'{lang}-{i + 1:02d}.png')
        await b.close()

asyncio.run(main())
