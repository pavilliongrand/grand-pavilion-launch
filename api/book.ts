import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { createCalendarBooking, getOccupiedSlotDetailsFromCalendar, deleteCalendarBooking } from './lib/calendarService.js';
import { getPricingConfig } from './lib/firestore.js';
import { verifyFirebaseToken } from './lib/verifyFirebaseToken.js';
import { applyCors } from './lib/cors.js';

// ── Zod Schema ───────────────────────────────────────────────
const SlotSchema = z.object({
  slotId: z.string().regex(/^\d{1,2}-\d{1,2}$/, 'Invalid slot ID format'),
});

const BookingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sport: z.enum(['cricket', 'football-7s', 'football-11s']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  slots: z.array(SlotSchema).min(1, 'At least one slot required').max(5, 'Maximum 5 slots per booking'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  paymentMethod: z.string().default('cash'),
});

// ── Price Calculation (server-side, never trust client) ──────
// Uses the same rates/cutoff schema that Firestore stores and the slots API reads.
function calculateServerPrice(
  sport: string,
  slotIds: string[],
  pricingData: any
): number {
  const rates = pricingData?.rates || {
    cricketDay: 1600, cricketNight: 1600,
    football7sDay: 1600, football7sNight: 1600,
    football11sDay: 2200, football11sNight: 2200,
  };
  const cutoff: number = pricingData?.dayNightCutoffHour ?? 18;

  let total = 0;
  for (const slotId of slotIds) {
    const [startHour] = slotId.split('-').map(Number);
    const isNight = startHour >= cutoff || startHour < 6; // Night: after cutoff (6 PM) OR before 6 AM

    if (sport === 'cricket') {
      total += isNight ? rates.cricketNight : rates.cricketDay;
    } else if (sport === 'football-11s') {
      total += isNight ? rates.football11sNight : rates.football11sDay;
    } else {
      total += isNight ? rates.football7sNight : rates.football7sDay;
    }
  }
  return total;
}

/**
 * API Route: /api/book
 * Create a booking and add to Google Calendar.
 *
 * Security:
 *  - Requires a valid Firebase ID token in the Authorization header
 *  - Server calculates the price — client amount is ignored
 *  - Input validated with Zod
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ── 1. Authenticate via Firebase ID token ──────────────
    const tokenData = await verifyFirebaseToken(req.headers.authorization);

    // ── 2. Validate input ──────────────────────────────────
    const parsed = BookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => i.message),
      });
    }
    const payload = parsed.data;

    // Verify the phone in the token matches the booking phone
    const expectedPhone = `+91${payload.phone}`;
    if (tokenData.phone !== expectedPhone) {
      return res.status(403).json({
        error: 'Phone number mismatch. The verified phone does not match the booking phone.',
      });
    }

    // ── 3. Validate date is not in the past (IST-aware: Vercel runs UTC) ─────────────────────
    const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const istToday = `${istNow.getFullYear()}-${String(istNow.getMonth() + 1).padStart(2, '0')}-${String(istNow.getDate()).padStart(2, '0')}`;
    if (payload.date < istToday) {
      return res.status(400).json({ error: 'Cannot book a date in the past' });
    }

    // ── 3b. Validate date is within the 2-week booking window ─────────────────────────────────
    const maxDate = new Date(istNow);
    maxDate.setDate(istNow.getDate() + 13); // today + 13 more days = 2-week window
    const istMaxDate = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
    if (payload.date > istMaxDate) {
      return res.status(400).json({ error: 'Bookings can only be made up to 2 weeks in advance.' });
    }

    // ── 4 + 6. Fetch pricing config and occupied slots in parallel (saves ~1s toward Vercel 10s limit) ──
    const [pricingData, occupiedSlotDetails] = await Promise.all([
      getPricingConfig(),
      getOccupiedSlotDetailsFromCalendar(payload.date, payload.sport),
    ]);

    // ── 4. Check sport availability ────────────────────────
    const sportAvailability = pricingData.sportAvailability || {};
    const sportEnabled1 = sportAvailability['football7s'] ?? sportAvailability['football'] ?? true;
    const sportEnabled2 = sportAvailability['football7s_2'] ?? sportAvailability['football'] ?? true;
    const is7s = payload.sport === 'football-7s';
    const maxBookingsFor7s = is7s ? ((sportEnabled1 ? 1 : 0) + (sportEnabled2 ? 1 : 0)) : 1;

    const sportKey = payload.sport === 'cricket' ? 'cricket' : payload.sport === 'football-11s' ? 'football11s' : 'football7s';
    const sportEnabled = is7s ? (maxBookingsFor7s > 0) : (sportAvailability[sportKey] ?? sportAvailability['football'] ?? true);
    
    if (!sportEnabled) {
      const sportLabel = payload.sport === 'cricket' ? 'Cricket' : payload.sport === 'football-7s' ? 'Football 7s' : 'Football 11s';
      return res.status(400).json({
        error: `${sportLabel} bookings are currently disabled.`,
      });
    }

    // ── 5. Calculate price server-side ──────────────────────
    const serverAmount = calculateServerPrice(
      payload.sport,
      payload.slots.map((s) => s.slotId),
      pricingData
    );

    // ── 6. Double-booking prevention (occupiedSlotDetails already fetched above) ──────
    // For football-7s: allow up to maxBookingsFor7s bookings per slot (half-ground sharing)
    // For cricket / football-11s: any existing booking blocks the slot
    const occupiedBySlotId = new Map(occupiedSlotDetails.map((s) => [s.slotId, s]));
    for (const slot of payload.slots) {
      const occupied = occupiedBySlotId.get(slot.slotId);
      if (occupied) {
        if (payload.sport === 'football-7s' && !occupied.blocked && occupied.bookingSport === 'football-7s') {
          // 7s half-ground: allow if fewer than maxBookings
          if (occupied.bookingCount >= maxBookingsFor7s) {
            return res.status(409).json({
              error: 'Both 7-a-side spots for this slot are taken. Please select a different time.',
            });
          }
        } else {
          // Cricket, 11s, or admin block: no double booking
          return res.status(409).json({
            error: 'This slot just got booked. Please refresh and select a different time.',
          });
        }
      }
    }

    // ── 7. Create calendar events with rollback on failure ─
    const createdEventIds: string[] = [];

    try {
      for (const slot of payload.slots) {
        const slotAmount = calculateServerPrice(payload.sport, [slot.slotId], pricingData);
        const eventId = await createCalendarBooking({
          name: payload.name,
          sport: payload.sport,
          date: payload.date,
          slotId: slot.slotId,
          phone: payload.phone,
          amount: slotAmount,
          paymentMethod: payload.paymentMethod,
        });
        createdEventIds.push(eventId);
      }
    } catch (bookingError) {
      // Rollback: delete any events that were successfully created
      console.error('Partial booking failure, rolling back:', bookingError);
      for (const eventId of createdEventIds) {
        try {
          await deleteCalendarBooking(eventId);
        } catch (rollbackError) {
          console.error(`Failed to rollback event ${eventId}:`, rollbackError);
        }
      }
      return res.status(500).json({
        error: 'Booking failed. No slots were reserved. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed! Event added to calendar.',
      eventIds: createdEventIds,
      amount: serverAmount,
    });
  } catch (error: any) {
    // Auth errors
    if (error.message?.includes('Authorization') || error.message?.includes('Token') || error.message?.includes('token')) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Failed to create booking. Please try again.' });
  }
}
