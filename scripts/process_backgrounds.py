import os
import sys
import json
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

raw_dir = r'homepage img'
out_dir = r'mobile/assets/backgrounds'
os.makedirs(out_dir, exist_ok=True)

manifest_items = [
    {
        'id': 'bg_african_savannah',
        'raw': 'African Savannah.jpg',
        'file': 'african_savannah.webp',
        'description': 'Acacia tree silhouetted against a vibrant orange sunset behind elephants traversing the savannah.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': None
    },
    {
        'id': 'bg_paris_eiffel_night',
        'raw': 'Eiffel Tower at Night _ Paris Luxury Travel.jpg',
        'file': 'paris_eiffel_night.webp',
        'description': 'Illuminated Eiffel Tower at night viewed from across the Seine river bridge with an excursion boat.',
        'focal': {'x': 0.52, 'y': 0.50},
        'place': {'city': 'Paris', 'country': 'France'}
    },
    {
        'id': 'bg_elephants_river',
        'raw': 'Elephants chilling on the river.jpg',
        'file': 'elephants_river.webp',
        'description': 'Two elephants playing joyfully in a river with raised trunks under sunlit jungle foliage.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': None
    },
    {
        'id': 'bg_ellora_caves',
        'raw': 'Ellora Caves.jpg',
        'file': 'ellora_caves.webp',
        'description': 'Monolithic rock-cut Kailasa Temple carved vertically from the basalt cliff face at Ellora Caves.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'name': 'Ellora Caves', 'country': 'India'}
    },
    {
        'id': 'bg_great_wall_china',
        'raw': 'Great Wall, China.jpg',
        'file': 'great_wall_china.webp',
        'description': 'Stone watchtowers of the Great Wall meandering across forested mountain ridges.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'name': 'Great Wall', 'country': 'China'}
    },
    {
        'id': 'bg_jeju_island',
        'raw': 'Jeju Island.jpg',
        'file': 'jeju_island.webp',
        'description': 'Stone staircase descending green volcanic coastal slopes toward a turquoise ocean cove.',
        'focal': {'x': 0.48, 'y': 0.50},
        'place': {'city': 'Jeju', 'country': 'South Korea'}
    },
    {
        'id': 'bg_meghalaya_root_bridge',
        'raw': 'Living root bridges  in Kerala — they’re a Meghalaya specialty! 🌿.jpg',
        'file': 'meghalaya_root_bridge.webp',
        'description': 'Living tree root suspension bridge spanning across a crystal-clear pebble river in a dense rainforest.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'region': 'Meghalaya', 'country': 'India'}
    },
    {
        'id': 'bg_mumbai_sealink',
        'raw': 'Mumbai India 🇮🇳.jpg',
        'file': 'mumbai_sealink.webp',
        'description': 'Aerial view of the cable-stayed Bandra-Worli Sea Link crossing the bay towards the Mumbai skyline.',
        'focal': {'x': 0.52, 'y': 0.50},
        'place': {'city': 'Mumbai', 'country': 'India'}
    },
    {
        'id': 'bg_norway_aurora_fjords',
        'raw': 'Norway Fjords & Northern Lights ✨🇳🇴 _ Dreamy Nordic Aesthetic.jpg',
        'file': 'norway_aurora_fjords.webp',
        'description': 'Green aurora borealis sweeping over snow-covered fjord peaks and illuminated red waterfront cabins.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'country': 'Norway'}
    },
    {
        'id': 'bg_rome_colosseum',
        'raw': 'ROME.jpg',
        'file': 'rome_colosseum.webp',
        'description': 'Arched travertine stone outer wall of the Roman Colosseum bathed in late afternoon sunlight.',
        'focal': {'x': 0.48, 'y': 0.50},
        'place': {'city': 'Rome', 'country': 'Italy'}
    },
    {
        'id': 'bg_zermatt_matterhorn',
        'raw': 'Ride the Gornergrat Railway 🚆 to Stunning Matterhorn Views in Zermatt, Switzerland 🏔️.jpg',
        'file': 'zermatt_matterhorn.webp',
        'description': 'Red cogwheel railway train passing wildflower alpine slopes toward the snow-capped Matterhorn peak.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'city': 'Zermatt', 'country': 'Switzerland'}
    },
    {
        'id': 'bg_seattle_spaceneedle',
        'raw': 'Seattle, Washington.jpg',
        'file': 'seattle_spaceneedle.webp',
        'description': 'Illuminated Space Needle standing tall before the evening skyline of downtown Seattle.',
        'focal': {'x': 0.42, 'y': 0.50},
        'place': {'city': 'Seattle', 'country': 'United States'}
    },
    {
        'id': 'bg_sondoong_cave',
        'raw': 'Son Doong Cave - All You SHOULD Know Before You Go 2026 (w_ Reviews & Photos).jpg',
        'file': 'sondoong_cave.webp',
        'description': 'Subterranean limestone cavern opening with daylight illuminating moss-clad rock formations and a cave pool.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'name': 'Son Doong Cave', 'country': 'Vietnam'}
    },
    {
        'id': 'bg_machu_picchu',
        'raw': 'The Lost City of the Incas_ Machu Picchu.jpg',
        'file': 'machu_picchu.webp',
        'description': 'Inca stone citadel ruins and green agricultural terraces framed by steep Andean mountain peaks.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'name': 'Machu Picchu', 'country': 'Peru'}
    },
    {
        'id': 'bg_times_square_night',
        'raw': 'Time sqaure by night.jpg',
        'file': 'times_square_night.webp',
        'description': 'Vibrant Times Square at night with glowing high-rise digital billboards reflecting on wet asphalt.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'city': 'New York', 'country': 'United States'}
    },
    {
        'id': 'bg_waitomo_glowworms',
        'raw': 'Waitomo Glowworm Caves.jpg',
        'file': 'waitomo_glowworms.webp',
        'description': 'Boat gliding under a limestone cavern ceiling illuminated by thousands of bioluminescent blue glowworms.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'name': 'Waitomo Glowworm Caves', 'country': 'New Zealand'}
    },
    {
        'id': 'bg_cambodia_angkor_wat',
        'raw': 'cambodia angor wat.webp',
        'file': 'cambodia_angkor_wat.webp',
        'description': 'Towers of Angkor Wat silhouetted against a golden sunrise with lotus pond reflections.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'city': 'Siem Reap', 'country': 'Cambodia'}
    },
    {
        'id': 'bg_tropical_lagoon_island',
        'raw': 'download (6).jpg',
        'file': 'tropical_lagoon_island.webp',
        'description': 'Crystalline turquoise lagoon with fringing palm trees and a jagged volcanic mountain pinnacle.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': None
    },
    {
        'id': 'bg_desert_pyramids',
        'raw': 'download (7).jpg',
        'file': 'desert_pyramids.webp',
        'description': 'Ancient stone pyramids rising above golden desert sands with camel riders in the foreground.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': None
    },
    {
        'id': 'bg_cherry_blossom_pagoda',
        'raw': 'download (8).jpg',
        'file': 'cherry_blossom_pagoda.webp',
        'description': 'Tiered pagoda rising through blooming pink cherry blossoms overlooking a city at sunset.',
        'focal': {'x': 0.45, 'y': 0.50},
        'place': None
    },
    {
        'id': 'bg_aksu_zhabagly_canyon',
        'raw': 'Каньон Аксу - Жабаглы_ Казахстан_.jpg',
        'file': 'aksu_zhabagly_canyon.webp',
        'description': 'Meadow of blooming wild red tulips facing rugged snow-capped canyon mountains at sunset.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'name': 'Aksu-Zhabagly', 'country': 'Kazakhstan'}
    },
    {
        'id': 'bg_tokyo_shibuya_neon',
        'raw': '✨ Tokyo Neon Shibuya.jpg',
        'file': 'tokyo_shibuya_neon.webp',
        'description': 'Bird\'s-eye perspective of Shibuya Crossing on a rainy night with glowing neon signs and umbrella crowds.',
        'focal': {'x': 0.50, 'y': 0.50},
        'place': {'city': 'Tokyo', 'country': 'Japan'}
    }
]

target_w, target_h = 1170, 2532
target_aspect = target_w / target_h

print(f'Starting processing of {len(manifest_items)} photos...')
for idx, item in enumerate(manifest_items):
    in_fp = os.path.join(raw_dir, item['raw'])
    out_fp = os.path.join(out_dir, item['file'])
    with Image.open(in_fp) as img:
        img = img.convert('RGB')
        w, h = img.size
        aspect = w / h

        # Calculate crop box based on focal point
        if aspect > target_aspect:
            # Crop horizontally
            crop_w = int(h * target_aspect)
            crop_h = h
            focal_x = item['focal']['x']
            center_x = int(w * focal_x)
            left = max(0, min(w - crop_w, center_x - crop_w // 2))
            top = 0
            right = left + crop_w
            bottom = h
        else:
            # Crop vertically
            crop_w = w
            crop_h = int(w / target_aspect)
            focal_y = item['focal']['y']
            center_y = int(h * focal_y)
            top = max(0, min(h - crop_h, center_y - crop_h // 2))
            left = 0
            right = w
            bottom = top + crop_h
        cropped = img.crop((left, top, right, bottom))
        resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
        quality = 84
        while True:
            resized.save(out_fp, 'WEBP', quality=quality, method=6)
            sz = os.path.getsize(out_fp)
            if sz <= 245 * 1024 or quality <= 50:
                break
            quality -= 4
        sz_kb = sz / 1024
        print(f'[{idx+1:02d}/22] {item["file"]:28s} {sz_kb:6.1f} KB (quality: {quality})')

print('All 22 images processed successfully!')
