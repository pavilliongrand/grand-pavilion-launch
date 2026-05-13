import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { createCalendarBooking, getOccupiedSlotsFromCalendar, deleteCalendarBooking } from './lib/calendarService.js';
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
function calculateServerPrice(
  sport: string,
  slotIds: string[],
  hourlyPricing: Array<{ hour: number; cricketPrice?: number; football7sPrice?: number; football11sPrice?: number; footballPrice?: number }>
): number {
  let total = 0;
  for (const slotId of slotIds) {
    const [startHour] = slotId.split('-').map(Number);
    const priceRule = hourlyPricing.find((p) => p.hour === startHour);

    if (sport === 'cricket') {
      total += priceRule?.cricketPrice || 1600;
    } else if (sport === 'football-11s') {
      total += priceRule?.football11sPrice || 2200;
    } else {
      total += priceRule?.football7sPrice || priceRule?.footballPrice || 1600;
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

    // ── 3. Validate date is not in the past ────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(payload.date + 'T00:00:00+05:30');
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Cannot book a date in the past' });
    }

    // ── 4. Check sport availability ────────────────────────
    const pricingData = await getPricingConfig();
    const sportAvailability = pricingData.sportAvailability || { cricket: true, football: true };
    const baseSport = payload.sport.startsWith('football') ? 'football' : payload.sport;
    if (!sportAvailability[baseSport]) {
      return res.status(400).json({
        error: `${baseSport.charAt(0).toUpperCase() + baseSport.slice(1)} bookings are currently disabled.`,
      });
    }

    // ── 5. Calculate price server-side ──────────────────────
    const serverAmount = calculateServerPrice(
      payload.sport,
      payload.slots.map((s) => s.slotId),
      pricingData.hourlyPricing || []
    );

    // ── 6. Double-booking prevention (check-then-act) ──────
    const occupiedSlots = await getOccupiedSlotsFromCalendar(payload.date, payload.sport);
    for (const slot of payload.slots) {
      if (occupiedSlots.includes(slot.slotId)) {
        return res.status(409).json({
          error: 'This slot just got booked. Please refresh and select a different time.',
        });
      }
    }

    // ── 7. Create calendar events with rollback on failure ─
    const createdEventIds: string[] = [];

    try {
      for (const slot of payload.slots) {
        const eventId = await createCalendarBooking({
          name: payload.name,
          sport: payload.sport,
          date: payload.date,
          slotId: slot.slotId,
          phone: payload.phone,
          amount: serverAmount / payload.slots.length,
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
