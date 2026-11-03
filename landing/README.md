# VAMO Showcase Landing Page

A high-performance, dark-aesthetic showcase landing page for VAMO built with **Next.js (App Router) + Tailwind CSS**, statically exported for free hosting on **Vercel** or any static host.

---

## Quick Start

```bash
# 1. Navigate to the landing directory
cd landing

# 2. Run local development server
npm run dev

# 3. Test static build & export (generates out/)
npm run build
```

---

## 1. Adding / Updating the Demo Video

1. **Video file**: Place your screen recording or showcase MP4 at:
   ```
   landing/public/demo.mp4
   ```
   - Recommended specs: H.264, 1080p or 720p, 30fps, 10-30 seconds, optimized for web (< 15MB).
2. **Video poster**: Place a high-resolution preview frame at:
   ```
   landing/public/demo-poster.webp
   ```
   - Recommended specs: 1920x1080 or 1280x720 WebP, <= 250KB.
3. The video player in `landing/components/DemoVideoSection.tsx` is lazy-loaded with `IntersectionObserver` so it never degrades initial page load performance or Lighthouse scores.

---

## 2. Adding / Updating Phone Screenshots

Place five portrait mobile screenshots in:
```
landing/public/shots/
├── 1-analyze.webp      # Analyze input screen (Drop Reel Link)
├── 2-processing.webp   # In-flight vision & scenery analysis animation
├── 3-results.webp      # Completed destination dossier & travel intelligence
├── 4-map.webp          # Interactive OpenStreetMap exploration
└── 5-place.webp        # Place detail inspection
```
- **Recommended format**: WebP or PNG.
- **Aspect ratio**: 9:19.5 (Standard iPhone aspect ratio, e.g., 750x1624 or 1170x2532).
- The screenshots are wrapped automatically in responsive CSS titanium phone frames with dynamic island cutouts.

---

## 3. Configuring the Waitlist

The landing page features a zero-backend waitlist form with client-side email validation and no email logging. It natively supports **Formspree**, **Google Forms**, and generic form webhooks (e.g., Tally).

If no waitlist environment variable is configured, the form displays a clear error informing you that configuration is required.

Create a `.env.local` file inside `landing/`:

### Option A: Formspree (Recommended)
1. Create a free form endpoint at [formspree.io](https://formspree.io).
2. Copy your form ID / submission URL.
3. Add to `landing/.env.local`:
   ```env
   NEXT_PUBLIC_FORMSPREE_URL=https://formspree.io/f/mblrgpzw
   ```
The form sends a clean JSON POST `{ email }` with `Accept: application/json` headers.

### Option B: Google Forms
1. Create a Google Form with a single "Email" short answer field.
2. Click the three dots (top right) -> **Get pre-filled link**.
3. Type a sample email (e.g., `test@example.com`) and click **Get link**.
4. Inspect the copied link:
   - Form URL: `https://docs.google.com/forms/d/e/1FAIpQLSc.../formResponse` (replace `/viewform` with `/formResponse`).
   - Entry ID: Look for `entry.123456789=test%40example.com`. The ID is `entry.123456789` (or just `123456789`).
5. Add to `landing/.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_FORMS_URL=https://docs.google.com/forms/d/e/1FAIpQLSc.../formResponse
   NEXT_PUBLIC_GOOGLE_FORMS_ENTRY_ID=entry.123456789
   ```
The form submits with `mode: 'no-cors'` over URL-encoded form data.

### Option C: Generic / Tally Webhook
```env
NEXT_PUBLIC_WAITLIST_URL=https://tally.so/r/your-tally-id
```

### GitHub and Contact Links (Optional)
```env
NEXT_PUBLIC_GITHUB_URL=https://github.com/pradnesh-deshmukh/travel-ai
NEXT_PUBLIC_CONTACT_EMAIL=inquiries@vamo.travel
```

---

## 4. Asset Verification & Production Guard

The repository verifies all visual assets before building:
- **In Development (`npm run dev`)**: Assets are verified on startup and during builds.
- **In Production (`VERCEL_ENV=production` or `npm run verify-assets -- --production`)**: The build strictly **FAILS** if any of the five screenshots in `landing/public/shots/` or `landing/public/demo.mp4` are missing or below threshold file size.

### Running Asset Verification:
```bash
# Check current asset status (warns in dev, fails in prod):
npm run verify-assets

# Test strict production check locally:
npm run verify-assets -- --production
```

---

## 5. Deploying to Vercel (Free Tier)

This landing page is configured for static export (`output: 'export'`), producing a zero-maintenance `out/` directory.

### Method 1: Vercel CLI
```bash
# From landing/ directory:
npx vercel
```
- Set **Root Directory** to `landing`
- Framework Preset: **Next.js**
- Add Environment Variables:
  - Formspree: `NEXT_PUBLIC_FORMSPREE_URL`
  - Or Google Forms: `NEXT_PUBLIC_GOOGLE_FORMS_URL` & `NEXT_PUBLIC_GOOGLE_FORMS_ENTRY_ID`

### Method 2: GitHub Integration
1. Push the repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In **Project Settings**:
   - **Root Directory**: `landing`
   - **Build Command**: `next build`
   - **Output Directory**: `out`
4. In **Environment Variables**, add your waitlist variables.
5. Click **Deploy**.

---

## 6. Updating the 22 Hero Photos

The hero section features a background slideshow of 22 travel photos.

### Requirements:
- Format: **WebP**
- Maximum file size: **<= 200KB each**
- Location: `landing/public/photos/`

### Automated Optimization Script:
If you add new photos in JPEG or PNG, run the following command to automatically scale and compress them to <= 200KB:
```bash
python -c "
import os
from PIL import Image

src = 'homepage img'
dest = 'landing/public/photos'
for f in os.listdir(src):
    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        im = Image.open(os.path.join(src, f)).convert('RGB')
        out_name = f.split('.')[0].lower().replace(' ', '-') + '.webp'
        im.save(os.path.join(dest, out_name), 'WEBP', quality=82, method=6)
"
```

To update captions or locations, edit `landing/lib/photos.ts`.

---

## 7. QR Code Route & Generator

- View the live QR code in the browser at `/qr` (e.g. `http://localhost:3000/qr` or `https://your-domain.vercel.app/qr`).
- Print an ASCII QR code in your terminal and generate `landing/public/qr.svg`:
  ```bash
  npm run qr
  # or with a custom URL:
  node scripts/print-qr.js https://my-custom-url.com
  ```
- Uses a **zero-dependency pure TypeScript/JavaScript QR matrix generator**.

