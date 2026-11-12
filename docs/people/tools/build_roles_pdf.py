#!/usr/bin/env python3
"""Print-designed version of the department-head review (English, then Arabic), rendered to PDF with Playwright.
Output: docs/people/12-roles-review.pdf  (content comes from build_roles_review.py)"""
import html, pathlib, importlib.util, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rr', ROOT / 'tools' / 'build_roles_review.py'); rr = importlib.util.module_from_spec(spec); spec.loader.exec_module(rr)
e = html.escape

LOGO = '''<svg width="{s}" height="{s}" viewBox="0 0 34 34"><rect x="2" y="2" width="14" height="14" rx="4" fill="#3D7C8C"/><rect x="18" y="2" width="14" height="14" rx="4" fill="#E3A33B"/>
<rect x="2" y="18" width="14" height="14" rx="4" fill="#7C9A7E"/><rect x="18" y="18" width="14" height="14" rx="4" fill="#C8553D"/><circle cx="17" cy="17" r="5.5" fill="#8C6A3F" stroke="{ring}" stroke-width="2.5"/></svg>'''
def logo(size=40, dark=True):
    return f'<span class="logo {"on-dark" if dark else ""}">{LOGO.format(s=size, ring="#2B2B2B" if dark else "#FFFFFF")}<span class="lt"><small>Forka</small><strong>People</strong></span></span>'

ICON = {
 'staff': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
 'manager': '<circle cx="12" cy="12" r="8"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
 'hr': '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 16c.8-1.6 2-2.3 3.5-2.3s2.7.7 3.5 2.3"/>',
 'payroll': '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>',
 'ceo': '<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4-3.9-3.8 5.4-.8Z"/>',
}
def icon(k, size=26): return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICON[k]}</svg>'
COL = {'staff': ('#3D7C8C', '#DCEAEC'), 'manager': ('#5E7D60', '#E2EBE2'), 'hr': ('#A8432E', '#F5DDD6'), 'payroll': ('#B37A16', '#F8E9CC'), 'ceo': ('#6A4E2C', '#EFE6DA')}

T = {
 'en': dict(kicker='A first look at our own HR app', title='Who can do what', sub='What staff, managers, HR, payroll and the CEO will be able to do in Forka People. A draft for department heads: your view shapes what we build.',
   draft='Draft · 12 November 2026', what='What is Forka People?', whatp='One app for everything about working at Forka after the day you are hired: your profile, shifts, clock-in, leave, requests, payslips, documents, training and news. It runs on any phone, in Arabic and English, and replaces paper forms, WhatsApp messages and spreadsheets.',
   hl=[('Phone first', 'Staff use it on their own phone or the branch tablet.'), ('Arabic and English', 'Every screen in both languages, right to left in Arabic.'), ('Private by design', 'Managers never see salaries. Every look at pay is recorded.'), ('Everything in one place', 'Requests, approvals and documents, with who must act now.')],
   how='How to give your view', howp=['Read what each role can do (section 1) and the overview table (section 2).', 'Look at the ideas we might be missing (section 3) and pick the three that matter most to you.', 'Answer the questions in section 4 and send them back to the CEO.'],
   s1='1. What each role can do', s2='2. All modules at a glance', s3='3. What we might be missing', s3p='We compared our plan with Zoho People, Odoo HR, SAP SuccessFactors, Bayzat (UAE) and restaurant scheduling tools such as 7shifts, using their public feature descriptions. Ideas to discuss, not decisions.',
   s4='4. Questions for you', phase='Phase', seen='Seen in', answer='Your answer', legend='Does = can do it · Sees = can only see it, or only their own · — = no access', pick='Tick the three that matter most', page='Forka People · Who can do what'),
 'ar': dict(kicker='نظرة أولى على تطبيق الموارد البشرية الخاص بنا', title='من يستطيع ماذا', sub='ما سيستطيع الموظفون والمدراء والموارد البشرية والرواتب والرئيس التنفيذي القيام به في Forka People. مسودة لرؤساء الأقسام: رأيك يحدد ما نبنيه.',
   draft='مسودة · 12 نوفمبر 2026', what='ما هو Forka People؟', whatp='تطبيق واحد لكل ما يخص العمل في فوركا بعد يوم التعيين: ملفك وورديّاتك وتسجيل الحضور والإجازات والطلبات وقسائم الراتب والمستندات والتدريب والأخبار. يعمل على أي هاتف بالعربية والإنجليزية، ويحل محل النماذج الورقية ورسائل واتساب والجداول.',
   hl=[('الجوال أولاً', 'يستخدمه الموظفون من هاتفهم أو من جهاز الفرع اللوحي.'), ('العربية والإنجليزية', 'كل شاشة باللغتين، ومن اليمين إلى اليسار بالعربية.'), ('خصوصية من الأساس', 'المدراء لا يرون الرواتب، وكل اطلاع على الراتب يُسجّل.'), ('كل شيء في مكان واحد', 'الطلبات والموافقات والمستندات، مع معرفة من يجب أن يتصرف الآن.')],
   how='كيف تشارك رأيك', howp=['اقرأ ما يستطيعه كل دور (القسم 1) والجدول العام (القسم 2).', 'راجع الأفكار التي قد تنقصنا (القسم 3) واختر أهم ثلاثة بالنسبة لك.', 'أجب عن الأسئلة في القسم 4 وأرسلها إلى الرئيس التنفيذي.'],
   s1='1. ما يستطيعه كل دور', s2='2. كل الأقسام في نظرة واحدة', s3='3. ما قد ينقصنا', s3p='قارنّا خطتنا مع Zoho People وOdoo HR وSAP SuccessFactors وBayzat (الإمارات) وأدوات جدولة المطاعم مثل 7shifts، بناءً على وصف خصائصها المنشور. أفكار للنقاش وليست قرارات.',
   s4='4. أسئلة لك', phase='المرحلة', seen='موجود في', answer='إجابتك', legend='ينفّذ = يستطيع القيام به · يرى = يرى فقط أو ما يخصه فقط · — = لا صلاحية', pick='اختر أهم ثلاثة', page='Forka People · من يستطيع ماذا'),
}

def part(lang):
    L = T[lang]; ar = lang == 'ar'; i = 1 if ar else 0
    pick = (lambda a, b: b) if ar else (lambda a, b: a)
    o = [f'<div class="part" dir="{"rtl" if ar else "ltr"}" lang="{lang}">']
    # cover
    o.append(f'''<section class="cover"><div class="tiles"><i class="t1"></i><i class="t2"></i><i class="t3"></i><i class="t4"></i></div>
      <div class="cover-top">{logo(64, False)}<span class="lang-tag">{"العربية" if ar else "English"}</span></div>
      <div class="cover-mid"><p class="kicker">{e(L["kicker"])}</p><h1>{e(L["title"])}</h1><p class="cover-sub">{e(L["sub"])}</p></div>
      <div class="cover-roles">{"".join(f'<span style="background:{COL[k][0]}">{icon(k, 20)}{e(pick(en, a))}</span>' for k, en, a, _, _ in rr.ROLES)}</div>
      <p class="cover-foot">{e(L["draft"])}</p></section>''')
    # intro
    o.append(f'''<section class="page"><header class="ph">{logo(28)}<span>{e(L["page"])}</span></header>
      <h2>{e(L["what"])}</h2><p class="lead">{e(L["whatp"])}</p>
      <div class="hl">{"".join(f'<div class="hl-card c{n}"><b>{e(h)}</b><p>{e(p)}</p></div>' for n, (h, p) in enumerate(L["hl"]))}</div>
      <div class="how"><h3>{e(L["how"])}</h3><ol>{"".join(f"<li>{e(x)}</li>" for x in L["howp"])}</ol></div></section>''')
    # roles: two pages
    for pi, keys in enumerate([['staff', 'manager'], ['hr', 'payroll', 'ceo']]):
        o.append(f'<section class="page"><header class="ph">{logo(28)}<span>{e(L["page"])}</span></header><h2>{e(L["s1"])}{" (2/2)" if pi else ""}</h2><div class="roles r{len(keys)}">')
        for k, en, a, den, dar in [r for r in rr.ROLES if r[0] in keys]:
            c, soft = COL[k]
            o.append(f'''<article class="role" style="--c:{c};--s:{soft}"><div class="role-head"><span class="ri">{icon(k)}</span><div><h3>{e(pick(en, a))}</h3><p>{e(pick(den, dar))}</p></div></div>
              <ul>{"".join(f"<li>{e(pick(x, y))}</li>" for x, y in rr.CAN[k])}</ul></article>''')
        o.append('</div></section>')
    # matrix
    o.append(f'<section class="page"><header class="ph">{logo(28)}<span>{e(L["page"])}</span></header><h2>{e(L["s2"])}</h2><p class="muted">{e(L["legend"])}</p><table class="mx"><thead><tr><th></th>')
    o += [f'<th style="color:{COL[k][0]}">{icon(k, 18)}<br>{e(pick(en, a))}</th>' for k, en, a, _, _ in rr.ROLES]
    o.append('</tr></thead><tbody>')
    for row in rr.MATRIX:
        o.append(f'<tr><th>{e(pick(row[0], row[1]))}</th>' + ''.join(f'<td class="v-{v or "no"}">{e(rr.WORD[v][i])}</td>' for v in row[2:]) + '</tr>')
    o.append('</tbody></table></section>')
    # ideas: two pages
    chunks = [rr.GAPS[:8], rr.GAPS[8:16], rr.GAPS[16:]]
    for pi, chunk in enumerate(chunks):
        o.append(f'<section class="page"><header class="ph">{logo(28)}<span>{e(L["page"])}</span></header><h2>{e(L["s3"])}{f" ({pi + 1}/{len(chunks)})" if pi else ""}</h2>')
        if not pi: o.append(f'<p class="muted">{e(L["s3p"])}</p><p class="pick">☐ = {e(L["pick"])}</p>')
        o.append('<div class="ideas">')
        for n, (en, a, den, dar, src, ph) in enumerate(chunk, start=pi * 8):
            o.append(f'<div class="idea c{n % 4}"><div class="idea-top"><span class="box">☐</span><b>{e(pick(en, a))}</b><span class="badge">{e(L["phase"])} {e(ph)}</span></div><p>{e(pick(den, dar))}</p><small>{e(L["seen"])}: {e(src)}</small></div>')
        o.append('</div></section>')
    # questions
    o.append(f'<section class="page"><header class="ph">{logo(28)}<span>{e(L["page"])}</span></header><h2>{e(L["s4"])}</h2><ol class="qs">')
    o += [f'<li><b>{e(pick(x, y))}</b><div class="lines"><i></i><i></i></div></li>' for x, y in rr.QUESTIONS]
    o.append(f'</ol><div class="end">{logo(36)}<p>{e(L["draft"])}</p></div></section></div>')
    return ''.join(o)

CSS = r"""
@page { size: A4; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 10.5pt/1.5 'Inter Tight', sans-serif; color: #2B2B2B; background: #F6F3EE; }
[lang=ar] { font-family: 'IBM Plex Sans Arabic', 'Inter Tight', sans-serif; }
h1, h2, h3 { font-family: 'EB Garamond', serif; font-weight: 600; margin: 0; }
[lang=ar] h1, [lang=ar] h2, [lang=ar] h3 { font-family: 'IBM Plex Sans Arabic', serif; font-weight: 600; }
.logo { display: inline-flex; align-items: center; gap: 10px; }
.lt { display: grid; line-height: 1; direction: ltr; text-align: left; }
.lt small { font: 600 9pt 'Inter Tight', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #6B665F; margin-bottom: 2px; }
.lt strong { font: 600 22pt 'EB Garamond', serif; color: #2B2B2B; }
.logo:not(.on-dark) .lt small { color: #C9C3B8; } .logo:not(.on-dark) .lt strong { color: #F6F3EE; font-size: 34pt; }
.cover { width: 210mm; height: 297mm; page-break-after: always; position: relative; overflow: hidden; background: #2B2B2B; color: #F6F3EE; padding: 22mm 20mm; display: flex; flex-direction: column; }
.tiles i { position: absolute; width: 120mm; height: 120mm; border-radius: 26mm; opacity: .95; }
.tiles .t1 { background: #3D7C8C; right: -45mm; top: 150mm; transform: rotate(12deg); }
.tiles .t2 { background: #E3A33B; right: 62mm; top: 196mm; width: 70mm; height: 70mm; border-radius: 16mm; transform: rotate(-8deg); }
.tiles .t3 { background: #7C9A7E; right: -18mm; top: 222mm; width: 85mm; height: 85mm; border-radius: 20mm; transform: rotate(20deg); }
.tiles .t4 { background: #C8553D; right: 22mm; top: 112mm; width: 34mm; height: 34mm; border-radius: 9mm; transform: rotate(-14deg); }
[dir=rtl] .tiles i { right: auto; } [dir=rtl] .tiles .t1 { left: -45mm; } [dir=rtl] .tiles .t2 { left: 62mm; } [dir=rtl] .tiles .t3 { left: -18mm; } [dir=rtl] .tiles .t4 { left: 22mm; }
.cover-top { display: flex; justify-content: space-between; align-items: center; position: relative; }
.lang-tag { border: 1px solid #6B665F; border-radius: 999px; padding: 4px 12px; font-size: 10pt; color: #C9C3B8; }
.cover-mid { margin-top: 38mm; position: relative; max-width: 120mm; }
.kicker { color: #E3A33B; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; font-size: 10pt; margin: 0 0 6mm; }
[lang=ar] .kicker { letter-spacing: 0; font-size: 12pt; }
.cover h1 { font-size: 54pt; line-height: 1.02; color: #FFFFFF; }
.cover-sub { font-size: 13pt; color: #E3DCD1; margin-top: 7mm; line-height: 1.55; }
.cover-roles { position: relative; z-index: 1; margin-top: auto; display: flex; flex-wrap: wrap; gap: 6px; max-width: 120mm; }
.cover-roles span { display: inline-flex; align-items: center; gap: 6px; color: #fff; border-radius: 999px; padding: 6px 12px 6px 9px; font-weight: 600; font-size: 10pt; }
.cover-foot { position: relative; color: #C9C3B8; margin: 8mm 0 0; font-size: 10pt; }
.page { width: 210mm; min-height: 297mm; padding: 14mm 16mm 16mm; page-break-after: always; background: #F6F3EE; }
.ph { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E3DCD1; padding-bottom: 5mm; margin-bottom: 8mm; color: #6B665F; font-size: 9pt; }
.ph .lt strong { font-size: 17pt; } .ph .lt small { font-size: 7.5pt; }
h2 { font-size: 24pt; margin-bottom: 4mm; } [lang=ar] h2 { font-size: 20pt; }
.lead { font-size: 12.5pt; line-height: 1.6; max-width: 165mm; } .muted { color: #5E5A54; }
.hl { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin: 8mm 0; }
.hl-card { border-radius: 5mm; padding: 6mm; color: #fff; } .hl-card b { font-size: 13pt; display: block; margin-bottom: 2mm; } .hl-card p { margin: 0; }
.hl-card.c0 { background: #3D7C8C; } .hl-card.c1 { background: #5E7D60; } .hl-card.c2 { background: #A8432E; } .hl-card.c3 { background: #B37A16; }
.how { background: #fff; border: 1px solid #E3DCD1; border-radius: 5mm; padding: 6mm 8mm; } .how h3 { font-size: 15pt; margin-bottom: 2mm; } .how li { margin: 2mm 0; font-size: 11pt; }
.roles { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; } .roles.r3 { grid-template-columns: 1fr 1fr 1fr; gap: 4mm; } .roles.r3 .role ul { font-size: 9.4pt; line-height: 1.4; } .roles.r3 .role-head { flex-direction: column; }
.role { background: #fff; border-radius: 4mm; border: 1px solid #E3DCD1; border-top: 3mm solid var(--c); padding: 4mm 5mm; break-inside: avoid; }
.role-head { display: flex; gap: 3mm; align-items: flex-start; margin-bottom: 2mm; }
.ri { width: 11mm; height: 11mm; border-radius: 3mm; background: var(--s); color: var(--c); display: grid; place-items: center; flex: none; }
.role h3 { font-size: 15pt; color: var(--c); } .role-head p { margin: 0; font-size: 9pt; color: #5E5A54; line-height: 1.35; }
.role ul { margin: 0; padding-inline-start: 4.5mm; font-size: 10.2pt; line-height: 1.45; } .role li { margin: 1.6mm 0; } .role li::marker { color: var(--c); }
.mx { width: 100%; border-collapse: separate; border-spacing: 1.2mm; font-size: 10pt; }
.mx thead th { font-size: 9.5pt; font-weight: 700; text-align: center; padding: 2mm; }
.mx tbody th { text-align: start; font-weight: 600; background: #fff; border-radius: 2mm; padding: 2.4mm 3mm; }
.mx td { text-align: center; border-radius: 2mm; padding: 2.4mm; font-weight: 600; }
.v-do { background: #DDEEDF; color: #1F4F2B; } .v-see { background: #DCEAEC; color: #245A63; } .v-no { background: #EEE9E1; color: #8A8378; }
.pick { font-weight: 600; color: #A8432E; margin: 2mm 0 4mm; }
.ideas { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.idea { background: #fff; border-radius: 3mm; padding: 4mm 4.5mm; border-inline-start: 2.2mm solid #3D7C8C; break-inside: avoid; font-size: 9.6pt; line-height: 1.42; }
.idea.c1 { border-inline-start-color: #E3A33B; } .idea.c2 { border-inline-start-color: #7C9A7E; } .idea.c3 { border-inline-start-color: #C8553D; }
.idea-top { display: flex; gap: 1.5mm; align-items: flex-start; } .idea-top b { flex: 1; font-size: 11pt; line-height: 1.25; } .box { font-size: 11pt; line-height: 1; color: #6B665F; }
.badge { background: #2B2B2B; color: #fff; border-radius: 999px; padding: .4mm 2mm; font-size: 7.5pt; white-space: nowrap; font-weight: 600; }
.idea p { margin: 1.5mm 0 1mm; } .idea small { color: #6B665F; font-size: 7.6pt; }
.qs { padding-inline-start: 6mm; font-size: 10.5pt; } .qs li { margin-bottom: 3mm; break-inside: avoid; }
.lines i { display: block; border-bottom: 1px solid #CFC7BA; height: 7mm; }
.end { margin-top: 4mm; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E3DCD1; padding-top: 6mm; color: #6B665F; }
.end .lt strong { font-size: 20pt; }
"""
doc = f'''<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Inter+Tight:wght@400;600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{part("en")}{part("ar")}</body></html>'''
src = ROOT / '12-roles-review-print.html'; src.write_text(doc)
out = ROOT / 'Forka-People-Who-can-do-what.pdf'
js = f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://{src}',{{waitUntil:'networkidle'}});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
await p.pdf({{path:'{out}',format:'A4',printBackground:true,preferCSSPageSize:true}});await b.close()}})()"""
subprocess.run(['node', '-e', js], check=True)
print('pdf:', out)
