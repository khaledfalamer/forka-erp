#!/usr/bin/env python3
"""Builds the Forka People feature map from docs/people/feature-map.json:
- docs/people/11-feature-map.md   (tracking table, read on GitHub)
- docs/people/feature-map.html    (diagram + table, published as a review page)
Update the JSON as features move, then run: python3 docs/people/tools/build_feature_map.py
"""
import json, html, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'feature-map.json').read_text())
F = {f['id']: f for f in data['features']}
LEVELS = [('spec', 'Plan'), ('db', 'Database'), ('server', 'Server + tests'), ('screens', 'Screens'), ('live', 'Live')]
MARK = {'done': '✓', 'part': '◐', 'no': '·', 'blocked': '✕'}

def overall(f):
    s = f['status']
    if s.get('blocked'): return 'blocked'
    if s['live'] == 'done': return 'live'
    if s['server'] == 'done': return 'real'
    if s['screens'] in ('done', 'part'): return 'preview'
    return 'planned'

STATUS_TEXT = {'live': 'Live', 'real': 'Real (server + tests)', 'preview': 'Preview in demo', 'planned': 'Planned', 'blocked': 'Blocked'}
COLOR = {'live': '#1F4F2B', 'real': '#2F6B3F', 'preview': '#3D7C8C', 'planned': '#8A8378', 'blocked': '#A8432E'}
FILL = {'live': '#DDEEDF', 'real': '#E4F0E6', 'preview': '#E3EEF0', 'planned': '#F3F0EA', 'blocked': '#F6E1DB'}

# ---------- markdown ----------
md = ['# 11. Feature map and build tracker', '',
      f"Last updated: {data['updated']}. Source: `feature-map.json` (edit it, then run `python3 docs/people/tools/build_feature_map.py`).", '',
      'Levels: **Plan** (written in docs 02–10) · **Database** (tables exist) · **Server + tests** (real endpoints with permission tests) · **Screens** (in the preview link) · **Live** (in use with real data).',
      'Marks: ✓ done · ◐ partly · · not started · ✕ blocked.', '']
for band in data['bands']:
    md += [f"## {band['name']}", '', band['note'], '',
           '| Feature | Phase | ' + ' | '.join(n for _, n in LEVELS) + ' | Depends on | Blocked by | Next step |',
           '|---|---|' + '---|' * len(LEVELS) + '---|---|---|']
    for g in band['groups']:
        for fid in g['features']:
            f = F[fid]; s = f['status']
            deps = ', '.join(F[d]['name'] for d in f.get('depends', []))
            md.append(f"| **{f['name']}**<br><sub>{g['name']}</sub> | {f['phase']} | " + ' | '.join(MARK[s[k]] for k, _ in LEVELS) +
                      f" | {deps or '—'} | {f.get('blocker') or '—'} | {f.get('next') or '—'} |")
    md.append('')
md += ['## How to use this map', '', '1. Before building a feature, read its plan section (doc 09 for Phase 1, docs 02–08 for the rest) and check its "Depends on" column is real first.',
       '2. When a level is finished, change its mark in `feature-map.json` and rebuild this file and the diagram.', '3. "Live" is set only after the CEO says "go live" for that feature.', '']
(ROOT / '11-feature-map.md').write_text('\n'.join(md))

# ---------- SVG diagram ----------
W = 1360; BW, BH = 230, 46; out = []
def box(x, y, f, w=BW):
    st = overall(f); c = COLOR[st]; dash = ' stroke-dasharray="5 4"' if st == 'planned' else ''
    name = html.escape(f['name'])
    out.append(f'<g><rect x="{x}" y="{y}" width="{w}" height="{BH}" rx="9" fill="{FILL[st]}" stroke="{c}" stroke-width="1.6"{dash}/>'
               f'<circle cx="{x+16}" cy="{y+BH/2}" r="5" fill="{c}"/>'
               f'<text x="{x+30}" y="{y+BH/2+4.5}" font-size="13" fill="#2B2B2B">{name}</text>'
               f'<text x="{x+w-10}" y="{y+BH/2+4}" font-size="11" fill="{c}" text-anchor="end" font-weight="600">{html.escape(f["phase"])}</text></g>')

def arrow(x, y1, y2, label):
    out.append(f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="#2B2B2B" stroke-width="1.6" marker-end="url(#ah)"/>'
               f'<text x="{x+10}" y="{(y1+y2)/2+4}" font-size="12" fill="#5E5A54">{html.escape(label)}</text>')

y = 30
for bi_, band in enumerate(data['bands']):
    out.append(f'<text x="40" y="{y+14}" font-size="15" font-weight="700" fill="#2B2B2B">{html.escape(band["name"])}</text>')
    y += 28
    if band.get('layout') == 'row':
        feats = [fid for g in band['groups'] for fid in g['features']]
        n = len(feats); gap = 16; bw = (W - 80 - gap * (n - 1)) / n
        for i, fid in enumerate(feats): box(40 + i * (bw + gap), y, F[fid], bw)
        y += BH
    else:
        n = len(band['groups']); gap = 22; cw = (W - 80 - gap * (n - 1)) / n
        tallest = max(len(g['features']) for g in band['groups'])
        for i, g in enumerate(band['groups']):
            x = 40 + i * (cw + gap)
            out.append(f'<text x="{x}" y="{y+12}" font-size="12" fill="#5E5A54" font-weight="600">{html.escape(g["name"].upper())}</text>')
            for j, fid in enumerate(g['features']): box(x, y + 20 + j * (BH + 10), F[fid], cw)
        y += 20 + tallest * (BH + 10) - 10
    if bi_ < len(data['bands']) - 1:
        arrow(W / 2, y + 8, y + 58, data['bands'][bi_]['arrow'])
        y += 70
H = y + 30
# legend
lx = 40; ly = H; legend = []
for k in ['real', 'preview', 'planned', 'blocked']:
    dash = ' stroke-dasharray="5 4"' if k == 'planned' else ''
    legend.append(f'<rect x="{lx}" y="{ly}" width="26" height="16" rx="4" fill="{FILL[k]}" stroke="{COLOR[k]}" stroke-width="1.6"{dash}/><text x="{lx+34}" y="{ly+12.5}" font-size="12.5" fill="#2B2B2B">{STATUS_TEXT[k]}</text>')
    lx += 220
legend.append(f'<text x="{lx}" y="{ly+12.5}" font-size="12.5" fill="#5E5A54">Right-hand label = build phase</text>')
H += 40
svg = (f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Forka People features in layers: foundation, shared engines, modules, and outputs, coloured by build status" '
       f'style="max-width:100%;height:auto;font-family:Inter Tight,system-ui,sans-serif">'
       '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2B2B2B"/></marker></defs>'
       + ''.join(out) + ''.join(legend) + '</svg>')

# ---------- HTML table ----------
rows = []
for band in data['bands']:
    rows.append(f'<tr class="band"><th colspan="{6 + len(LEVELS)}">{html.escape(band["name"])}</th></tr>')
    for g in band['groups']:
        for fid in g['features']:
            f = F[fid]; s = f['status']; st = overall(f)
            cells = ''.join(f'<td class="lv {s[k]}" title="{n}: {s[k]}">{MARK[s[k]]}</td>' for k, n in LEVELS)
            deps = ', '.join(html.escape(F[d]['name']) for d in f.get('depends', []))
            rows.append(f'<tr id="{fid}"><td><span class="dot" style="background:{COLOR[st]}"></span><strong>{html.escape(f["name"])}</strong><br><small>{html.escape(g["name"])} · {STATUS_TEXT[st]}</small></td>'
                        f'<td class="ph">{html.escape(f["phase"])}</td>{cells}<td>{deps or "—"}</td><td>{html.escape(f.get("blocker") or "—")}</td><td>{html.escape(f.get("next") or "—")}</td>'
                        f'<td><small>{html.escape(f.get("spec") or "")}</small></td></tr>')
counts = {k: sum(1 for f in data['features'] if overall(f) == k) for k in STATUS_TEXT}
summary = ' · '.join(f'<b style="color:{COLOR[k]}">{counts[k]}</b> {STATUS_TEXT[k]}' for k in ['real', 'preview', 'planned', 'blocked'] if counts[k])
page = f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forka People feature map</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600&family=Inter+Tight:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{{color-scheme:light}} body{{margin:0;background:#F6F3EE;color:#2B2B2B;font:15px/1.5 'Inter Tight',system-ui,sans-serif}}
main{{max-width:1400px;margin:0 auto;padding:28px 20px 60px}} h1,h2{{font-family:'EB Garamond',Georgia,serif;font-weight:600;margin:0 0 6px}} h1{{font-size:32px}} h2{{font-size:22px;margin-top:28px}}
.muted{{color:#5E5A54}} figure{{margin:16px 0;background:#fff;border:1px solid #E3DCD1;border-radius:14px;padding:16px;overflow-x:auto}} figcaption{{color:#5E5A54;font-size:14px;margin-top:8px}}
.wrap{{overflow-x:auto;background:#fff;border:1px solid #E3DCD1;border-radius:14px}} table{{border-collapse:collapse;width:100%;font-size:13.5px}}
th,td{{padding:8px 10px;border-bottom:1px solid #EEE9E1;text-align:left;vertical-align:top}} thead th{{background:#FAF8F4;position:sticky;top:0;font-size:12.5px;color:#5E5A54}}
tr.band th{{background:#2B2B2B;color:#F6F3EE;font-size:13px;letter-spacing:.04em;text-transform:uppercase}} td.lv{{text-align:center;font-weight:700;width:64px}}
td.lv.done{{color:#2F6B3F;background:#EEF6EF}} td.lv.part{{color:#3D7C8C;background:#EDF4F5}} td.lv.no{{color:#B0A99E}} td.lv.blocked{{color:#A8432E;background:#FBEDE9}}
td.ph{{font-weight:700;white-space:nowrap}} .dot{{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:6px}} small{{color:#5E5A54}}
</style></head><body><main>
<h1>Forka People: feature map</h1>
<p class="muted">Updated {html.escape(data['updated'])}. {summary}. Every feature sits on the layers above it: build from the top down, and check a feature's "Depends on" column is real before starting it.</p>
<figure>{svg}<figcaption>Features in four layers. Arrows show what each layer gives the next. Colour = how far it is built; the phase label matches the delivery plan (doc 08).</figcaption></figure>
<h2>Build tracker</h2>
<p class="muted">✓ done · ◐ partly · · not started · ✕ blocked. Plan = written in docs 02–10; Screens = in the preview link; Live = in use with real data after "go live".</p>
<div class="wrap"><table><thead><tr><th>Feature</th><th>Phase</th>{''.join(f'<th>{n}</th>' for _, n in LEVELS)}<th>Depends on</th><th>Blocked by</th><th>Next step</th><th>Plan reference</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table></div>
</main></body></html>'''
(ROOT / 'feature-map.html').write_text(page)
print('built', len(data['features']), 'features;', summary.replace('<b style="color:', '').replace('</b>', ''))
