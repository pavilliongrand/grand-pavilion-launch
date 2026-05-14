# Admin Panel Guide

Step-by-step guide to managing Grand Pavilion bookings through the admin panel.

---

## Logging In

1. Go to `https://your-domain.com/admin`
2. Enter the admin password
3. Click **Login**

Your session stays active for **8 hours**. After that, you'll need to log in again. You can also log out at any time using the **Logout** button in the top-right corner.

> **Tip:** Bookmark the `/admin` URL on your phone for quick access.

---

## Overview of Tabs

The admin panel has four tabs at the top:

| Tab | What it does |
|---|---|
| **Bookings** | View all customer reservations |
| **Pricing** | Set day/night rates and working hours |
| **Slots** | Block or unblock time slots on a specific date |
| **Analytics** | Summary stats (if enabled) |

---

## Bookings Tab

This is the first screen you see after logging in. It lists all upcoming customer bookings.

### What you'll see for each booking:

- Customer name and phone number
- Sport booked (Cricket / Football 7s / Football 11s)
- Date and time slot (e.g., 6:00 PM – 7:00 PM)
- Amount (calculated at time of booking)
- Status badge: **Confirmed** or **Pending**

### Changing a booking status:

Click the **Confirm / Pending** toggle button next to any booking to switch its status. This is useful if you want to mark a payment as received.

### Things to note:

- Bookings are sorted by date (soonest first)
- Only upcoming bookings appear — past bookings are not shown
- There is no way to create a booking from the admin panel. Bookings are only made by customers through the website.
- To cancel a booking, you need to delete the event directly from Google Calendar (this will free up the slot automatically)

---

## Pricing Tab

Use this tab to control how much slots cost.

### Day & Night Rates

There are two rates for each sport:
- **Day rate** — applies to slots before the cutoff hour
- **Night rate** — applies to slots at or after the cutoff hour

**Default cutoff: 6 PM (18:00)**

| Sport | Day Rate | Night Rate |
|---|---|---|
| Cricket | ₹1,600/hr | ₹1,950/hr |
| Football 7-a-side | ₹1,600/hr | ₹1,950/hr |
| Football 11-a-side | ₹2,200/hr | ₹2,600/hr |

To change a rate:
1. Click into the rate field
2. Type the new amount (numbers only, no ₹ symbol needed)
3. Click **Save Pricing** at the bottom

### Changing the Day/Night Cutoff Hour

The cutoff is the hour when night pricing kicks in. Default is 18 (6 PM).

- Enter a value between 0 and 23 (24-hour format)
- Example: `18` = 6 PM, `17` = 5 PM, `19` = 7 PM

### Working Hours

Set the first and last available booking hour for the day:
- **Start hour**: The earliest slot customers can book (default: 6 AM)
- **End hour**: The last slot starts before this hour (default: 11 PM / 23:00)

> Example: Start 6, End 23 → slots available from 6 AM to 10 PM–11 PM.

### Sport Availability

Toggle each sport on or off. If you turn a sport **Off**, its slots will not appear in the booking page at all.

This is useful if a sport is unavailable for a period (e.g., pitch maintenance).

### Saving

Click **Save Pricing** after making any changes. You'll see a confirmation message when it's saved. Changes take effect immediately for new bookings.

---

## Slots Tab

Use this tab to block time slots on specific dates — for maintenance, private events, tournaments, or any reason.

### Blocking a slot

1. **Select a date** using the date picker at the top
2. You'll see a grid of all 24 hours for that day
3. Choose a **reason** for blocking (e.g., "Tournament", "Maintenance")
4. Optionally enter a **customer name** and **phone number** if blocking for a specific person
5. Click any slot button to **toggle it blocked/unblocked**
   - Green = available (clicking will block it)
   - Red = blocked (clicking will unblock it)

### Blocking an entire day

Below the slot grid, there are **Block Full Day** buttons for Cricket and Football. This blocks all 24 hours at once for that sport on the selected date.

### Unblocking slots

You can unblock individual slots by clicking them again in the grid. Alternatively, scroll down to see a list of all blocked events for the selected date and click the **Unblock** (trash) icon next to any of them.

---

## Logging Out

Click the **Logout** button in the top-right header. This clears your session immediately.

Your session will also expire automatically after 8 hours of inactivity.

---

## Tips

- **Check bookings daily** — customers book online anytime, including nights and weekends
- **Block slots in advance** for tournaments or maintenance so customers can't accidentally book those times
- **Update pricing before festivals or peak season** if you want to adjust rates
- **Keep your admin password private** — don't share it over WhatsApp or email
