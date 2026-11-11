# Fetch Poly Haven (CC0) assets: models as glTF (1k textures), textures (diff/nor_gl/rough jpg, 1k), HDRIs (2k .hdr).
# python ph_fetch.py <outdir> model:Sofa_01 tex:wood_floor_worn hdri:farm_sunset ...
import sys, os, json, urllib.request
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'film-build/1.0'}), timeout=120).read()
def save(u, p):
    if os.path.exists(p): return
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(get(u))
for spec in sys.argv[2:]:
    kind, aid = spec.split(':'); f = json.loads(get(f'https://api.polyhaven.com/files/{aid}'))
    if kind == 'model':
        g = f['gltf']['1k']['gltf']; d = f'{OUT}/models/{aid}'; save(g['url'], f'{d}/{aid}.gltf')
        for rel, inc in g.get('include', {}).items(): save(inc['url'], f'{d}/{rel}')
    elif kind == 'tex':
        for k, name in (('Diffuse', 'diff'), ('col_1', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough')):
            if k in f: save(f[k]['1k']['jpg']['url'], f'{OUT}/tex/{aid}_{name}.jpg')
    elif kind == 'hdri': save(f['hdri']['2k']['hdr']['url'], f'{OUT}/hdri/{aid}.hdr')
    print('ok', spec, flush=True)
