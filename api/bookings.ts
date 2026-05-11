import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCalendarBooking } from './lib/calendarService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sport, date, slots, phone } = req.body;

    if (!sport || !date || !slots || !phone) {
      return res.status(400).json({ error: 'Missing required fields: sport, date, slots, phone' });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'Slots must be a non-empty array' });
    }

    // Calculate total amount based on slots
    let totalAmount = 0;
    for (const slotId of slots) {
      const [hourStr] = slotId.split('-');
      const hour = parseInt(hourStr);
      const isPeak = hour >= 18 && hour <= 22;
      const price = sport === 'cricket' 
        ? (isPeak ? 1950 : 1500)
        : (isPeak ? 1300 : 1000);
      totalAmount += price;
    }

    // Create one booking event per slot in Google Calendar
    const bookingIds = [];
    for (const slotId of slots) {
      const [hourStr] = slotId.split('-');
      const hour = parseInt(hourStr);
      const isPeak = hour >= 18 && hour <= 22;
      const price = sport === 'cricket' 
        ? (isPeak ? 1950 : 1500)
        : (isPeak ? 1300 : 1000);

      const bookingId = await createCalendarBooking({
        name: 'Walk-in Customer',
        sport,
        date,
        slotId,
        phone,
        amount: price,
        paymentMethod: 'Cash at venue'
      });
      
      bookingIds.push(bookingId);
    }

    return res.status(200).json({
      success: true,
      bookingIds,
      totalAmount,
      message: 'Booking created successfully'
    });

  } catch (error: any) {
    console.error('Booking API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create booking' 
    });
  }
}
