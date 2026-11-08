import pdfplumber, re, json, unicodedata, sys

PDF = '/mnt/user-data/uploads/px_演題一覧_日付_会場1027-1.pdf'
VENUE_RE = re.compile(r'^([A-S])会場$')
CODE_RE = re.compile(r'^\d[A-S]\d{2}[A-Z]?$')
DATE_RE = re.compile(r'^11月(\d+)日\(([月火水木金土日])\)$')
TIME_RE = re.compile(r'^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$')
CJK = r'[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]'

def norm(s):
    return s.replace('（','(').replace('）',')').replace('：',':')

def join_title(parts):
    s = ' '.join(parts)
    s = re.sub(rf'(?<={CJK})\s+(?={CJK})', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def join_authors(parts):
    s = ' '.join(parts)
    s = re.sub(r'\s*,\s*', ', ', s)
    s = re.sub(r'\s+\)', ')', s)
    s = re.sub(r'\(\s+', '(', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def to_min(h, m):
    return int(h) * 60 + int(m)

sessions = []
cur = None
cur_talk = None
pending_title = []  # for special talks without code

def flush_talk():
    global cur_talk
    if cur_talk and cur:
        cur_talk['title'] = join_title(cur_talk['title'])
        cur_talk['authors'] = join_authors(cur_talk['authors'])
        cur['talks'].append(cur_talk)
    cur_talk = None

def flush_session():
    global cur
    flush_talk()
    if cur:
        if cur.get('_pre'): cur['title'] += cur.pop('_pre')
        cur['title'] = join_title(cur['title'])
        sessions.append(cur)
    cur = None


import html as _html
pages=open('/home/claude/all.html',encoding='utf-8').read().split('<page ')[1:]
class _P: pass
def _words(pg):
    out=[]
    for m in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>',pg):
        out.append({'x0':float(m.group(1)),'top':float(m.group(2)),'x1':float(m.group(3)),'text':_html.unescape(m.group(5))})
    return out
class _PDF:
    pages=[type('pg',(),{'extract_words':staticmethod(lambda pg=pg:_words(pg))})() for pg in pages]
    def __enter__(self): return self
    def __exit__(self,*a): pass

with _PDF() as pdf:
    for pno, page in enumerate(pdf.pages, 1):
        words = page.extract_words()
        lines = []
        for w in sorted(words, key=lambda w: (w['top'], w['x0'])):
            w['text'] = norm(w['text'])
            if lines and abs(lines[-1]['top'] - w['top']) <= 3.5:
                lines[-1]['words'].append(w)
            else:
                lines.append({'top': w['top'], 'words': [w]})
        for ln in lines:
            ws = sorted(ln['words'], key=lambda w: w['x0'])
            left = [w['text'] for w in ws if w['x0'] < 60]
            mid = [w['text'] for w in ws if 60 <= w['x0'] < 318]
            right = [w['text'] for w in ws if w['x0'] >= 318]
            # page header date (centered, single word)
            if len(ws) == 1 and DATE_RE.match(ws[0]['text']) and ws[0]['x0'] > 200 and ws[0]['x0'] < 300:
                continue
            if left and VENUE_RE.match(left[0]):
                flush_session()
                v = VENUE_RE.match(left[0]).group(1)
                date = time = None
                rest_right = []
                for t in right:
                    if DATE_RE.match(t):
                        date = t
                    elif TIME_RE.match(t):
                        time = t
                    else:
                        rest_right.append(t)
                cur = {'venue': v, 'title': mid[:], 'date': date, 'time': time,
                       'chair': None, 'talks': [], 'page': pno, '_right': rest_right}
                continue
            if cur is None:
                continue
            if left and CODE_RE.match(left[0]):
                flush_talk()
                if cur.get('_pre'):
                    cur['title'] += cur.pop('_pre')
                cur['_chair_open'] = False
                cur_talk = {'code': left[0], 'title': mid[:], 'authors': right[:]}
                continue
            # chair line
            rtxt = ' '.join(right)
            if rtxt.startswith('司会'):
                cur['chair'] = join_authors(right).replace('司会:', '').strip()
                cur['_chair_open'] = True
                if mid and not cur['talks'] and cur_talk is None:
                    cur['_pre'] = cur.get('_pre', []) + mid
                continue
            if cur['date'] is None or cur['time'] is None:
                for t in right:
                    if DATE_RE.match(t): cur['date'] = t
                    elif TIME_RE.match(t): cur['time'] = t
                right = [t for t in right if not DATE_RE.match(t) and not TIME_RE.match(t)]
            if cur_talk is None:
                if right and not mid and cur.get('_chair_open') and not cur['talks'] and '〇' not in rtxt:
                    cur['chair'] += (' / ' if cur['chair'].endswith(')') else ' ') + join_authors(right)
                    continue
                if mid and not right:
                    cur['_pre'] = cur.get('_pre', []) + mid
                elif right:
                    cur['_chair_open'] = False
                    cur_talk = {'code': None, 'title': cur.pop('_pre', []) + mid, 'authors': right[:]}
            else:
                cur_talk['title'] += mid
                cur_talk['authors'] += right
flush_session()

# post-process
DAYS = {'10': ('2026-11-10', '火'), '11': ('2026-11-11', '水'), '12': ('2026-11-12', '木'), '13': ('2026-11-13', '金')}
out = []
for i, s in enumerate(sessions):
    m = DATE_RE.match(s['date'] or '')
    tm = TIME_RE.match(s['time'] or '')
    if not m or not tm:
        print('WARN missing date/time', s['venue'], s['title'], s['date'], s['time'], 'page', s['page'], file=sys.stderr)
        continue
    d = DAYS[m.group(1)][0]
    start = f"{int(tm.group(1)):02d}:{tm.group(2)}"
    end = f"{int(tm.group(3)):02d}:{tm.group(4)}"
    title = s['title']
    is_os = title.startswith('【OS】')
    kind = 'os' if is_os else ('special' if '特別講演' in title else 'general')
    out.append({
        'id': f"{d[-2:]}{s['venue']}{start.replace(':','')}",
        'date': d,
        'venue': s['venue'],
        'start': start,
        'end': end,
        'title': title,
        'kind': kind,
        'chair': s['chair'],
        'talks': s['talks'],
    })
out.sort(key=lambda s: (s['date'], s['venue'], s['start']))
json.dump(out, open('/home/claude/sessions.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('sessions', len(out), 'talks', sum(len(s['talks']) for s in out))
