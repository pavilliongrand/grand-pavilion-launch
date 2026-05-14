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

    // Read pricing from Firestore
    const pricingData = await getPricingConfig();
    const sportAvailability = pricingData.sportAvailability || { cricket: true, football: true };

    // For availability check, treat 7s and 11s as "football"
    const baseSport = sport.startsWith('football') ? 'football' : sport;
    if (!sportAvailability[baseSport]) {
      return res.status(400).json({
        error: `${baseSport.charAt(0).toUpperCase() + baseSport.slice(1)} bookings are currently disabled.`,
        disabled: true,
      });
    }

    // Generate time slots
    const slots = generateSlots(sport, pricingData, date);

    // Fetch occupied slots from Google Calendar
    const occupiedSlots = await getOccupiedSlotDetailsFromCalendar(date, sport);
    const occupiedBySlotId = new Map(occupiedSlots.map((slot) => [slot.slotId, slot]));

    // Mark occupied slots as unavailable
    const availableSlots = slots.map((slot) => ({
      ...slot,
      available: slot.available && !occupiedBySlotId.has(slot.id),
      unavailableReason: occupiedBySlotId.get(slot.id)?.reason,
    }));

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
  const isFridayToday = todayDayOfWeek === 5;
  isWeekendAllowed = !isWeekend || isFridayToday;

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
    const isNight = hour >= cutoff; // Night is after cutoff hour (usually 6 PM)

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
