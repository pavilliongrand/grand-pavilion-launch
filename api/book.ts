import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCalendarBooking, getOccupiedSlotsFromCalendar } from './lib/calendarService.js';
import { getPricingConfig } from './lib/firestore.js';

interface BookingPayload {
  name: string;
  sport: 'cricket' | 'football';
  date: string;
  slots: Array<{slotId: string, turf?: number}>;
  phone: string;
  amount: number;
  paymentMethod: string;
}

/**
 * API Route: /api/book
 * Create a booking and add to Google Calendar (CALENDAR = DATABASE)
 * Method: POST
 * Body: { name, sport, date, slots, phone, amount, paymentMethod }
 * 
 * Includes double-booking prevention via re-validation before insert.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: BookingPayload = req.body;

    // Validate payload
    if (!payload.name || !payload.sport || !payload.date || !payload.slots || !payload.phone || !payload.amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if sport is available/enabled (from Firestore)
    const pricingData = await getPricingConfig();
    const sportAvailability = pricingData.sportAvailability || { cricket: true, football: true };
    
    if (!sportAvailability[payload.sport]) {
      return res.status(400).json({ 
        error: `${payload.sport.charAt(0).toUpperCase() + payload.sport.slice(1)} bookings are currently disabled. Please contact us for more information.` 
      });
    }

    // ============================================
    // DOUBLE BOOKING PREVENTION — Re-validation
    // ============================================
    // Re-fetch occupied slots RIGHT BEFORE booking to catch concurrent requests.
    // This is the "check-then-act" guard that prevents most double bookings.
    
    if (payload.sport === 'football') {
      for (const slot of payload.slots) {
        // Check cricket conflict
        const cricketSlots = await getOccupiedSlotsFromCalendar(payload.date, 'cricket');
        if (cricketSlots.includes(slot.slotId)) {
          return res.status(409).json({ 
            error: 'This slot just got booked for cricket. Please refresh and select a different time.' 
          });
        }

        // Check specific turf conflict
        if (slot.turf) {
          const turfSlots = await getOccupiedSlotsFromCalendar(payload.date, 'football', slot.turf);
          if (turfSlots.includes(slot.slotId)) {
            return res.status(409).json({ 
              error: `Turf ${slot.turf} just got booked for this slot. Please refresh and try again.` 
            });
          }
        }
      }
    } else {
      // Cricket: re-validate
      const cricketOccupied = await getOccupiedSlotsFromCalendar(payload.date, 'cricket');
      const football1Slots = await getOccupiedSlotsFromCalendar(payload.date, 'football', 1);
      const football2Slots = await getOccupiedSlotsFromCalendar(payload.date, 'football', 2);
      
      for (const slot of payload.slots) {
        if (cricketOccupied.includes(slot.slotId)) {
          return res.status(409).json({ 
            error: 'This cricket slot just got booked. Please refresh and select a different time.' 
          });
        }
        
        // Check if both football turfs are occupied (blocks cricket)
        if (football1Slots.includes(slot.slotId) && football2Slots.includes(slot.slotId)) {
          return res.status(409).json({ 
            error: 'Both football turfs are booked for this slot, so cricket cannot be booked. Please select a different time.' 
          });
        }
      }
    }

    // ============================================
    // Create Google Calendar events for each slot
    // ============================================
    const eventIds: string[] = [];
    
    for (const slot of payload.slots) {
      const eventId = await createCalendarBooking({
        name: payload.name,
        sport: payload.sport,
        date: payload.date,
        slotId: slot.slotId,
        phone: payload.phone,
        amount: payload.amount / payload.slots.length, // Divide amount by number of slots
        paymentMethod: payload.paymentMethod,
        footballTurf: slot.turf,
      });
      
      eventIds.push(eventId);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed! Event added to calendar.',
      eventIds,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Failed to create booking. Please try again.' });
  }
}
