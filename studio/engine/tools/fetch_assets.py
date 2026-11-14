"""Fetch the studio's CC0 asset library from Poly Haven (models glTF 1k, PBR textures, HDRIs). Skips files already present.
usage: fetch_assets.py <assets_dir>"""
import json, os, sys, urllib.request, time
OUT = sys.argv[1]; UA = {'User-Agent': 'studio-asset-fetch/1.0'}
def get(u):
    for i in range(3):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read()
        except Exception as e: err = e; time.sleep(3)
    raise err
def save(path, data): os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'wb').write(data)
MODELS = ['WoodenTable_03','bench_vice_01','hand_plane_no4','vintage_hand_drill','handsaw_wood','wooden_hammer_01','brass_blowtorch','vintage_oil_lamp','Lantern_01','wooden_bookshelf_worn',
          'book_encyclopedia_set_01','decorative_book_set_01','chemistry_set','vintage_microscope','magnifying_glass_01','alarm_clock_01','mantel_clock_01','wooden_crate_01','Barrel_02','wicker_basket_01',
          'wooden_stool_01','brass_pot_01','wooden_candlestick','standing_chalkboard_01','seadogs_compass','wooden_bucket_01','vintage_grandfather_clock_01','pocket_watch','brass_goblets','spinning_wheel_01',
          'antique_ceramic_vase_01','ceramic_vase_01','ceramic_vase_02','ceramic_vase_03','jug_01','wooden_bucket_02','trowel_01','rusted_spade_01','wicker_basket_02','wooden_crate_02','coast_rocks_01','coast_rocks_02','stone_01','wooden_bowl_01','planter_pot_clay','rock_07']
TEXTURES = [('brown_planks_05', '1k'), ('brick_wall_02', '1k'), ('dark_planks', '1k'), ('plastered_wall', '1k'), ('large_sandstone_blocks', '2k'), ('coast_sand_01', '2k'),
            ('seaworn_sandstone_brick', '1k'), ('wood_planks', '1k'), ('dirty_concrete', '1k'), ('gravelly_sand', '1k')]
HDRIS = [('artist_workshop', '1k'), ('qwantani_morning_puresky', '2k')]
for m in MODELS:
    if os.path.exists(f'{OUT}/models/{m}/{m}.gltf'): continue
    try:
        f = json.loads(get(f'https://api.polyhaven.com/files/{m}'))['gltf']['1k']['gltf']; save(f'{OUT}/models/{m}/{m}.gltf', get(f['url']))
        for rel, v in f.get('include', {}).items(): save(f'{OUT}/models/{m}/{rel}', get(v['url']))
        print('model', m)
    except Exception as e: print('FAIL model', m, e)
for t, res in TEXTURES:
    if os.path.exists(f'{OUT}/textures/{t}/diff.jpg'): continue
    f = json.loads(get(f'https://api.polyhaven.com/files/{t}'))
    for kind, key in [('Diffuse', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough'), ('AO', 'ao')]:
        if kind in f and res in f[kind] and 'jpg' in f[kind][res]: save(f'{OUT}/textures/{t}/{key}.jpg', get(f[kind][res]['jpg']['url']))
    print('texture', t)
for h, res in HDRIS:
    p = f'{OUT}/hdri/{h}_{res}.hdr'
    if not os.path.exists(p): f = json.loads(get(f'https://api.polyhaven.com/files/{h}'))['hdri'][res]['hdr']; save(p, get(f['url'])); print('hdri', h)
print('assets ready')
