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

# ---- D&D 5e (SRD 5.2.1, CC-BY-4.0): structured data + rulebook, loaded by the app only when needed
def build_dnd():
    D = R / 'srd-source' / 'dnd'
    JJ = lambda f: json.load(open(D / 'json' / (f + '.json'), encoding='utf-8'))
    fix = lambda t: (t or '').replace('â€™', '’').replace('â€œ', '“').replace('â€', '”').replace('- pended', 'pended')
    feats = {f['index']: f for f in JJ('Features')}
    levels = JJ('Levels')
    subs = {x['class']['index']: x for x in JJ('Subclasses')}
    traits = {t['index']: t for t in JJ('Traits')}
    classes = []
    for c in JJ('Classes'):
        lv = sorted([l for l in levels if l['class']['index'] == c['index'] and not l.get('subclass')], key=lambda l: l['level'])
        L = []
        for l in lv:
            sc = l.get('spellcasting')
            L.append({'f': [{'n': f['name'], 'd': fix(feats[f['index']]['description'])} for f in l['features'] if f['index'] in feats],
                      'cs': l.get('class_specific') or {},
                      'sc': None if not sc else {'c': sc.get('cantrips_known', 0), 'p': sc.get('prepared_spells', 0),
                                                 's': [sc.get(f'spell_slots_level_{i}', 0) for i in range(1, 10)]}})
        pc = c['proficiency_choices']
        sub = subs.get(c['index'])
        classes.append({
            'id': c['index'], 'name': c['name'], 'hd': c['hit_die'], 'saves': [x['index'] for x in c['saving_throws']],
            'skillN': pc[0]['choose'], 'skillFrom': [o['item']['index'].replace('skill-', '') for o in pc[0]['from']['options'] if o.get('item')],
            'choices': [fix(x['desc']) for x in pc[1:]],
            'profs': [x['name'] for x in c['proficiencies'] if not x['name'].startswith('Saving Throw')],
            'primary': c['primary_ability']['desc'], 'equip': [fix(o['desc']) for o in c.get('starting_equipment_options', [])],
            'spell': (c.get('spellcasting') or {}).get('spellcasting_ability', {}).get('index'),
            'levels': L,
            'sub': None if not sub else {'name': sub['name'], 'summary': sub.get('summary', ''), 'desc': fix(sub.get('description', '')),
                                         'features': [{'n': f['name'], 'level': f['level'], 'd': fix(f['description'])} for f in sub['features']]}})
    tr = lambda refs: [{'n': r['name'], 'd': fix(traits.get(r['index'], {}).get('description', ''))} for r in refs or []]
    subsp = JJ('Subspecies')
    species = [{'id': x['index'], 'name': x['name'], 'size': x.get('size') or 'Small or Medium', 'speed': x['speed'], 'traits': tr(x.get('traits')),
                'sub': [{'id': y['index'], 'name': y['name'], 'traits': tr(y.get('traits'))} for y in subsp if y['species']['index'] == x['index']]}
               for x in JJ('Species')]
    bgs = [{'id': x['index'], 'name': x['name'], 'abil': [a['index'] for a in x['ability_scores']], 'featId': x['feat']['index'],
            'feat': x['feat']['name'] + (f" ({x['feat']['note']})" if x['feat'].get('note') else ''),
            'skills': [q['index'].replace('skill-', '') for q in x['proficiencies'] if q['index'].startswith('skill-')],
            'tools': [q['name'].replace('Tool: ', '') for q in x['proficiencies'] if not q['index'].startswith('skill-')],
            'equip': [fix(o['desc']) for o in x['equipment_options']]} for x in JJ('Backgrounds')]
    weapons, armor, gear = [], [], []
    for e in JJ('Equipment'):
        cats = [k['index'] for k in e['equipment_categories']]
        cost = f"{e['cost']['quantity']} {e['cost']['unit'].upper()}" if e.get('cost') else ''
        if e.get('damage'):
            weapons.append({'id': e['index'], 'name': e['name'], 'martial': 'martial-weapons' in cats, 'ranged': 'ranged-weapons' in cats or any('ranged' in k for k in cats),
                            'dice': e['damage']['damage_dice'], 'dtype': e['damage']['damage_type']['name'], 'props': [q['name'] for q in e.get('properties', [])],
                            'mastery': (e.get('mastery') or {}).get('name', ''), 'range': e.get('range') or {}, 'two': (e.get('two_handed_damage') or {}).get('damage_dice', ''), 'cost': cost})
        elif e.get('armor_class'):
            a = e['armor_class']
            armor.append({'id': e['index'], 'name': e['name'], 'cat': 'shield' if 'shields' in cats else [k for k in cats if k.endswith('-armor')][0].replace('-armor', ''),
                          'base': a['base'], 'dex': bool(a.get('dex_bonus')), 'max': a.get('max_bonus'), 'str': e.get('str_minimum', 0), 'stealth': bool(e.get('stealth_disadvantage')), 'cost': cost})
        else:
            desc = fix(e.get('description', '')) or ', '.join(f"{k['quantity']}× {k['item']['name']}" for k in e.get('contents', []))
            gear.append({'name': e['name'], 'cost': cost, 'desc': desc})
    out = {
        'classes': classes, 'species': species, 'backgrounds': bgs,
        'feats': [{'id': f['index'], 'name': f['name'], 'type': f['type'], 'd': fix(f['description'])} for f in JJ('Feats')],
        'skills': [{'id': k['index'], 'name': k['name'], 'abil': k['ability_score']['index'], 'd': fix(k['description'])} for k in JJ('Skills')],
        'spells': [{'id': x['index'], 'name': x['name'], 'lvl': x['level'], 'school': x['school']['name'], 'cls': [k['index'] for k in x['classes']],
                    'time': x['casting_time'], 'rit': bool(x.get('ritual')), 'range': x['range'], 'comp': ', '.join(x.get('components', [])) + (f" ({fix(x['material'])})" if x.get('material') else ''),
                    'dur': x['duration'], 'conc': bool(x.get('concentration')), 'd': fix(x['description']), 'hi': fix(x.get('higher_level', ''))} for x in JJ('Spells')],
        'weapons': weapons, 'armor': armor, 'gear': gear,
        'conditions': [{'name': k['name'], 'd': fix(k['description'])} for k in JJ('Conditions')],
        'masteries': {k['name']: fix(k['description']) for k in JJ('Weapon-Mastery-Properties')},
        'wprops': {k['name']: fix(k['description']) for k in JJ('Weapon-Properties')},
    }
    (R / 'data' / 'dnd-data.js').write_text('window.DND_SRD=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

    # rulebook: the markdown chapters, HTML tables turned into pipe tables, split at headings (levels 1-4)
    def table(m):
        rows = []
        for row in re.findall(r'<tr[^>]*>(.*?)</tr>', m.group(0), re.S):
            cells = [re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', c)).strip().replace('|', '/') for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', row, re.S)]
            if cells: rows.append(cells)
        if not rows: return ''
        n = max(len(r) for r in rows)
        rows = [r + [''] * (n - len(r)) for r in rows]
        return '\n\n' + '\n'.join(['| ' + ' | '.join(rows[0]) + ' |', '|' + ' --- |' * n] + ['| ' + ' | '.join(r) + ' |' for r in rows[1:]]) + '\n\n'
    order = ['playing-the-game', 'character-creation', 'classes', 'character-origins', 'feats', 'equipment', 'spells', 'rules-glossary',
             'gameplay-toolbox', 'magic-items', 'monsters', 'monsters-A-Z', 'animals']
    secs, cur = [], None
    for name in order:
        t = open(D / 'md' / (name + '.md'), encoding='utf-8').read().replace('\r', '')
        t = re.sub(r'<table.*?</table>', table, t, flags=re.S)
        t = re.sub(r'<br\s*/?>', ' ', t)
        t = re.sub(r'<hr[^>]*>', '', t)
        t = re.sub(r'</?(?:div|span|p|a|sup|sub|small|center|details|summary)[^>]*>', '', t)
        for line in t.split('\n'):
            m = re.match(r'^(#{1,4}) (.+)$', line)
            if m:
                cur = {'l': len(m.group(1)), 't': m.group(2).strip(), 'm': ''}
                secs.append(cur)
            elif cur is not None:
                cur['m'] += line + '\n'
    for x in secs:
        x['m'] = re.sub(r'\n{3,}', '\n\n', x['m']).strip()
    (R / 'data' / 'dnd-rules.js').write_text('window.DND_RULES=' + json.dumps(secs, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    return len(out['spells']), len(secs)
if (R / 'srd-source' / 'dnd' / 'json').is_dir():
    print('dnd:', build_dnd())
for f in ('dnd.js', 'gm.js'):
    if (R / 'src' / f).exists():
        (R / f).write_text((R / 'src' / f).read_text(encoding='utf-8'), encoding='utf-8')

# ---- game master data: book adversaries / environments (Daggerheart) and monsters (D&D), loaded on demand
def build_gm():
    feats = lambda a: [{'name': f['name'], 'text': f.get('text', '')} for f in a or []]
    adv = [{'name': a['name'], 'tier': a['tier'], 'type': a['type'], 'desc': a.get('description', ''), 'motives': a.get('motives_and_tactics', ''),
            'diff': a.get('difficulty', ''), 'thr': a.get('thresholds', ''), 'hp': a.get('hp', ''), 'stress': a.get('stress', ''), 'atk': a.get('atk', ''),
            'attack': a.get('attack', ''), 'range': a.get('range', ''), 'damage': a.get('damage', ''), 'exp': a.get('experience', ''), 'feat': feats(a.get('feature'))} for a in J('adversaries')]
    env = [{'name': e['name'], 'tier': e['tier'], 'type': e['type'], 'desc': e.get('description', ''), 'impulses': e.get('impulses', ''), 'diff': e.get('difficulty', ''),
            'adv': e.get('potential_adversaries', ''), 'feat': feats(e.get('feature'))} for e in J('environments')]
    (R / 'data' / 'gm-dh.js').write_text('window.GM_DH=' + json.dumps({'adv': adv, 'env': env}, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    mons = json.load(open(R / 'srd-source' / 'dnd' / 'json' / 'Monsters.json', encoding='utf-8'))
    names = lambda a: ', '.join((x.get('name') if isinstance(x, dict) else str(x)) for x in a or [])
    acts = lambda a: [{'name': x['name'] + (f" ({x['usage']['times']}/{x['usage']['type'].replace('per ', '')})" if isinstance(x.get('usage'), dict) and x['usage'].get('times') else ''), 'text': x.get('desc', '')} for x in a or []]
    out = []
    for m in mons:
        pr = m.get('proficiencies') or []
        pv = lambda pre: ', '.join(f"{q['proficiency']['name'].replace(pre, '')} {'+' if q['value'] >= 0 else ''}{q['value']}" for q in pr if q['proficiency']['name'].startswith(pre))
        ac = m.get('armor_class') or [{}]
        out.append({'name': m['name'], 'size': m.get('size', ''), 'type': m.get('type', ''), 'align': m.get('alignment', ''), 'ac': ac[0].get('value', 10), 'hp': m.get('hit_points', 1),
                    'hd': m.get('hit_points_roll') or m.get('hit_dice', ''), 'speed': ', '.join(f"{k} {v}" for k, v in (m.get('speed') or {}).items()),
                    'abil': [m.get(k, 10) for k in ('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma')],
                    'saves': pv('Saving Throw: '), 'skills': pv('Skill: '), 'vuln': names(m.get('damage_vulnerabilities')), 'res': names(m.get('damage_resistances')),
                    'imm': ', '.join(x for x in [names(m.get('damage_immunities')), names(m.get('condition_immunities'))] if x),
                    'senses': ', '.join(f"{k.replace('_', ' ')} {v}" for k, v in (m.get('senses') or {}).items()), 'lang': m.get('languages', ''),
                    'cr': m.get('challenge_rating', 0), 'xp': m.get('xp', 0), 'pb': m.get('proficiency_bonus', 2),
                    'traits': acts(m.get('special_abilities')), 'actions': acts(m.get('actions')), 'bonus': acts(m.get('bonus_actions')),
                    'reactions': acts(m.get('reactions')), 'legendary': acts(m.get('legendary_actions'))})
    out.sort(key=lambda x: x['name'])
    (R / 'data' / 'gm-dnd.js').write_text('window.GM_DND=' + json.dumps({'mon': out}, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    return len(adv), len(env), len(out)
if (R / 'srd-source' / 'adversaries.json').exists() and (R / 'srd-source' / 'dnd' / 'json' / 'Monsters.json').exists():
    print('gm:', build_gm())

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
