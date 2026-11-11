"""
VAMO — Render 5 Authentic App Showcase Screenshots
Outputs to landing/public/shots/:
  1-analyze.webp
  2-processing.webp
  3-results.webp
  4-map.webp
  5-place.webp
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = 'landing/public/shots'
FONTS_DIR = 'landing/public/fonts'
os.makedirs(OUTPUT_DIR, exist_ok=True)

W, H = 750, 1624

# Colors
BG_DARK = (7, 13, 18)
GLASS_BG = (16, 26, 36)
GLASS_BORDER = (42, 60, 78)
TEXT_IVORY = (251, 244, 227)
TEXT_MUTED = (160, 175, 190)
TEXT_ICY = (166, 220, 248)
ACCENT_RED = (235, 38, 39)
AMBER_DEMO = (246, 211, 101)
AMBER_BG = (35, 28, 16)
AMBER_BORDER = (232, 168, 56)

font_hero = ImageFont.truetype(os.path.join(FONTS_DIR, 'Inter-Bold.ttf'), 52)
font_italic = ImageFont.truetype(os.path.join(FONTS_DIR, 'InstrumentSerif-Italic.ttf'), 56)
font_bold = ImageFont.truetype(os.path.join(FONTS_DIR, 'Inter-Bold.ttf'), 34)
font_semi = ImageFont.truetype(os.path.join(FONTS_DIR, 'Inter-SemiBold.ttf'), 26)
font_body = ImageFont.truetype(os.path.join(FONTS_DIR, 'Inter-Regular.ttf'), 22)
font_small = ImageFont.truetype(os.path.join(FONTS_DIR, 'Inter-Regular.ttf'), 18)
font_mono = ImageFont.truetype(os.path.join(FONTS_DIR, 'Inter-Medium.ttf'), 16)

def draw_status_bar(draw):
    draw.text((60, 28), "9:41", fill=TEXT_IVORY, font=font_mono, anchor="lm")
    # Dynamic Island
    draw.rounded_rectangle([W//2 - 90, 18, W//2 + 90, 52], radius=17, fill=(0, 0, 0))

def draw_top_nav(draw, title="VAMO"):
    # Header row
    draw.text((60, 100), title, fill=TEXT_IVORY, font=font_bold, anchor="lm")
    draw.ellipse([60 + 115, 96, 60 + 125, 106], fill=ACCENT_RED)
    
    # Demo pill
    draw.rounded_rectangle([W - 250, 80, W - 60, 120], radius=20, fill=(20, 28, 38), outline=AMBER_BORDER, width=1)
    draw.ellipse([W - 235, 96, W - 225, 106], fill=AMBER_DEMO)
    draw.text((W - 215, 100), "Demo · Rome", fill=AMBER_DEMO, font=font_mono, anchor="lm")

def draw_bottom_bar(draw, active_tab=0):
    y = H - 110
    draw.rectangle([0, y, W, H], fill=BG_DARK)
    draw.line([0, y, W, y], fill=(30, 44, 58), width=1)
    tabs = [("Analyze", True if active_tab==0 else False), ("Saved", True if active_tab==1 else False), ("Profile", True if active_tab==2 else False)]
    for i, (tab, active) in enumerate(tabs):
        cx = W // 6 + i * (W // 3)
        col = TEXT_ICY if active else TEXT_MUTED
        draw.text((cx, y + 45), tab, fill=col, font=font_small, anchor="mm")
    # Home bar
    draw.rounded_rectangle([W//2 - 70, H - 20, W//2 + 70, H - 14], radius=3, fill=(180, 190, 200))


# 1. SCREEN 1: ANALYZE
def render_screen_analyze():
    img = Image.new('RGB', (W, H), color=BG_DARK)
    # Subtle blurred background photo
    bg_photo = Image.open('mobile/assets/backgrounds/rome_colosseum.webp').resize((W, H)).filter(ImageFilter.GaussianBlur(35))
    img.paste(bg_photo, (0, 0))
    overlay = Image.new('RGBA', (W, H), (5, 11, 14, 210))
    img.paste(overlay, (0, 0), overlay)
    
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    draw_top_nav(draw)
    
    # Hero Title
    draw.text((60, 230), "Drop a reel.", fill=TEXT_IVORY, font=font_hero)
    draw.text((60, 290), "Find the place.", fill=TEXT_ICY, font=font_italic)
    draw.text((60, 360), "Paste an Instagram travel reel to discover where it was filmed.", fill=TEXT_MUTED, font=font_body)
    
    # Glass URL Input
    draw.rounded_rectangle([50, 420, W - 50, 500], radius=24, fill=(14, 24, 34), outline=TEXT_ICY, width=2)
    draw.text((80, 460), "https://instagram.com/reel/C8xyzRome...", fill=TEXT_IVORY, font=font_body, anchor="lm")
    draw.rounded_rectangle([W - 160, 435, W - 65, 485], radius=16, fill=(166, 220, 248), outline=None)
    draw.text((W - 112, 460), "Find", fill=(5, 11, 14), font=font_semi, anchor="mm")
    
    # 3 Demo Chips
    draw.text((60, 530), "DEMO DESTINATIONS (OFFLINE)", fill=AMBER_DEMO, font=font_mono)
    chips = [("Jeju Island", False), ("Rome", True), ("Kyoto", False)]
    cx = 60
    for label, is_active in chips:
        w_chip = 190
        fill_col = (45, 36, 18) if is_active else (18, 28, 38)
        border_col = AMBER_BORDER if is_active else (40, 56, 72)
        draw.rounded_rectangle([cx, 555, cx + w_chip, 605], radius=25, fill=fill_col, outline=border_col, width=2 if is_active else 1)
        draw.ellipse([cx + 20, 575, cx + 30, 585], fill=AMBER_DEMO if is_active else (120, 140, 160))
        draw.text((cx + 42, 580), label, fill=AMBER_DEMO if is_active else TEXT_IVORY, font=font_small, anchor="lm")
        cx += w_chip + 15
        
    # Discovery category pills
    draw.text((60, 645), "EXPLORE THEMES", fill=TEXT_MUTED, font=font_mono)
    themes = ["Hidden Stays", "Viewpoints", "Ancient Ruins", "Local Food"]
    tx = 60
    for t in themes:
        w_t = len(t) * 13 + 30
        draw.rounded_rectangle([tx, 675, tx + w_t, 720], radius=18, fill=(16, 26, 36), outline=(40, 56, 72))
        draw.text((tx + w_t//2, 698), t, fill=TEXT_MUTED, font=font_small, anchor="mm")
        tx += w_t + 12
        if tx > W - 150: break

    # Card 1: In Focus
    draw.rounded_rectangle([50, 760, W - 50, 1100], radius=28, fill=(16, 26, 36), outline=(40, 58, 76), width=1)
    # Thumbnail inside card
    try:
        thumb = Image.open('mobile/assets/backgrounds/rome_colosseum.webp').resize((W - 100, 210))
        img.paste(thumb, (50, 760))
    except: pass
    draw.text((80, 1000), "Rome, Italy", fill=TEXT_IVORY, font=font_bold)
    draw.text((80, 1045), "Colosseum & Imperial Forum · UNESCO Heritage", fill=TEXT_ICY, font=font_small)

    # Card 2: Recent Analysis
    draw.rounded_rectangle([50, 1130, W - 50, 1440], radius=28, fill=(16, 26, 36), outline=(40, 58, 76), width=1)
    draw.text((80, 1170), "Jeju Island, South Korea", fill=TEXT_IVORY, font=font_bold)
    draw.text((80, 1215), "Seongsan Ilchulbong & Hallasan peak", fill=TEXT_MUTED, font=font_small)
    draw.text((80, 1260), "Resolved from 14-second Instagram Reel", fill=TEXT_MUTED, font=font_mono)
    draw.rounded_rectangle([80, 1310, 260, 1360], radius=16, fill=(166, 220, 248, 40), outline=TEXT_ICY)
    draw.text((170, 1335), "View Dossier →", fill=TEXT_ICY, font=font_mono, anchor="mm")
    
    draw_bottom_bar(draw, 0)
    img.save(os.path.join(OUTPUT_DIR, '1-analyze.webp'), 'WEBP', quality=90)
    print("Saved 1-analyze.webp")


# 2. SCREEN 2: PROCESSING
def render_screen_processing():
    img = Image.new('RGB', (W, H), color=BG_DARK)
    bg_photo = Image.open('mobile/assets/backgrounds/rome_colosseum.webp').resize((W, H)).filter(ImageFilter.GaussianBlur(40))
    img.paste(bg_photo, (0, 0))
    overlay = Image.new('RGBA', (W, H), (5, 11, 14, 230))
    img.paste(overlay, (0, 0), overlay)
    
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Demo pill header
    draw.rounded_rectangle([W//2 - 90, 100, W//2 + 90, 140], radius=20, fill=(20, 28, 38), outline=AMBER_BORDER, width=1)
    draw.ellipse([W//2 - 75, 116, W//2 - 65, 126], fill=AMBER_DEMO)
    draw.text((W//2 - 50, 120), "Demo data", fill=AMBER_DEMO, font=font_mono, anchor="lm")
    
    # Central Spinner / Icon
    cx, cy = W // 2, 380
    draw.ellipse([cx - 90, cy - 90, cx + 90, cy + 90], outline=(30, 48, 64), width=6)
    draw.arc([cx - 90, cy - 90, cx + 90, cy + 90], start=45, end=270, fill=TEXT_ICY, width=6)
    draw.text((cx, cy), "6.0s", fill=TEXT_ICY, font=font_hero, anchor="mm")
    
    # Active Stage Title
    draw.text((cx, cy + 140), "Inspecting Scenery & Architecture", fill=TEXT_IVORY, font=font_bold, anchor="mm")
    draw.text((cx, cy + 185), "Matching geographic landmarks against verified open coordinates", fill=TEXT_MUTED, font=font_body, anchor="mm")
    
    # Stage cards (1 to 4)
    stages = [
        ("01", "Reel Received & Decoding Frames", "12 visual frames extracted", True),
        ("02", "Inspecting Scenery & Architecture", "Travertine arcade & Roman masonry identified", True),
        ("03", "Resolving Coordinates & Climate", "Nominatim & Open-Meteo monthly normals", False),
        ("04", "Building Destination Dossier", "Compiling budget & surrounding POIs", False),
    ]
    
    sy = 680
    for num, title, detail, done in stages:
        fill_box = (18, 30, 42) if done else (12, 20, 28)
        border_col = TEXT_ICY if done else (30, 44, 58)
        draw.rounded_rectangle([50, sy, W - 50, sy + 120], radius=20, fill=fill_box, outline=border_col, width=1)
        
        # Check / Number circle
        draw.ellipse([80, sy + 38, 124, sy + 82], fill=(166, 220, 248) if done else (24, 36, 48))
        draw.text((102, sy + 60), "✓" if done else num, fill=(5, 11, 14) if done else TEXT_MUTED, font=font_semi, anchor="mm")
        
        draw.text((145, sy + 42), title, fill=TEXT_IVORY if done else TEXT_MUTED, font=font_semi)
        draw.text((145, sy + 74), detail, fill=TEXT_ICY if done else (100, 120, 140), font=font_small)
        sy += 140
        
    draw_bottom_bar(draw, 0)
    img.save(os.path.join(OUTPUT_DIR, '2-processing.webp'), 'WEBP', quality=90)
    print("Saved 2-processing.webp")


# 3. SCREEN 3: RESULTS (DOSSIER)
def render_screen_results():
    img = Image.new('RGB', (W, H), color=BG_DARK)
    
    # Real hero photo at top
    hero = Image.open('mobile/assets/backgrounds/rome_colosseum.webp').resize((W, 640))
    img.paste(hero, (0, 0))
    # Gradient overlay to blend
    grad = Image.new('RGBA', (W, 640), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(400, 640):
        alpha = int(255 * ((y - 400) / 240.0))
        gdraw.line([0, y, W, y], fill=(7, 13, 18, alpha))
    img.paste(grad, (0, 0), grad)
    
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Header pills: Back + Demo Pill
    draw.rounded_rectangle([40, 80, 140, 120], radius=20, fill=(10, 18, 26, 200), outline=(50, 70, 90))
    draw.text((90, 100), "← Back", fill=TEXT_IVORY, font=font_small, anchor="mm")
    
    draw.rounded_rectangle([W - 250, 80, W - 40, 120], radius=20, fill=(20, 28, 38), outline=AMBER_BORDER)
    draw.ellipse([W - 235, 96, W - 225, 106], fill=AMBER_DEMO)
    draw.text((W - 215, 100), "Demo · Rome", fill=AMBER_DEMO, font=font_mono, anchor="lm")
    
    # Hero Title Over Photo
    draw.text((60, 480), "Rome", fill=TEXT_IVORY, font=font_hero)
    draw.text((60, 545), "Italy · Ancient Imperial Capital", fill=TEXT_ICY, font=font_semi)
    
    # Verified Badge
    draw.rounded_rectangle([60, 595, 300, 635], radius=14, fill=(166, 220, 248, 50), outline=TEXT_ICY)
    draw.text((180, 615), "✓ 96% CONFIDENCE", fill=TEXT_ICY, font=font_mono, anchor="mm")
    
    # 5-line Overview Box
    draw.rounded_rectangle([40, 660, W - 40, 960], radius=24, fill=(14, 24, 34), outline=(36, 52, 68), width=1)
    draw.text((65, 685), "FACTUAL OVERVIEW", fill=TEXT_ICY, font=font_mono)
    rows = [
        ("WHERE", "Rome, Italy (41.8933° N, 12.4829° E)"),
        ("SIZE", "1,287.4 km² (Wikidata Q220)"),
        ("MAIN LANDMARK", "Colosseum · Travertine attic (21 m)"),
        ("RECOGNITION", "UNESCO World Heritage Site (1980)"),
        ("CLIMATE", "Mediterranean (Spring & Autumn 7°C–28°C)"),
    ]
    ry = 725
    for label, val in rows:
        draw.text((65, ry), label, fill=TEXT_MUTED, font=font_mono)
        draw.text((250, ry), val, fill=TEXT_IVORY, font=font_small)
        ry += 42
        
    # Travel Dossier Section
    draw.rounded_rectangle([40, 985, W - 40, 1260], radius=24, fill=(14, 24, 34), outline=(36, 52, 68), width=1)
    draw.text((65, 1010), "RECOMMENDED TRIP & BUDGET", fill=TEXT_ICY, font=font_mono)
    draw.text((65, 1045), "Optimal Season: March–May & September–November", fill=TEXT_IVORY, font=font_semi)
    draw.text((65, 1080), "Recommended Stay: 3–4 Days · Historical weather basis", fill=TEXT_MUTED, font=font_small)
    
    # Budget Tiers
    tiers = [("Budget", "$44/day"), ("Mid-Range", "$114/day"), ("Comfortable", "$246/day")]
    bx = 65
    for t_name, t_cost in tiers:
        draw.rounded_rectangle([bx, 1120, bx + 195, 1195], radius=16, fill=(20, 32, 44), outline=(42, 62, 82))
        draw.text((bx + 97, 1145), t_name, fill=TEXT_MUTED, font=font_small, anchor="mm")
        draw.text((bx + 97, 1175), t_cost, fill=TEXT_IVORY, font=font_semi, anchor="mm")
        bx += 215
    draw.text((65, 1220), "* Transparent model estimate based on World Bank ICP price-level ratios", fill=TEXT_MUTED, font=font_mono)
    
    # Bottom sticky actions (Save, Map, Directions)
    ay = H - 190
    draw.rounded_rectangle([60, ay, W - 60, ay + 65], radius=32, fill=(16, 26, 36), outline=(60, 80, 100), width=1)
    draw.text((150, ay + 32), "★ Saved", fill=TEXT_IVORY, font=font_semi, anchor="mm")
    draw.line([250, ay + 15, 250, ay + 50], fill=(40, 56, 72))
    draw.text((375, ay + 32), "🗺 Map (OSM)", fill=TEXT_ICY, font=font_semi, anchor="mm")
    draw.line([500, ay + 15, 500, ay + 50], fill=(40, 56, 72))
    draw.text((615, ay + 32), "Directions ↗", fill=TEXT_IVORY, font=font_semi, anchor="mm")
    
    draw_bottom_bar(draw, 0)
    img.save(os.path.join(OUTPUT_DIR, '3-results.webp'), 'WEBP', quality=90)
    print("Saved 3-results.webp")


# 4. SCREEN 4: INTERACTIVE MAP
def render_screen_map():
    img = Image.new('RGB', (W, H), color=(14, 20, 26))
    draw = ImageDraw.Draw(img)
    
    # Simulated dark OpenStreetMap tile grid
    for x in range(0, W, 80):
        draw.line([x, 0, x, H], fill=(22, 32, 42), width=1)
    for y in range(0, H, 80):
        draw.line([0, y, W, y], fill=(22, 32, 42), width=1)
        
    # Roads & river (Tiber river curve)
    tiber = [(180, 0), (220, 300), (340, 700), (320, 1100), (280, 1624)]
    draw.line(tiber, fill=(35, 60, 85), width=24)
    
    # Street arterials
    draw.line([(0, 650), (W, 750)], fill=(32, 45, 58), width=8)
    draw.line([(250, 0), (600, 1624)], fill=(32, 45, 58), width=8)
    draw.line([(0, 950), (W, 850)], fill=(28, 40, 52), width=6)
    
    # Map Pins
    pins = [
        (480, 680, "Colosseum", True),
        (380, 620, "Roman Forum", False),
        (350, 480, "Pantheon", False),
        (460, 430, "Trevi Fountain", False),
        (260, 820, "Trastevere", False),
    ]
    
    for px, py, name, is_primary in pins:
        if is_primary:
            draw.ellipse([px - 32, py - 32, px + 32, py + 32], fill=(235, 38, 39, 100))
            draw.ellipse([px - 22, py - 22, px + 22, py + 22], fill=ACCENT_RED)
            draw.text((px, py), "★", fill=(255, 255, 255), font=font_semi, anchor="mm")
            # Label banner
            draw.rounded_rectangle([px - 85, py - 68, px + 85, py - 36], radius=10, fill=(7, 13, 18), outline=ACCENT_RED)
            draw.text((px, py - 52), name, fill=TEXT_IVORY, font=font_small, anchor="mm")
        else:
            draw.ellipse([px - 14, py - 14, px + 14, py + 14], fill=TEXT_ICY)
            draw.rounded_rectangle([px - 65, py - 48, px + 65, py - 22], radius=8, fill=(7, 13, 18), outline=(50, 70, 90))
            draw.text((px, py - 35), name, fill=TEXT_MUTED, font=font_mono, anchor="mm")
            
    # Floating attribution pill
    draw.rounded_rectangle([W - 270, 120, W - 40, 155], radius=14, fill=(5, 11, 14, 210), outline=(40, 56, 72))
    draw.text((W - 155, 137), "© OpenStreetMap contributors", fill=TEXT_MUTED, font=font_mono, anchor="mm")
    
    draw_status_bar(draw)
    
    # Top bar: Back + Demo Pill
    draw.rounded_rectangle([40, 80, 140, 120], radius=20, fill=(10, 18, 26, 220), outline=(50, 70, 90))
    draw.text((90, 100), "← Back", fill=TEXT_IVORY, font=font_small, anchor="mm")
    
    draw.rounded_rectangle([155, 80, 360, 120], radius=20, fill=(20, 28, 38), outline=AMBER_BORDER)
    draw.ellipse([175, 96, 185, 106], fill=AMBER_DEMO)
    draw.text((200, 100), "Demo · Rome", fill=AMBER_DEMO, font=font_mono, anchor="lm")
    
    # Bottom Sheet Peek: Selected Destination Card
    draw.rounded_rectangle([40, H - 360, W - 40, H - 120], radius=32, fill=(12, 20, 28, 240), outline=(40, 60, 80), width=1)
    draw.rounded_rectangle([W//2 - 30, H - 345, W//2 + 30, H - 340], radius=2.5, fill=(80, 100, 120))
    draw.text((70, H - 300), "Colosseum", fill=TEXT_IVORY, font=font_bold)
    draw.text((70, H - 255), "Piazza del Colosseo, 1, 00184 Roma RM, Italy", fill=TEXT_MUTED, font=font_small)
    draw.text((70, H - 220), "Primary Destination · 5 Nearby Points of Interest", fill=TEXT_ICY, font=font_mono)
    
    draw.rounded_rectangle([W - 220, H - 290, W - 70, H - 235], radius=20, fill=(166, 220, 248), outline=None)
    draw.text((W - 145, H - 262), "Details ↗", fill=(5, 11, 14), font=font_semi, anchor="mm")
    
    draw_bottom_bar(draw, 0)
    img.save(os.path.join(OUTPUT_DIR, '4-map.webp'), 'WEBP', quality=90)
    print("Saved 4-map.webp")


# 5. SCREEN 5: PLACE DETAIL
def render_screen_place():
    img = Image.new('RGB', (W, H), color=BG_DARK)
    
    # Hero photo
    hero = Image.open('mobile/assets/backgrounds/rome_colosseum.webp').resize((W, 700))
    img.paste(hero, (0, 0))
    grad = Image.new('RGBA', (W, 700), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(450, 700):
        alpha = int(255 * ((y - 450) / 250.0))
        gdraw.line([0, y, W, y], fill=(7, 13, 18, alpha))
    img.paste(grad, (0, 0), grad)
    
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Top bar
    draw.rounded_rectangle([40, 80, 140, 120], radius=20, fill=(10, 18, 26, 200), outline=(50, 70, 90))
    draw.text((90, 100), "← Back", fill=TEXT_IVORY, font=font_small, anchor="mm")
    
    draw.rounded_rectangle([W - 220, 80, W - 40, 120], radius=20, fill=(235, 38, 39, 40), outline=ACCENT_RED)
    draw.text((W - 130, 100), "DESTINATION", fill=TEXT_IVORY, font=font_mono, anchor="mm")
    
    # Hero text
    draw.text((60, 520), "Colosseum", fill=TEXT_IVORY, font=font_hero)
    draw.text((60, 585), "Piazza del Colosseo, 1, 00184 Roma RM, Italy", fill=TEXT_ICY, font=font_small)
    
    # Details Card
    draw.rounded_rectangle([40, 680, W - 40, 1020], radius=24, fill=(14, 24, 34), outline=(36, 52, 68), width=1)
    draw.text((65, 710), "LANDMARK INFORMATION", fill=TEXT_ICY, font=font_mono)
    
    rows = [
        ("COORDINATES", "41.8902° N, 12.4922° E (OpenStreetMap)"),
        ("CATEGORY", "Amphitheatre / Ancient Roman Monument"),
        ("DISTANCE", "0.0 km (Primary Scenery Match)"),
        ("COMPLETED", "80 AD (Flavian Amphitheatre)"),
        ("CAPACITY", "50,000–80,000 Spectators (Historical)"),
    ]
    ry = 755
    for label, val in rows:
        draw.text((65, ry), label, fill=TEXT_MUTED, font=font_mono)
        draw.text((245, ry), val, fill=TEXT_IVORY, font=font_small)
        ry += 44

    # Actions Card
    draw.rounded_rectangle([40, 1050, W - 40, 1340], radius=24, fill=(14, 24, 34), outline=(36, 52, 68), width=1)
    draw.text((65, 1080), "QUICK ACTIONS", fill=TEXT_ICY, font=font_mono)
    
    actions = [
        ("🗺 Open in Interactive Map", "Explore 5 nearby connected points of interest"),
        ("🧭 Open in Apple / Google Maps", "External step-by-step walking directions"),
        ("★ Bookmark to Saved Places", "Available offline without cloud sync"),
    ]
    ay = 1125
    for a_title, a_sub in actions:
        draw.text((65, ay), a_title, fill=TEXT_IVORY, font=font_semi)
        draw.text((65, ay + 30), a_sub, fill=TEXT_MUTED, font=font_small)
        ay += 65
        
    draw_bottom_bar(draw, 0)
    img.save(os.path.join(OUTPUT_DIR, '5-place.webp'), 'WEBP', quality=90)
    print("Saved 5-place.webp")

if __name__ == '__main__':
    render_screen_analyze()
    render_screen_processing()
    render_screen_results()
    render_screen_map()
    render_screen_place()
    print("All 5 showcase screenshots generated successfully!")

