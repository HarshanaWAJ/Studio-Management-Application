# Phase 1 — Staff Management, RBAC, Email Verification, Password Reset & Gmail SMTP

## Setup

1. **Backend**: `cd backend && npm install` (adds `nodemailer`).
2. Copy `.env.example` → `.env` and fill in the new email section:
   ```
   EMAIL_USER=your-studio@gmail.com
   EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # Google Account → Security → App Passwords (requires 2FA enabled)
   EMAIL_FROM_NAME=JH Studio
   REQUIRE_EMAIL_VERIFICATION=false          # set "true" to hard-block login until verified
   ```
   If `EMAIL_USER`/`EMAIL_APP_PASSWORD` are left blank, emails are logged to the server console instead of sent — handy for local dev without real SMTP.
3. Restart the backend — TypeORM `synchronize` will add the new `User` columns automatically.
4. **Frontend**: `cd frontend && npm install && npm run dev` — no new packages needed.

## What was built

### Staff Management + Role-Based Access Control
- New `Staff` module (`/dashboard/staff`): invite staff by email, assign a role, edit HR profile fields (title, department, employee ID, hire date, phone), suspend/reactivate, remove.
- 8 built-in roles (`super_admin`, `studio_admin`, `manager`, `receptionist`, `photographer`, `editor`, `accountant`, `staff`), each with a sensible default permission set — see `backend/src/config/permissions.js`.
- Per-staff **permission overrides** (grant/revoke individual permissions on top of their role) via the Permissions panel in the Staff page.
- New `requirePermission(...)` middleware protecting routes at a fine-grained level (e.g. `bookings:manage`, `staff:invite`) in addition to the existing role check.
- Invited staff get a "set your password" email instead of a temp password being shared manually.

### Email Verification & Password Reset
- New studio admins get a verification email on registration.
- `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password` pages added, matching the existing dark/glassmorphism auth design.
- Login shows a "Resend verification email" link when blocked for an unverified account (only enforced if `REQUIRE_EMAIL_VERIFICATION=true`).
- Staff invite links reuse the same reset-password flow (`?invite=1` shows "Activate Account" copy).

### Notifications & Booking Confirmation Emails
- Booking creation/confirmation now emails the client a confirmation; status changes (cancelled/completed/etc.) send an update email.
- All templated emails live in `backend/src/services/email.service.js` — reusable for future notification types (reminders, staff invites, welcome emails).

### Gmail SMTP (free)
- `email.service.js` uses `nodemailer`'s built-in `gmail` transport — no paid provider required. Needs a Google **App Password**, not the account's normal password.

## New/changed backend files
- `src/config/permissions.js` (new)
- `src/services/email.service.js` (new)
- `src/services/staff.service.js`, `src/controllers/staff.controller.js`, `src/routes/staff.route.js` (new)
- `src/controllers/booking.controller.js` (new — replaces generic CRUD for bookings so confirmation emails can fire)
- `src/models/User.js` — added HR/RBAC/verification/reset-token columns
- `src/services/auth.service.js` — rewritten with verification + reset flows, permission-aware JWTs
- `src/controllers/auth.controller.js`, `src/routes/auth.route.js` — new endpoints
- `src/services/studio.service.js` — sends verification/welcome email on registration
- `src/middleware/auth.middleware.js` — added `requirePermission`
- `src/server.js` — mounts `/api/v1/staff`
- `.env.example` / `.env` — new email vars

## New/changed frontend files
- `app/dashboard/staff/page.tsx` (new)
- `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`, `app/auth/verify-email/page.tsx` (new)
- `components/ui/AuthShared.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `VerifyEmailPage.tsx` (new)
- `components/ui/LoginPage.tsx` — wired "Forgot password?" link, resend-verification prompt on error
- `components/ui/RegisterPage.tsx` — success copy now mentions the verification email
- `app/dashboard/layout.tsx` — added "Staff" nav item, gated by the `staff:view` permission

## Notes / follow-ups
- Not yet run against a live MSSQL instance in this environment — please run `npm install` + start the backend against your DB to let TypeORM sync the new `User` columns.
- Next up (Phase 2): AI-assisted booking; Phase 3: AI website builder per studio. Let me know when you're ready for either.
