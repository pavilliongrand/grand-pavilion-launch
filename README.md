# Grand Pavilion Sports Turf — Booking App

Production booking system for Grand Pavilion Sports Turf, Palakkad, Kerala.

**Docs:**  
[HANDOVER.md](HANDOVER.md) — Client handover overview  
[docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — How to use the admin panel  
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Full technical deployment & setup guide

## Stack

- **Frontend**: React + TypeScript + Vite, Tailwind CSS, shadcn/ui
- **Backend**: Vercel Serverless Functions (`/api/`)
- **Auth**: Firebase Phone OTP (customers) + HMAC-SHA256 JWT (admin)
- **Database**: Google Calendar API (bookings/blocked slots) + Firestore (pricing config)

## Env Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_*` | Firebase client config (phone OTP) |
| `GOOGLE_CALENDAR_ID` | Calendar ID used as booking store |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service account private key (RSA) |
| `ADMIN_PASSWORD` | Admin panel password — **use a strong random string** |
| `ALLOWED_ORIGIN` | CORS allowed origin (production URL) |

## Dev

```bash
npm install
npm run dev       # http://localhost:8080
npm run build     # production build
```

## Deploy

Push to `main` — Vercel auto-deploys. Set all env vars in Vercel Dashboard → Project Settings → Environment Variables.

## Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/booking` | Customer booking flow (sport → date → slot → OTP → confirm) |
| `/admin` | Admin panel (password protected) |

## Admin Panel Features

- View all upcoming bookings
- Block unblock individual slots or full days
- Configure day night pricing per sport
- Toggle sport availability

## Sports

| Sport | Slots | Notes |
|---|---|---|
| Cricket | 1-hour slots | Day rate before 6 PM, night rate after |
| Football (7-a-side) | 1-hour slots | Day/night pricing |
| Football (11-a-side) | 1-hour slots | Premium pricing |

## Security Notes

- Admin password must be a strong random string — never use a simple password in production
- `.env` is gitignored — never commit it
- Firebase API key is public (by design) — secured via Firebase Auth rules
- Google service account key is server-side only (never sent to browser)

