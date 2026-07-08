# Phase 2 — Advanced AI-Assisted Booking

## Setup
1. Get an API key from https://console.anthropic.com
2. In `backend/.env`, set:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-5     # change if your account uses a different model string
   ```
3. Restart the backend. If the key isn't set, `/dashboard/bookings` still works normally — the AI panel will just return a clear "not configured" error when used, rather than breaking anything.

## What it does
Click **"AI Assist Booking"** on the Bookings page and type something like:

> "Wedding shoot for Nimal Perera next Saturday at 2pm, 3 hours, Premium package"

The assistant will:
1. **Parse the request** into a structured draft — title, client, package, staff, date/time, duration — resolving relative dates ("next Saturday", "tomorrow") against today's date.
2. **Match against real records** — it looks for an existing client/package/staff member by name instead of guessing IDs blindly, and tells you if it couldn't find a confident match.
3. **Check for conflicts** — studio-wide and (if a staff member was matched) staff-specific double-booking checks against existing bookings.
4. **Suggest alternative slots** if there's a conflict — scans the next 7 days of business hours (9am–7pm, 30-min increments) for the nearest free slots and lets you apply one with a click.
5. **Hand off to the normal booking form** — nothing is auto-created. "Use This Draft" opens the existing New Booking modal pre-filled, so a human always reviews and confirms before it's saved.

It never silently invents a client — if it can't match one, it flags this so you're not left guessing.

## New backend endpoints (`/api/v1/ai`)
- `GET  /status` — whether AI is configured
- `POST /parse-booking` `{ text }` — the main assistant call described above
- `POST /suggest-slots` `{ date, durationMinutes, assignedStaffId? }` — standalone slot finder (no free text)
- `POST /recommend-package` `{ clientId?, text }` — AI suggests the best-fit package for a client/request
- `POST /check-conflicts` `{ startTime, endTime, assignedStaffId?, excludeBookingId? }` — raw conflict check, reusable elsewhere (e.g. the manual booking form)

All are gated by the same RBAC permissions as regular bookings (`bookings:view` / `bookings:manage`).

## New/changed files
- `backend/src/config/ai.js` (new) — Anthropic Messages API wrapper
- `backend/src/services/booking-ai.service.js` (new) — parsing, matching, conflict detection, slot suggestion
- `backend/src/controllers/ai.controller.js`, `backend/src/routes/ai.route.js` (new)
- `backend/src/models/Booking.js` — added optional `assignedStaffId` for staff-specific conflict checks
- `backend/src/server.js` — mounts `/api/v1/ai`
- `frontend/components/ui/AiBookingAssistant.tsx` (new)
- `frontend/app/dashboard/bookings/page.tsx` — "AI Assist Booking" toggle, wired to prefill the booking modal

## Notes
- The package recommendation endpoint (`/recommend-package`) is built and ready but not yet wired into a UI — happy to add a "Suggest Package" button in the booking form if useful.
- Business hours (9am–7pm) and slot step (30 min) are hardcoded in `booking-ai.service.js` for now — worth exposing as a studio setting once Studio/Room management (a later phase) is built.
