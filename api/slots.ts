import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOccupiedSlotsFromCalendar } from './lib/calendarService.js';
import { getPricingConfig } from './lib/firestore.js';

interface TimeSlot {
  id: string;
  time: string;
  startHour: number;
  endHour: number;
  available: boolean;
  price: number;
  turf?: number;
  availableTurfs?: number[];
}

/**
 * API Route: /api/slots
 * Fetch available time slots for a given date and sport
 * Query params: date (YYYY-MM-DD), sport (cricket|football)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, sport, turf } = req.query;

    if (!date || !sport) {
      return res.status(400).json({ error: 'Missing required parameters: date, sport' });
    }

    if (sport !== 'cricket' && sport !== 'football') {
      return res.status(400).json({ error: 'Invalid sport. Must be cricket or football' });
    }

    const footballTurf = sport === 'football' && turf ? parseInt(turf as string) : undefined;

    // Read pricing from Firestore instead of JSON file
    const pricingData = await getPricingConfig();
    const sportAvailability = pricingData.sportAvailability || { cricket: true, football: true };
    
    if (!sportAvailability[sport]) {
      return res.status(400).json({ 
        error: `${sport.charAt(0).toUpperCase() + sport.slice(1)} bookings are currently disabled. Please try again later or contact us.`,
        disabled: true
      });
    }

    // Generate time slots
    const slots = generateSlots(sport as 'cricket' | 'football', pricingData, date as string);

    // For FOOTBALL: Get availability for BOTH turfs
    if (sport === 'football') {
      // Fetch occupied slots for each turf
      const turf1Occupied = await getOccupiedSlotsFromCalendar(date as string, 'football', 1);
      const turf2Occupied = await getOccupiedSlotsFromCalendar(date as string, 'football', 2);
      // Cricket blocks both turfs
      const cricketOccupied = await getOccupiedSlotsFromCalendar(date as string, 'cricket');
      
      // Return slots with turf availability info
      const slotsWithTurfInfo = slots.flatMap(slot => {
        const cricketBlocked = cricketOccupied.includes(slot.id);
        const turf1Available = !turf1Occupied.includes(slot.id) && !cricketBlocked;
        const turf2Available = !turf2Occupied.includes(slot.id) && !cricketBlocked;
        
        // Create separate slot entries for each available turf
        const turfSlots: TimeSlot[] = [];
        if (turf1Available) {
          turfSlots.push({
            ...slot,
            id: `${slot.id}-turf1`,
            turf: 1,
            available: true,
            availableTurfs: [1]
          });
        }
        if (turf2Available) {
          turfSlots.push({
            ...slot,
            id: `${slot.id}-turf2`,
            turf: 2,
            available: true,
            availableTurfs: [2]
          });
        }
        
        // If both are unavailable, still show the slot as booked
        if (turfSlots.length === 0) {
          turfSlots.push({
            ...slot,
            id: `${slot.id}-booked`,
            available: false,
            availableTurfs: []
          });
        }
        
        return turfSlots;
      });
      
      return res.status(200).json({ slots: slotsWithTurfInfo });
    }

    // For CRICKET: Original logic
    // Fetch occupied slots from YOUR Google Calendar (CALENDAR = DATABASE)
    const occupiedSlots = await getOccupiedSlotsFromCalendar(date as string, sport as string, footballTurf);
    
    // Cricket: check if BOTH football turfs are booked (if both are booked, cricket can't book)
    const football1Slots = await getOccupiedSlotsFromCalendar(date as string, 'football', 1);
    const football2Slots = await getOccupiedSlotsFromCalendar(date as string, 'football', 2);
    // Only block cricket if both turfs are booked for the same slot
    const conflictingSlots = football1Slots.filter(slot => football2Slots.includes(slot));

    // Mark occupied slots as unavailable
    const availableSlots = slots.map(slot => ({
      ...slot,
      // Unavailable if: 1) Already booked for this sport/turf, OR 2) Conflicting sport is booked
      available: !occupiedSlots.includes(slot.id) && !conflictingSlots.includes(slot.id)
    }));

    return res.status(200).json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return res.status(500).json({ error: 'Failed to fetch slots. Please try again.' });
  }
}

function generateSlots(sport: 'cricket' | 'football', pricingData: any, targetDateStr?: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  const hourlyPricing = pricingData.hourlyPricing;
  const workingHours = pricingData.workingHours || { start: 6, end: 24 };

  // Weekend Restriction Logic
  let isWeekendAllowed = true;
  if (targetDateStr) {
    const targetDate = new Date(targetDateStr);
    const dayOfWeek = targetDate.getDay();
    
    // Convert current time to IST
    const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayDayOfWeek = istTime.getDay();
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFridayToday = todayDayOfWeek === 5;
    isWeekendAllowed = !isWeekend || isFridayToday;
  }

  const formatAMPM = (h: number) => {
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
    let hour12 = h % 12;
    hour12 = hour12 ? hour12 : 12;
    return `${String(hour12).padStart(2, '0')}:00 ${ampm}`;
  };

  // Generate for all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    const endHour = hour + 1;
    const priceRule = hourlyPricing.find((p: any) => p.hour === hour);
    
    const price = sport === 'cricket' 
      ? priceRule?.cricketPrice || 1500 
      : priceRule?.footballPrice || 1000;

    const isWithinWorkingHours = hour >= workingHours.start && hour < workingHours.end;

    slots.push({
      id: `${hour}-${endHour}`,
      time: `${formatAMPM(hour)} - ${formatAMPM(endHour)}`,
      startHour: hour,
      endHour: endHour,
      available: isWeekendAllowed && isWithinWorkingHours,
      price: price,
    });
  }

  return slots;
}
