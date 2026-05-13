import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllBookings, deleteCalendarBooking } from '../lib/calendarService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Admin-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Admin authentication
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const adminKey = req.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Get all bookings for the next 30 days
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);

      const events = await getAllBookings(
        today.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Transform events to booking format
      const bookings = events.map((event: any) => ({
        id: event.id,
        name: event.extendedProperties?.private?.name || 'Unknown',
        sport: event.extendedProperties?.private?.sport || 'unknown',
        date: event.start?.dateTime?.split('T')[0] || '',
        slots: [event.extendedProperties?.private?.slotId || ''],
        slotTimes: [`${new Date(event.start?.dateTime).getHours()}:00 - ${new Date(event.end?.dateTime).getHours()}:00`],
        phone: event.extendedProperties?.private?.phone || '',
        amount: parseInt(event.extendedProperties?.private?.amount || '0'),
        status: 'confirmed',
        paymentMethod: event.extendedProperties?.private?.paymentMethod || 'cash',
        createdAt: event.extendedProperties?.private?.bookingDate || event.created
      }));

      return res.status(200).json({ success: true, bookings });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Booking ID required' });
      }

      await deleteCalendarBooking(id as string);
      
      return res.status(200).json({ success: true, message: 'Booking cancelled' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Admin Bookings API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
