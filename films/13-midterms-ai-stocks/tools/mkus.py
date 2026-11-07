# US states (Natural Earth ne_50m_admin_1_states_provinces, public domain) -> data/us.json in Albers equal-area units (1 unit = 500 km),
# lower 48 in place, Alaska and Hawaii as scaled insets bottom-left (standard US-map layout). usage: python -I mkus.py in.geojson out.json
import json, math, sys
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src))
R = 6371.0; p0, l0, p1, p2 = map(math.radians, (37.5, -96, 29.5, 45.5))
n = (math.sin(p1) + math.sin(p2)) / 2; C = math.cos(p1) ** 2 + 2 * n * math.sin(p1); r0 = math.sqrt(C - 2 * n * math.sin(p0)) / n
def alb(lon, lat, l0_=l0):
    la, lo = math.radians(lat), math.radians(lon)
    r = math.sqrt(max(0, C - 2 * n * math.sin(la))) / n; th = n * (lo - l0_)
    return R * r * math.sin(th), R * (r0 - r * math.cos(th))
def dp(pts, eps):
    if len(pts) < 4: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-9
    k, dm = 0, 0
    for i in range(1, len(pts) - 1):
        dd = abs(dy * (pts[i][0] - a[0]) - dx * (pts[i][1] - a[1])) / L
        if dd > dm: k, dm = i, dd
    if dm > eps: return dp(pts[:k + 1], eps)[:-1] + dp(pts[k:], eps)
    return [a, b]
out = {}
for f in d['features']:
    pr = f['properties']
    if pr.get('iso_a2') != 'US': continue
    st = pr['postal']; g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    rings = []
    for poly in polys:
        ring = poly[0]
        if st == 'AK':
            ring = [(lo if lo < 0 else lo - 360, la) for lo, la in ring]
            xy = [alb(lo, la, math.radians(-154)) for lo, la in ring]; xy = [(x * .35 - 1850, y * .35 - 1975) for x, y in xy]
        elif st == 'HI':
            xy = [alb(lo, la, math.radians(-157)) for lo, la in ring]; xy = [(x * 1.0 - 600, y * 1.0 + 680) for x, y in xy]
        else: xy = [alb(lo, la) for lo, la in ring]
        xy = [(x / 500, y / 500) for x, y in xy]
        area = sum(xy[i][0] * xy[i - 1][1] - xy[i - 1][0] * xy[i][1] for i in range(len(xy))) / 2
        if abs(area) < .0015: continue
        h = len(xy) // 2; xy = dp(xy[:h + 1], .006)[:-1] + dp(xy[h:], .006)
        if len(xy) >= 4: rings.append([[round(x, 4), round(y, 4)] for x, y in xy])
    out[st] = rings
json.dump(out, open(dst, 'w'), separators=(',', ':'))
xs = [p[0] for r in out.values() for q in r for p in q]; ys = [p[1] for r in out.values() for q in r for p in q]
print(len(out), 'states', 'x', min(xs), max(xs), 'y', min(ys), max(ys), 'pts', len(xs))
