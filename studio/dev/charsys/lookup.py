"""lookup.py "<character description or name>" [--period X] : find approved/draft characters to REUSE before designing a new one.
Scores library entries by id/name/alias/tag/attribute overlap. Rule: a score >= 3 on an approved character = reuse it (never silently replace);
anything else = propose a NEW character (draft) for owner approval."""
import json, os, re, sys
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'library')
def toks(s): return set(re.findall(r'[a-z0-9]+', s.lower()))
def main():
    q = toks(' '.join(a for a in sys.argv[1:] if not a.startswith('--'))); res = []
    for cid in sorted(os.listdir(LIB)):
        f = os.path.join(LIB, cid, 'character.json')
        if not os.path.isfile(f): continue
        c = json.load(open(f)); a = c.get('attributes', {})
        hay = toks(' '.join([c['id'], c['name'], ' '.join(c.get('aliases', [])), c.get('description', ''), ' '.join(str(v) for v in a.values())]))
        score = len(q & hay) + (3 if q & toks(c['id'] + ' ' + ' '.join(c.get('aliases', []))) else 0)
        res.append((score, cid, c['name'], c['status'], c['version']))
    res.sort(reverse=True)
    for s, cid, n, st, v in res[:5]: print(f'{s:3d}  {cid:20s} v{v:5s} {st[:40]:40s} {n}')
    best = res[0] if res else None
    print('\nDECISION:', f'REUSE {best[1]} (approved)' if best and best[0] >= 3 and best[3].startswith('approved') else
          f'CANDIDATE {best[1]} (draft) - confirm with owner' if best and best[0] >= 3 else 'NEW CHARACTER - draft spec for owner approval')
if __name__ == '__main__': main()
