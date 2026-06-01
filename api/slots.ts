import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getOccupiedSlotDetailsFromCalendar } from './lib/calendarService.js';
import { getPricingConfig } from './lib/firestore.js';
import { applyCors } from './lib/cors.js';

interface TimeSlot {
  id: string;
  time: string;
  startHour: number;
  endHour: number;
  available: boolean;
  price: number;
  unavailableReason?: string;
  /** Current number of bookings on this slot (for 7s half-ground) */
  bookingCount?: number;
  /** Maximum bookings allowed on this slot (2 for 7s, 1 for others) */
  maxBookings?: number;
}


const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  sport: z.enum(['cricket', 'football-7s', 'football-11s']),
});

/**
 * API Route: /api/slots
 * Fetch available time slots for a given date and sport.
 * Query params: date (YYYY-MM-DD), sport (cricket|football-7s|football-11s)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: parsed.error.issues.map((i) => i.message),
      });
    }

    const { date, sport } = parsed.data;

    // Fetch pricing config and occupied slots in parallel (saves ~1s toward Vercel 10s limit)
    const [pricingData, occupiedSlots] = await Promise.all([
      getPricingConfig(),
      getOccupiedSlotDetailsFromCalendar(date, sport),
    ]);

    const sportAvailability = pricingData.sportAvailability || { cricket: true, football: true };

    // Check availability per specific football variant, with backward-compat fallback to legacy 'football' key
    const sportKey = sport === 'cricket' ? 'cricket' : sport === 'football-7s' ? 'football7s' : 'football11s';
    const sportEnabled = sportAvailability[sportKey] ?? sportAvailability['football'] ?? true;
    if (!sportEnabled) {
      const sportLabel = sport === 'cricket' ? 'Cricket' : sport === 'football-7s' ? 'Football 7s' : 'Football 11s';
      return res.status(400).json({
        error: `${sportLabel} bookings are currently disabled.`,
        disabled: true,
      });
    }

    // Generate time slots
    const slots = generateSlots(sport, pricingData, date);

    // occupiedSlots already fetched in parallel above
    const occupiedBySlotId = new Map(occupiedSlots.map((slot) => [slot.slotId, slot]));

    const maxBookingsForSport = sport === 'football-7s' ? 2 : 1;

    // Mark occupied slots as unavailable
    // For football-7s: a slot is available if bookingCount < 2 (half-ground sharing)
    // For cricket / football-11s: any booking on the slot (regardless of sport) blocks it
    const availableSlots = slots.map((slot) => {
      const occupied = occupiedBySlotId.get(slot.id);
      if (!occupied) {
        return {
          ...slot,
          bookingCount: 0,
          maxBookings: maxBookingsForSport,
        };
      }

      // Admin blocks always make unavailable
      if (occupied.blocked) {
        return {
          ...slot,
          available: false,
          unavailableReason: occupied.reason,
          bookingCount: 0,
          maxBookings: maxBookingsForSport,
        };
      }

      // For football-7s: allow up to 2 bookings on the same slot
      if (sport === 'football-7s' && occupied.bookingSport === 'football-7s') {
        const isStillAvailable = slot.available && occupied.bookingCount < 2;
        return {
          ...slot,
          available: isStillAvailable,
          unavailableReason: isStillAvailable ? undefined : 'Booked',
          bookingCount: occupied.bookingCount,
          maxBookings: 2,
        };
      }

      // Cricket / 11s or any non-7s booking: fully blocks the slot
      return {
        ...slot,
        available: false,
        unavailableReason: occupied.reason,
        bookingCount: occupied.bookingCount,
        maxBookings: maxBookingsForSport,
      };
    });

    return res.status(200).json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return res.status(503).json({ error: 'Failed to fetch slots. Please try again.' });
  }
}

function generateSlots(
  sport: 'cricket' | 'football-7s' | 'football-11s',
  pricingData: any,
  targetDateStr: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const rates = pricingData.rates || {
    cricketDay: 1000, cricketNight: 1600,
    football7sDay: 1000, football7sNight: 1600,
    football11sDay: 1000, football11sNight: 1600
  };
  const cutoff = pricingData.dayNightCutoffHour || 18;
  const workingHours = pricingData.workingHours || { start: 6, end: 24 };

  // Weekend Restriction Logic
  let isWeekendAllowed = true;
  const targetDate = new Date(targetDateStr);
  const dayOfWeek = targetDate.getDay();
  const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const todayDayOfWeek = istTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  isWeekendAllowed = !isWeekend || (todayDayOfWeek === 5 || todayDayOfWeek === 6 || todayDayOfWeek === 0);

  const istDateStr = istTime.getFullYear() + '-' + String(istTime.getMonth() + 1).padStart(2, '0') + '-' + String(istTime.getDate()).padStart(2, '0');
  const isToday = targetDateStr === istDateStr;
  const currentHour = istTime.getHours();

  const formatAMPM = (h: number) => {
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
    let hour12 = h % 12;
    hour12 = hour12 ? hour12 : 12;
    return `${String(hour12).padStart(2, '0')}:00 ${ampm}`;
  };

  for (let hour = 0; hour < 24; hour++) {
    const endHour = hour + 1;
    const isNight = hour >= cutoff || hour < 6; // Night: after cutoff (6 PM) OR before 6 AM (lights on)

    let price = 1600;
    if (sport === 'cricket') {
      price = isNight ? rates.cricketNight : rates.cricketDay;
    } else if (sport === 'football-11s') {
      price = isNight ? rates.football11sNight : rates.football11sDay;
    } else {
      price = isNight ? rates.football7sNight : rates.football7sDay;
    }

    const isPastHour = isToday && hour <= currentHour;
    const isWithinWorkingHours = hour >= workingHours.start && hour < workingHours.end;

    if (isPastHour) {
      continue;
    }

    slots.push({
      id: `${hour}-${endHour}`,
      time: `${formatAMPM(hour)} - ${formatAMPM(endHour)}`,
      startHour: hour,
      endHour: endHour,
      available: isWeekendAllowed && isWithinWorkingHours && !isPastHour,
      price: price,
    });
  }

  return slots;
}
