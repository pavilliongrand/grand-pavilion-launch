import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllBookings, deleteCalendarBooking, updateBookingStatus } from '../lib/calendarService.js';
import { extractAndVerifyAdmin } from '../lib/verifyAdminToken.js';
import { applyCors } from '../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET,DELETE,PATCH,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Admin authentication via JWT
  try {
    extractAndVerifyAdmin(req.headers.authorization);
  } catch (authError: any) {
    return res.status(401).json({ error: authError.message || 'Unauthorized' });
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

      // Transform events to booking format (exclude blocked/admin events)
      const bookings = events
        .filter((event: any) => event.extendedProperties?.private?.blocked !== 'true')
        .map((event: any) => {
          // Use IST-safe hour and date extraction (Vercel runs UTC, bookings are in IST)
          const startDt = event.start?.dateTime ? new Date(event.start.dateTime) : null;
          const endDt = event.end?.dateTime ? new Date(event.end.dateTime) : null;
          const startHourIST = startDt ? new Date(startDt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours() : 0;
          const endHourIST = endDt ? new Date(endDt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours() : 0;
          const startISTDate = startDt ? new Date(startDt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })) : null;
          const dateStr = startISTDate
            ? `${startISTDate.getFullYear()}-${String(startISTDate.getMonth() + 1).padStart(2, '0')}-${String(startISTDate.getDate()).padStart(2, '0')}`
            : '';

          return {
            id: event.id,
            name: event.extendedProperties?.private?.name || 'Unknown',
            sport: event.extendedProperties?.private?.sport || 'unknown',
            date: dateStr,
            slots: [event.extendedProperties?.private?.slotId || ''],
            slotTimes: [`${startHourIST}:00 - ${endHourIST}:00`],
            phone: event.extendedProperties?.private?.phone || '',
            amount: parseInt(event.extendedProperties?.private?.amount || '0'),
            status: event.extendedProperties?.private?.status || 'pending',
            paymentMethod: event.extendedProperties?.private?.paymentMethod || 'cash',
            createdAt: event.extendedProperties?.private?.bookingDate || event.created,
          };
        });

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

    if (req.method === 'PATCH') {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: 'Booking ID and status required' });
      }

      await updateBookingStatus(id as string, status as string);

      return res.status(200).json({ success: true, message: 'Booking status updated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admin Bookings API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
