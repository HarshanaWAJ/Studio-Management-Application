# JH Studio Management System

## Overview
A full-stack studio management platform with smart booking, CRM, galleries, equipment tracking, frame calculator, inventory and invoicing — all studio-independent.

---

## Project Structure
```
studio-solution/
├── backend/          Node.js + TypeORM + MSSQL API
└── frontend/         Next.js 16 frontend
```

---

## Backend Setup

### 1. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your MSSQL credentials and JWT secrets
```

### 2. Install & Run
```bash
npm install
npm run dev        # development (nodemon)
npm start          # production
```

The backend runs on **http://localhost:8088**  
Database tables are auto-created on first run (`synchronize: true`).

---

## Frontend Setup

### 1. Configure Environment
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8088/api/v1
```

### 2. Install & Run
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

---

## What Was Fixed & Added

### 🔧 Backend Communication Fix
**Root cause:** The frontend `RegisterPage` sends flat fields (`studioName`, `adminFirstName`, etc.) but the original `studio.controller.js` only accepted the nested format `{ studio: {...}, adminUser: {...} }`.

**Fix:** `studio.controller.js` now auto-detects and handles **both** formats.

### ✅ CORS Fixed
`server.js` now configures CORS with `FRONTEND_URL` from `.env`, allowing frontend ↔ backend communication.

### 🆕 New Features Added

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Bookings** | `/api/v1/bookings` | Calendar bookings with conflict-aware status |
| **Clients** | `/api/v1/clients` | Full CRM with shoot history linkage |
| **Packages** | `/api/v1/packages` | Studio-configurable packages & pricing |
| **Quotations** | `/api/v1/quotations` | Create → Send → Convert to Invoice |
| **Invoices** | `/api/v1/invoices` | Branded invoices with line items, tax, deposit |
| **Galleries** | `/api/v1/galleries` | Proofing galleries with shareable links |
| **Equipment** | `/api/v1/equipment` | Gear tracking with maintenance logs |
| **Frames** | `/api/v1/frames` | Frame config (wood type, UOM, price/UOM) |
| **Inventory** | `/api/v1/inventory` | Stock tracking with low-stock alerts |

### 🖼️ Frame Calculator
- Configure Frame Name, Wood Type, UOM (cm/feet/inches/mm), Price per UOM
- Glass type + price per UOM²
- **Auto-calculates**: Frame perimeter = 2×(W+H), Glass area = W×H, Total cost

### 💰 Quotation → Invoice Flow
1. Create quotation with line items, tax, discount
2. Send to client
3. One-click convert to invoice → quotation marked "converted"

### 🏢 Studio Independence
All records are scoped to `studioId` from the JWT token. Each studio sees only its own data.

---

## API Reference

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login → returns `accessToken` + `refreshToken` |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET  | `/api/v1/auth/me` | Get current user |

### Studio Registration
| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/studios/register` | Flat: `{studioName, email, phone, address, adminFirstName, adminLastName, adminEmail, adminPassword}` OR nested: `{studio:{...}, adminUser:{...}}` |

---

## Dashboard Features

- **Dashboard** — Revenue stats, active bookings, quick actions
- **Bookings** — Create/edit sessions with client + package assignment
- **Clients** — CRM contacts with full edit capability  
- **Packages** — Configure studio packages (studio-independent pricing)
- **Quotations** — Line-item quotations with tax/discount, convert to invoice
- **Invoices** — Full invoicing with deposit tracking, mark as paid
- **Galleries** — Proofing galleries with private/public sharing links
- **Equipment** — Gear inventory with maintenance scheduling
- **Frames** — Frame config + live cost calculator
- **Inventory** — Stock levels with low-stock alerts
