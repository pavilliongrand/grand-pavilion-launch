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
  sport: z.enum(['cricket', 'football-7s', 'football-11s', 'football-5s']),
});

/**
 * API Route: /api/slots
 * Fetch available time slots for a given date and sport.
 * Query params: date (YYYY-MM-DD), sport (cricket|football-7s|football-11s|football-5s)
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
    const sportEnabled1 = sportAvailability['football7s'] ?? sportAvailability['football'] ?? true;
    const sportEnabled2 = sportAvailability['football7s_2'] ?? sportAvailability['football'] ?? true;

    const is7s = sport === 'football-7s';
    const is5s = sport === 'football-5s';
    const isFootball = is7s || is5s;
    // Football (5s/7s) share 2 fields. Cricket/11s use the full ground (1 booking max).
    const maxBookingsForSport = isFootball ? 2 : 1;

    // Check availability per specific football variant, with backward-compat fallback to legacy 'football' key
    const sportKey = sport === 'cricket' ? 'cricket' : sport === 'football-11s' ? 'football11s' : sport === 'football-5s' ? 'football5s' : 'football7s';
    const sportEnabled = (is7s || is5s) ? (maxBookingsForSport > 0) : (sportAvailability[sportKey] ?? sportAvailability['football'] ?? true);
    
    if (!sportEnabled) {
      const sportLabel = sport === 'cricket' ? 'Cricket' : sport === 'football-7s' ? 'Football 7s' : sport === 'football-5s' ? 'Football 5s' : 'Football 11s';
      return res.status(400).json({
        error: `${sportLabel} bookings are currently disabled.`,
        disabled: true,
      });
    }

    // Generate time slots
    const slots = generateSlots(sport, pricingData, date);

    // occupiedSlots already fetched in parallel above
    const occupiedBySlotId = new Map(occupiedSlots.map((slot) => [slot.slotId, slot]));

    // Mark occupied slots as unavailable
    // Football (5s/7s): share 2 fields. Each booking (5s or 7s) uses one field.
    //   5s+5s NOT allowed (one goalpost). 5s+7s and 7s+7s ARE allowed.
    // Cricket / 11s: uses full ground — any existing booking blocks the slot.
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

      // Cricket / 11s: any existing booking on the slot fully blocks it
      // (including otherSport flag — cricket/11s use the whole ground)
      if (occupied.otherSport) {
        return {
          ...slot,
          available: false,
          unavailableReason: occupied.reason,
          bookingCount: occupied.bookingCount,
          maxBookings: maxBookingsForSport,
        };
      }

      // For football (5s/7s): check field availability
      if (isFootball) {
        const totalFieldBookings = (occupied.football5sCount || 0) + (occupied.football7sCount || 0);
        const freeFields = Math.max(0, maxBookingsForSport - totalFieldBookings);

        if (is7s) {
          // 7s available if there's at least one free field
          const isStillAvailable = slot.available && freeFields > 0;
          return {
            ...slot,
            available: isStillAvailable,
            unavailableReason: isStillAvailable ? undefined : 'Booked',
            bookingCount: totalFieldBookings,
            maxBookings: maxBookingsForSport,
          };
        }

        // 5s available if: (1) no existing 5s (one goalpost), AND (2) a free field exists
        const has5s = (occupied.football5sCount || 0) >= 1;
        const isStillAvailable = slot.available && !has5s && freeFields > 0;
        return {
          ...slot,
          available: isStillAvailable,
          unavailableReason: isStillAvailable ? undefined : (has5s ? '5s already booked' : 'All fields booked'),
          bookingCount: totalFieldBookings,
          maxBookings: maxBookingsForSport,
        };
      }

      // Cricket / 11s: any booking on the slot (regardless of sport) blocks it
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
  sport: 'cricket' | 'football-7s' | 'football-11s' | 'football-5s',
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
    } else if (sport === 'football-5s') {
      price = isNight ? rates.football5sNight : rates.football5sDay;
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
