#!/usr/bin/env python3
"""Builds the web app: data/*.js from srd-source/, and index.html from src/app.html."""
import json, re, struct, zlib, pathlib
R = pathlib.Path(__file__).parent
J = lambda f: json.load(open(R / 'srd-source' / (f + '.json'), encoding='utf-8-sig'))
feat1 = lambda f: ({'name': ' / '.join(x['name'] for x in f), 'text': ' '.join(x['text'] for x in f)} if f else None)

data = {
 'cards': [{'n': a['name'], 'd': a['domain'], 'l': a['level'], 't': a['type'], 'r': a['recall'], 'x': a['text']} for a in J('abilities')],
 'weapons': [{'name': w['name'], 'tier': w['tier'], 'ps': w['primary_or_secondary'], 'trait': w['trait'], 'range': w['range'],
              'damage': w['damage'], 'burden': w['burden'], 'f': feat1(w.get('feature'))} for w in J('weapons')],
 'armor': [{'name': a['name'], 'tier': a['tier'], 'th': a['base_thresholds'], 'score': a['base_score'], 'f': feat1(a.get('feature'))} for a in J('armor')],
 'subclasses': {s['name']: {'desc': s.get('description', ''), 'spell': s.get('spellcast_trait'), 'foundation': s.get('foundation', []),
                            'specialization': s.get('specialization', []), 'mastery': s.get('mastery', [])} for s in J('subclasses')},
 'classes': {c['name']: {'desc': c['description'], 'hope': c['hope_feature_text'], 'feat': c['feature'],
                         'bg': [q['question'] for q in c.get('background', [])], 'conn': [q['question'] for q in c.get('connection', [])],
                         'sug': {'traits': c.get('suggested_traits', ''), 'primary': c.get('suggested_primary', ''),
                                 'secondary': c.get('suggested_secondary', ''), 'armor': c.get('suggested_armor', '')}} for c in J('classes')},
 'ancestries': {a['name']: {'desc': a['description'], 'feat': a['feature']} for a in J('ancestries')},
 'communities': {a['name']: {'desc': a['description'], 'feat': a['feature']} for a in J('communities')},
 'domains': {d['name']: d['description'] for d in J('domains')},
 'beastforms': J('beastforms'),
 'items': [{'name': i['name'], 'desc': i['description']} for i in J('items')],
 'consumables': [{'name': i['name'], 'desc': i['description']} for i in J('consumables')],
}
(R / 'data').mkdir(exist_ok=True)
(R / 'data' / 'srd-data.js').write_text('window.DH_SRD=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

# ---- rulebook: split the SRD markdown into sections at headings (levels 1-5)
md = open(R / 'srd-source' / 'SRD.md', encoding='utf-8-sig').read().replace('\r', '')
md = md[md.index('## INTRODUCTION'):]
secs, cur = [], None
for line in md.split('\n'):
    m = re.match(r'^(#{1,5}) (.+)$', line)
    if m:
        cur = {'l': len(m.group(1)), 't': m.group(2).strip(), 'm': ''}
        secs.append(cur)
    elif cur is not None:
        cur['m'] += line + '\n'
# the SRD appendix only links to the domain cards; append their full text so search finds them
by = {}
for c in data['cards']:
    by.setdefault(c['d'], []).append(c)
for dom in sorted(by):
    secs.append({'l': 4, 't': dom.upper() + ' DOMAIN CARDS', 'm': data['domains'].get(dom, '') + '\n'})
    for c in by[dom]:
        secs.append({'l': 5, 't': c['n'], 'm': f"**Level {c['l']} {dom} {c['t']}** · **Recall Cost:** {c['r']}\n\n{c['x']}\n"})
for s in secs:
    s['m'] = s['m'].strip()
(R / 'data' / 'srd-rules.js').write_text('window.DH_RULES=' + json.dumps(secs, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

# ---- icons
def png(n):
    bg, gold, vio = (19, 17, 29), (230, 185, 78), (140, 110, 220)
    rows = bytearray()
    for y in range(n):
        rows.append(0)
        for x in range(n):
            u, v = (x + .5) / n - .5, (y + .5) / n - .5
            a, b = abs(u + .09) + abs(v) * .62, abs(u - .09) + abs(v) * .62
            col = gold if a < .2 else vio if b < .2 else bg
            rows += bytes(col)
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(bytes(rows), 9)) + ch(b'IEND', b'')
for n in (192, 512):
    (R / f'icon-{n}.png').write_bytes(png(n))

def mac_icon(n=1024):
    """macOS app icon: rounded square with the usual margin, transparent corners."""
    bg, gold, vio = (19, 17, 29), (230, 185, 78), (140, 110, 220)
    m, r = n * .098, n * .18          # margin and corner radius
    rows = bytearray()
    for y in range(n):
        rows.append(0)
        for x in range(n):
            dx = max(m + r - x, x - (n - m - r), 0); dy = max(m + r - y, y - (n - m - r), 0)
            inside = m <= x < n - m and m <= y < n - m and dx * dx + dy * dy <= r * r
            if not inside:
                rows += b'\x00\x00\x00\x00'; continue
            u, v = (x + .5) / n - .5, (y + .5) / n - .5
            a, b = abs(u + .075) + abs(v) * .62, abs(u - .075) + abs(v) * .62
            rows += bytes(gold if a < .17 else vio if b < .17 else bg) + b'\xff'
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 6, 0, 0, 0)) + ch(b'IDAT', zlib.compress(bytes(rows), 6)) + ch(b'IEND', b'')
if (R / 'macos').is_dir() and not (R / 'macos' / 'icon-1024.png').exists():
    (R / 'macos' / 'icon-1024.png').write_bytes(mac_icon())
(R / 'icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#13111d"/><path d="M59 18 79 50 59 82 39 50z" fill="#8c6edc"/><path d="M41 18 61 50 41 82 21 50z" fill="#e6b94e"/></svg>\n')
(R / 'manifest.webmanifest').write_text(json.dumps({
 'name': 'Daggerheart Karakterlapok', 'short_name': 'DH Lapok', 'start_url': './', 'scope': './', 'display': 'standalone',
 'background_color': '#13111d', 'theme_color': '#13111d', 'lang': 'hu',
 'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
           {'src': 'icon.svg', 'sizes': 'any', 'type': 'image/svg+xml'}]}, ensure_ascii=False, indent=1), encoding='utf-8')

# ---- index.html: the app body wrapped in a full document
app = (R / 'src' / 'app.html').read_text(encoding='utf-8')
head_bits = ''.join(re.findall(r'^(?:<title>.*?</title>|<link rel="stylesheet"[^>]*>)\n', app, re.M))
body = re.sub(r'^(?:<title>.*?</title>|<link rel="stylesheet"[^>]*>)\n', '', app, flags=re.M)
(R / 'index.html').write_text(f'''<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#13111d">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
{head_bits}<style>:root{{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>
{body}</body>
</html>
''', encoding='utf-8')
print('built:', len(data['cards']), 'cards,', len(data['weapons']), 'weapons,', len(secs), 'rule sections')
