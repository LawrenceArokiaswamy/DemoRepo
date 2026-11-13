"""Download Poly Haven CC0 assets (1k): models (glTF + textures), PBR textures (jpg), HDRI (hdr)."""
import json, os, sys, urllib.request, time
OUT = sys.argv[1]; UA = {'User-Agent': 'studio-asset-fetch/1.0'}
def get(u):
    for i in range(3):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90).read()
        except Exception as e: err = e; time.sleep(3)
    raise err
def save(path, data): os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'wb').write(data)
models = ['WoodenTable_03','bench_vice_01','hand_plane_no4','vintage_hand_drill','handsaw_wood','wooden_hammer_01','brass_blowtorch','vintage_oil_lamp','Lantern_01','wooden_bookshelf_worn',
          'book_encyclopedia_set_01','decorative_book_set_01','chemistry_set','vintage_microscope','magnifying_glass_01','alarm_clock_01','mantel_clock_01','wooden_crate_01','Barrel_02','wicker_basket_01',
          'wooden_stool_01','brass_pot_01','wooden_candlestick','standing_chalkboard_01','seadogs_compass','wooden_bucket_01','vintage_grandfather_clock_01','pocket_watch','brass_goblets','spinning_wheel_01']
ok = []
for m in models:
    try:
        f = json.loads(get(f'https://api.polyhaven.com/files/{m}'))['gltf']['1k']['gltf']
        save(f'{OUT}/models/{m}/{m}.gltf', get(f['url']))
        for rel, v in f.get('include', {}).items(): save(f'{OUT}/models/{m}/{rel}', get(v['url']))
        ok.append(m)
    except Exception as e: print('FAIL model', m, e)
for t in ['brown_planks_05', 'brick_wall_02', 'dark_planks', 'plastered_wall']:
    try:
        f = json.loads(get(f'https://api.polyhaven.com/files/{t}'))
        for kind, key in [('Diffuse', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough'), ('AO', 'ao')]:
            if kind in f and '1k' in f[kind] and 'jpg' in f[kind]['1k']: save(f'{OUT}/textures/{t}/{key}.jpg', get(f[kind]['1k']['jpg']['url']))
        ok.append(t)
    except Exception as e: print('FAIL tex', t, e)
f = json.loads(get('https://api.polyhaven.com/files/artist_workshop'))['hdri']['1k']['hdr']; save(f'{OUT}/hdri/artist_workshop_1k.hdr', get(f['url'])); ok.append('artist_workshop')
print('ok', len(ok), ok)
