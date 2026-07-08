# Phase 3 — AI-Assisted Website Builder (per studio)

## Setup
Uses the same `ANTHROPIC_API_KEY` from Phase 2 — nothing new to configure if that's already set. No new packages needed.

## What it does
Every studio gets **Dashboard → Website**, a builder that:

1. **Generates a full website draft with one click.** The AI reads the studio's name, category, description and active packages, then writes hero copy, an about paragraph, a services intro and a contact message — and picks the best-fit **theme** from 6 curated, professionally-composed presets (colors + font pairing), rather than generating raw CSS. This keeps the output visually polished no matter what the AI writes.
2. **Live preview panel** — updates as you type/pick a theme, so you see the site before publishing.
3. **Everything is editable** — hero text, about text, services intro, contact message, SEO meta description, social links (Instagram/Facebook/WhatsApp), and the URL slug.
4. **Publish toggle** — the site is only public once switched on.
5. **The public site itself** (`/site/your-slug`) is a genuinely rich single-page site: sticky nav, animated hero with radial gradient, about section, a services grid pulled live from the studio's actual packages, a portfolio grid pulled from public galleries, and a working contact form.
6. **Contact form → real notification.** Submissions email the studio admin (via the Gmail SMTP setup from Phase 1) and are saved as a lead in the studio's Clients list, so inquiries don't get lost.

## Theme presets
`Amber Noir`, `Blush Editorial`, `Midnight Cinema`, `Sage Minimal`, `Sunset Warm`, `Mono Classic` — each has a curated color palette + font pairing + a "mood" description the AI uses to match the studio's category (e.g. wedding studios lean toward Amber Noir / Blush Editorial, videography toward Midnight Cinema).

## New backend files
- `src/models/Website.js` (new entity — one row per studio)
- `src/config/themes.js` (new — the 6 curated presets)
- `src/services/website.service.js` (new — AI generation, CRUD, public aggregation, inquiry handling)
- `src/controllers/website.controller.js`, `src/routes/website.route.js` (authenticated builder API)
- `src/routes/public-website.route.js` (new — **no auth**, powers the live public sites)
- `src/models/Studio.js` — added `category` and `description` fields (feed the AI + can be edited from the Website page)
- `src/services/email.service.js` — added `sendWebsiteInquiryEmail`
- `src/config/data-source.js`, `src/server.js` — registered the new entity/routes

## New frontend files
- `app/dashboard/website/page.tsx` — the builder (generate, edit, theme picker, live preview, publish)
- `app/site/[slug]/page.tsx` + `components/ui/PublicSitePage.tsx` — the actual public studio website
- `lib/themes.ts` — theme presets mirrored for rendering
- `app/dashboard/layout.tsx` — added "Website" nav item, gated by the `website:manage` permission

## API summary
- `GET/PUT /api/v1/website` — the studio's own config (authenticated)
- `POST /api/v1/website/generate` — AI (re)generates the copy + theme
- `GET /api/v1/website/themes` — list presets
- `GET /api/v1/public/website/:slug` — public site data (no auth)
- `POST /api/v1/public/website/:slug/inquiry` — public contact form (no auth)

## Notes
- Portfolio images come from **public** galleries (`isPublic: true`) — nothing private is ever exposed on the site.
- If a studio hasn't generated/published a site yet, `/site/their-slug` shows a clean "not available" state instead of erroring.
