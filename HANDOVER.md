# Grand Pavilion Sports Turf — Client Handover

**Project:** Online Slot Booking System  
**Client:** Grand Pavilion Sports Turf, Palakkad  
**Handover Date:** May 2026  

---

## What Was Built

A complete online booking system for Grand Pavilion Sports Turf with:

- **Customer-facing website** — landing page with hero, about, services, features, map, and footer
- **Online booking flow** — customers pick a sport, date, time slot, verify their phone via OTP, and confirm
- **Admin panel** — you manage bookings, block slots, and control pricing
- **No payment gateway** — customers pay cash at the venue; the system is for reservations only

---

## Live URLs

| Page | URL |
|---|---|
| Main website | `https://your-domain.com/` |
| Book a slot | `https://your-domain.com/booking` |
| Admin panel | `https://your-domain.com/admin` |

> Replace `your-domain.com` with your actual Vercel deployment URL or custom domain.

---

## ⚠️ Before Going Live — Change the Admin Password

The admin panel is password-protected. The current password must be changed to something strong before you open the site to customers.

**Steps:**
1. Log in to [vercel.com](https://vercel.com) → Your project → **Settings** → **Environment Variables**
2. Find the variable `ADMIN_PASSWORD`
3. Click **Edit** and replace it with a strong password (at least 16 characters, mix of letters, numbers, symbols)
4. Click **Save**
5. Go to **Deployments** and click **Redeploy** on the latest deployment

**Example of a strong password:** `GrandPav!l10n#2026$Turf`

Never share this password over WhatsApp or email. Store it in your phone's notes app or a password manager.

---

## How to Use the Admin Panel

See [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) for the full step-by-step guide.

**Quick summary:**

1. Go to `/admin` on your website
2. Enter the admin password
3. Session lasts 8 hours — after that you need to log in again

**What you can do in the admin panel:**
- View all upcoming customer bookings
- Mark bookings as confirmed or pending
- Block slots for any date (maintenance, tournaments, personal use)
- Unblock slots
- Change the day and night rates per sport
- Toggle which sports are available for booking

---

## How Customer Booking Works

1. Customer visits the website and clicks **Reserve Your Slot**
2. Selects a sport (Cricket, Football 7s, or Football 11s)
3. Scrolls through dates to pick a day
4. Sees all available 1-hour slots with prices (green = available, red = unavailable)
5. Selects a slot and enters their name and phone number
6. Receives a 6-digit OTP via SMS to their phone (via Firebase)
7. Enters the OTP to confirm the booking
8. Booking is saved and appears in your admin panel

---

## Pricing System

- **Day rate** applies before the cutoff hour (default: 6 PM / 18:00)
- **Night rate** applies from 6 PM onwards
- Each sport has its own day and night rate
- You can change the cutoff hour and all rates in the admin panel → **Pricing** tab

Default rates configured:
| Sport | Day Rate | Night Rate |
|---|---|---|
| Cricket | ₹1,600/hr | ₹1,950/hr |
| Football 7-a-side | ₹1,600/hr | ₹1,950/hr |
| Football 11-a-side | ₹2,200/hr | ₹2,600/hr |

---

## Google Calendar Integration

All bookings and blocked slots are stored in a **Google Calendar** that was set up for this project. You can view it directly from your Google account:

- Each customer booking appears as a calendar event with their name, phone, sport, and amount
- Blocked slots also appear as events (labelled as "Admin blocked", "Tournament", etc.)
- If you delete an event from the calendar directly, it will free up that slot on the booking page

---

## What Happens if Something Breaks

**Booking page shows "Failed to load slots"**  
→ Usually a temporary API issue. Refresh the page. If it continues for more than 10 minutes, contact your developer.

**Admin panel says "Unauthorized"**  
→ Your session expired (8 hours). Log out and log back in.

**Customer says they got an OTP but booking didn't confirm**  
→ Check the admin panel — the booking may still be there. If not, ask them to try again.

**The website is down entirely**  
→ Check [vercel.com](https://vercel.com) → Your project for any deployment errors. Contact your developer.

---

## Technical Summary (for the developer)

See [README.md](README.md) for the full technical overview and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment setup, Vercel configuration, and Google Calendar/Firebase setup.

---

## Files You Should Never Edit Directly

| File/Folder | Why |
|---|---|
| `api/` | Server-side code — changes need a redeployment |
| `src/` | Frontend source code |
| `.env` | Contains secret keys — never commit to git |
| `vercel.json` | Routing config |

---

## Support

For any issues with the system after handover, contact your developer with:
- The URL where the issue occurs
- What you were doing when it happened
- A screenshot if possible
