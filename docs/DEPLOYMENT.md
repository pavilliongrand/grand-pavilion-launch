# Deployment & Setup Guide

Technical reference for developers maintaining the Grand Pavilion Sports Turf booking system.

---

## Architecture

```
User browser
    │
    ├── GET /           → Vite SPA (dist/index.html)
    ├── GET /booking    → Vite SPA (dist/index.html)
    ├── GET /admin      → Vite SPA (dist/index.html)
    │
    └── /api/*          → Vercel Serverless Functions (TypeScript)
            ├── /api/slots          GET  — fetch available slots for a date/sport
            ├── /api/book           POST — create a booking (requires Firebase ID token)
            ├── /api/pricing        GET  — fetch current pricing config
            ├── /api/pricing        POST — update pricing (requires admin JWT)
            ├── /api/bookings       GET  — deprecated, returns 410
            ├── /api/admin/login    POST — validate password, return JWT
            ├── /api/admin/bookings GET  — list all bookings (requires admin JWT)
            ├── /api/admin/bookings PATCH— update booking status (requires admin JWT)
            ├── /api/admin/block-slots    POST   — block slots (requires admin JWT)
            ├── /api/admin/unblock-slots  DELETE — unblock slots (requires admin JWT)
            └── /api/admin/blocked-slots  GET    — list blocked slots (requires admin JWT)
```

**Data stores:**
- **Google Calendar** — all bookings and blocked slots stored as Calendar events
- **Firestore** — single document `config/pricing` stores pricing configuration
- **Firebase Auth** — customer phone OTP verification

**Auth:**
- Customers: Firebase Phone Auth → `signInWithPhoneNumber` → ID token sent with booking POST
- Admin: HMAC-SHA256 JWT signed with `ADMIN_PASSWORD`, 8-hour expiry, verified server-side

---

## Vercel Setup

### 1. Import project

```bash
vercel link   # links local folder to Vercel project
vercel        # deploy to preview
vercel --prod # deploy to production
```

Or push to `main` branch — Vercel auto-deploys via GitHub integration.

### 2. Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables** for `Production` (and optionally `Preview`):

| Variable | Description | Example |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `grandpavillion-647ac.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `grandpavillion-647ac` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `grandpavillion-647ac.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456:web:abc123` |
| `GOOGLE_CALENDAR_ID` | Google Calendar ID used as booking DB | `abc123@gmail.com` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | `booking@project.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | RSA private key (with `\n` newlines) | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `ADMIN_PASSWORD` | Admin panel password — **must be strong** | `GrandPav!l10n#2026$Secure` |
| `ALLOWED_ORIGIN` | CORS allowed origin | `https://grandpavilion.in` |

> `VITE_*` variables are baked into the frontend bundle at build time. All other variables are server-side only.

### 3. vercel.json routing

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

All `/api/*` requests go to serverless functions. Everything else serves `index.html` for SPA routing.

---

## Google Calendar Setup

### Service Account

1. In [Google Cloud Console](https://console.cloud.google.com), create a **Service Account**
2. Grant it no special roles (Calendar API permissions are set on the calendar itself)
3. Create a **JSON key** for the service account
4. Copy `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
5. Copy `private_key` (the full RSA block including `-----BEGIN PRIVATE KEY-----`) → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - The key must have literal `\n` characters (not actual newlines) when stored in Vercel env vars
   - The backend code does `.replace(/\\n/g, '\n')` to restore real newlines

### Calendar permissions

1. Open [Google Calendar](https://calendar.google.com)
2. Find the calendar used for bookings → **Settings** → **Share with specific people**
3. Add the service account email with **Make changes to events** permission
4. Copy the **Calendar ID** (shown in calendar settings) → `GOOGLE_CALENDAR_ID`

### How events are stored

- **Customer bookings**: Title = `[Cricket] Customer Name`, description contains phone, amount, slot IDs
- **Blocked slots**: Title = `BLOCKED: [Sport] Reason`, extended properties store slot metadata
- The app queries events for the date range and parses them to determine availability

---

## Firebase Setup

### Project

Firebase project: `grandpavillion-647ac` (already set up)

### Phone Auth

1. Firebase Console → **Authentication** → **Sign-in method** → **Phone** → Enable
2. Add the production domain to **Authorised domains**: `your-domain.com`
   - Also add `localhost` for local dev

### Firestore

1. Firebase Console → **Firestore Database** → Create database (production mode)
2. The app auto-creates the `config/pricing` document on first run
3. Firestore rules — set to allow only server-side SDK access:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
The app uses **Firebase Admin SDK** on the server, which bypasses Firestore rules entirely.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Fill in .env with real values

# Run dev server (frontend on :8080)
npm run dev

# Test API routes locally
vercel dev    # runs both frontend and serverless functions together
```

> `npm run dev` only runs the Vite frontend. To test the API routes locally, use `vercel dev` which emulates the Vercel serverless environment.

---

## Build

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

Build output: `dist/` — 1611 modules, ~453 KB JS (gzipped by Vercel).

---

## API Function Limits

Running on Vercel **Hobby plan**:
- Serverless function timeout: **10 seconds**
- All calendar API calls are parallelised with `Promise.all` to stay within this limit
- If a calendar API call is slow (network latency to Google), the function may timeout — retry logic is not implemented; the frontend shows an error and the user can refresh

---

## Admin Auth Flow

```
POST /api/admin/login { password }
  → compare with ADMIN_PASSWORD using constant-time comparison
  → if match: sign JWT (HMAC-SHA256, 8h expiry, payload: { role: 'admin' })
  → return { success: true, token }

Client stores token in localStorage.admin_session

All admin API calls:
  → Authorization: Bearer <token>
  → api/lib/verifyAdminToken.ts: verify signature + expiry
  → if invalid/expired: 401 Unauthorized
```

---

## Customer Auth Flow

```
Firebase signInWithPhoneNumber(phone, recaptchaVerifier)
  → Firebase sends OTP SMS via their infrastructure
  → User enters OTP → confirmationResult.confirm(otp)
  → Firebase returns UserCredential → user.getIdToken() → idToken

POST /api/book { ...bookingData, idToken }
  → api/lib/verifyFirebaseToken.ts: verifyIdToken(idToken)
  → confirms real Firebase user, extracts phone number
  → creates Google Calendar event
  → returns booking confirmation
```

---

## Key Files Reference

```
api/
  book.ts                 — POST /api/book (customer booking)
  slots.ts                — GET /api/slots?date=&sport= (availability)
  pricing.ts              — GET/POST /api/pricing
  bookings.ts             — deprecated, returns 410
  admin/
    login.ts              — POST /api/admin/login
    bookings.ts           — GET/PATCH /api/admin/bookings
    block-slots.ts        — POST /api/admin/block-slots
    unblock-slots.ts      — DELETE /api/admin/unblock-slots
    blocked-slots.ts      — GET /api/admin/blocked-slots
  lib/
    calendarService.ts    — Google Calendar helpers (get/create/delete events)
    cors.ts               — CORS header utility
    firestore.ts          — Firestore pricing config read/write
    verifyAdminToken.ts   — Admin JWT verification
    verifyFirebaseToken.ts— Firebase ID token verification

src/
  pages/
    Index.tsx             — Landing page
    BookingNew.tsx        — Customer booking flow
    Admin.tsx             — Admin panel
    NotFound.tsx          — 404 page
  components/
    Hero.tsx              — Hero section with logo
    About.tsx             — About section
    Services.tsx          — Services section
    Features.tsx          — Features section
    LocationMap.tsx       — Google Maps embed + directions link
    Footer.tsx            — Site footer
    AdminLogin.tsx        — Admin password form
    ErrorBoundary.tsx     — React error boundary
  lib/
    firebase.ts           — Firebase app init + auth export
    utils.ts              — cn() helper
```

---

## Common Issues

### "Error fetching slots" on booking page
- Check Google Calendar API quota (free tier: 1,000,000 requests/day — very unlikely to hit)
- Check `GOOGLE_CALENDAR_ID` and service account permissions
- Check Vercel function logs: Dashboard → Project → **Functions** tab

### "Failed to save pricing"
- Check admin JWT is valid (re-login if needed)
- Check Firestore rules allow Admin SDK writes

### OTP not received by customer
- Firebase Phone Auth has daily SMS limits on the Spark (free) plan — upgrade to Blaze if needed
- Check Firebase Console → Authentication → Usage for quota details

### Admin JWT not accepted (401 errors)
- Ensure `ADMIN_PASSWORD` env var is set identically in Vercel and locally
- JWT uses HMAC-SHA256 — if the key changes, all existing sessions become invalid (users must re-login)

### Vercel function timeout
- Calendar API calls are parallelised but Google's API can be slow
- Consider upgrading to Vercel Pro for 60s timeout limit if timeouts are frequent
