# telecard
# 🚀 PROJECT TELECARD: TECHNICAL HANDOVER (V1.2)
> **Status:** Ready for Developer Handover  
> **Last Updated:** April 2026  
> **Version:** 1.2 — All architectural and design decisions locked.

---

## 1. PRODUCT VISION

TeleCard is a dual-mode Telegram Mini App (TMA) designed for the Cambodian market. It solves two problems:

1. **Professional:** High-speed digital networking for executives — replacing physical business cards.
2. **Seller:** Lean commerce for small merchants — handling orders and GPS-assisted logistics.

**Key Differentiator:** The "Smart Wallpaper" (lock-screen QR code) and direct integration with Telegram's native features (GPS sharing, phone verification).

**Core Architecture:** Two modes, one product. Single bot, single database, single codebase. The mode toggle changes only what the profile renders. All infrastructure is shared.

---

## 2. THE TECH STACK (LOCKED)

| Layer | Technology |
|---|---|
| Frontend | React / Next.js with Tailwind CSS (optimized for TMA environment) |
| Backend | Node.js with Telegraf.js for bot logic |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Image Processing | `sharp` (Node.js) for wallpaper compositing |
| QR Generation | `qrcode` (npm) |

### Design Tokens (Locked)

| Token | Value |
|---|---|
| Primary | Prussian Blue `#002D62` |
| Accent | Oxblood Maroon `#7B001C` |
| Background | Slate White |
| Font | **Inter** (all UI — display, body, labels) |

> **Font decision rationale:** TeleCard is a professional, transactional product. Inter is clean, neutral, and internationally legible. Cormorant Garamond is reserved for Malis Kitchen (warm, cultural). These are separate brand identities.

---

## 3. DOMAIN & PROFILE URL (FROZEN)

**Live domain:** `telenamecard.vercel.app`

**Profile URL structure:** `telenamecard.vercel.app/[username]`

> ⚠️ **This URL is frozen.** It is embedded in every user's QR code and printed on every Smart Wallpaper. It must never change post-launch. Any future custom domain migration requires a permanent redirect from this URL.

---

## 4. CORE FEATURES & LOGIC

### 🔵 A. The "Mali" Bot — Onboarding & Interaction

**State Machine Onboarding (linear, no branching):**
1. Ask full name
2. Ask mode: Professional or Seller
3. Request phone verification via Telegram native contact share

**Smart Wallpaper Generator:**
- User uploads a professional photo
- Bot composites the photo against the locked template (see Section 6)
- Output: high-res image returned directly in Telegram chat, optimized for smartphone lock screens

### 🟢 B. The Shared Profile (TMA Webview)

**Professional Mode renders:**
- Full name, job title, bio
- Social links
- "Save vCard" button (downloads `.vcf` file)

**Seller Mode renders:**
- Product catalog with name, price, stock status
- "Buy Now" button per product

**Both modes share:**
- QR code display
- "Share my card" button (copies profile URL to clipboard)

### 📍 C. The Verified Logistics Engine (GPS)

**Checkout flow:**
1. Buyer clicks "Buy Now"
2. Bot triggers native Telegram Location Request
3. Order is recorded with GPS coordinates + phone number + Telegram profile
4. Seller receives notification with buyer's Telegram profile link and a direct Google Maps link

**GPS decline fallback:**
- Order is still recorded with `location_verified: false`
- Seller dashboard flags the order clearly
- Admin or seller calls the buyer to confirm delivery location manually
- No buyer-facing error — flow continues smoothly

### 📤 D. Trust & Portability — The CSV Layer

**Command:** `/export`

**Logic:** Pulls all interactions and orders from the database for the requesting user and returns a downloadable CSV file in Telegram chat.

**Purpose:** The "anti-lock-in" promise. Users own their data.

---

## 5. DATABASE SCHEMA (LOCKED)

```sql
-- Identity Core
Table users {
  id              uuid          [primary key]
  telegram_id     bigint        [unique, not null]
  full_name       string
  username        string        [unique] -- used in profile URL
  mode            enum('PROFESSIONAL', 'SELLER')
  phone           string        -- captured via Telegram contact share
  created_at      timestamp
}

-- Branding & Profile Data
Table profiles {
  user_id         uuid          [ref: > users.id]
  job_title       string        -- Professional mode
  bio             string
  avatar_url      string        -- stored in Supabase Storage
  qr_code_url     string        -- stored in Supabase Storage
  wallpaper_url   string        -- stored in Supabase Storage
  social_links    jsonb         -- { linkedin, facebook, telegram, website }
}

-- Seller: Product Catalog
Table products {
  id              uuid          [primary key]
  seller_id       uuid          [ref: > users.id]
  name            string
  price           decimal
  stock_status    boolean       -- true = available, false = sold out
  created_at      timestamp
}

-- Unified Interactions & Orders
Table interactions {
  id              uuid          [primary key]
  owner_id        uuid          [ref: > users.id]
  visitor_info    jsonb         -- { telegram_id, phone, name, timestamp }
  gps_coordinates jsonb         -- { lat, lng } — nullable
  location_verified boolean     [default: false]
  type            enum('SCAN', 'ORDER')
  product_id      uuid          [ref: > products.id, nullable] -- ORDER type only
  created_at      timestamp
}
```

---

## 6. SMART WALLPAPER TEMPLATE SPEC (LOCKED)

**Library:** `sharp` (Node.js) — serverless-compatible, runs on Vercel. No queue needed.

**Canvas:** 1080 × 2340px at 72dpi. Full-bleed on modern Android and iPhone screens.

### Zone Layout (top to bottom)

| Zone | Height | Description |
|---|---|---|
| Header | 15% (351px) | Solid Prussian Blue `#002D62`. "TeleCard" brand name centered, white Inter, 48px bold. |
| Photo | 60% (1404px) | User photo with `cover` crop, centered on face. Bottom third overlaid with semi-transparent Prussian Blue gradient at 30% opacity. |
| Action | 25% (585px) | Solid `#002D62` background. Three elements stacked vertically (see below). |

### Action Zone Elements (stacked, vertically centered)

1. **Full name** — white, Inter Bold, 52px
2. **Job title or seller tagline** — Oxblood Maroon `#7B001C`, Inter Regular, 32px
3. **QR code** — 280 × 280px, white background, 16px padding. Error correction level: **H** (highest — survives screen glare and partial obstruction). URL text `telenamecard.vercel.app/[username]` beneath QR in light grey, Inter Regular, 18px.

### Implementation Notes

- Use `qrcode` npm library with `errorCorrectionLevel: 'H'` and `quiet zone: 4 modules`
- QR output: PNG buffer → composite into wallpaper via `sharp`
- Photo compositing: resize to fill zone with `sharp` cover mode, then layer gradient and action zone
- Total generation time target: under 1 second on Vercel serverless

---

## 7. DEVELOPER INSTRUCTIONS — THE MUST-HAVES

1. **Friction is the enemy.** No password login. Authenticate exclusively via `Telegram.WebApp.initData`. Zero extra steps.

2. **Build the wallpaper generator first.** This is the demo-able moment. Get the QR-stamped wallpaper working in Week 1. Everything else is invisible until someone holds their phone up and scans a lock screen.

3. **Visual depth.** Use Prussian Blue shadow effects throughout the TMA. It must feel enterprise-grade, not generic SaaS.

4. **Low latency.** Wallpaper generation and GPS response must be near-instant (sub-1-second targets).

5. **Operational simplicity.** The seller order dashboard is a simple list with a `location_verified` flag indicator. Do not build a CRM. Phase 1 only.

6. **GPS flag, not GPS gate.** If a buyer declines location sharing, record the order anyway with `location_verified: false`. Never block a transaction. Flag it for human follow-up.

---

## 8. PHASE ROADMAP

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Smart Wallpaper, Profile TMA (both modes), GPS order flow, CSV export, Bot onboarding | **Build now** |
| **Phase 2** | Seller dashboard enhancements, analytics, menu/product editor | Designed, not built |
| **Phase 3** | AI-powered profile suggestions via Anthropic API | Designed, not built |

---

## 9. FOUNDER SIGN-OFF CHECKLIST git remote set-url origin

All decisions below are locked. Developer does not need to revisit these.

- [x] Domain frozen: `telenamecard.vercel.app/[username]`
- [x] Font locked: Inter (all UI)
- [x] Brand colors locked: Prussian Blue `#002D62`, Oxblood Maroon `#7B001C`, Slate White
- [x] Wallpaper template spec locked (1080×2340px, three zones, `sharp` library)
- [x] QR spec locked (error correction H, `qrcode` npm)
- [x] GPS fallback locked (`location_verified` flag, human follow-up)
- [x] Two modes, one core architecture confirmed
- [x] Stack locked: Next.js + Telegraf.js + Supabase + Vercel
- [x] Database schema locked (8 fields across 4 tables)
- [x] Phase 1 scope locked

**Estimated MVP build time:** 2–3 weeks for an experienced TMA developer.

---

*TeleCard PRD V1.2 — Prepared for developer handover. Do not modify without founder sign-off.* and supabase TElecard2026 pass 

