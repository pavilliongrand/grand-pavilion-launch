import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { deleteCalendarBooking } from '../lib/calendarService.js';
import { extractAndVerifyAdmin } from '../lib/verifyAdminToken.js';
import { applyCors } from '../lib/cors.js';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const PRIVATE_KEY = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

interface UpdateBookingRequest {
  /** All calendar event IDs belonging to this booking group */
  eventIds: string[];
  /** New start hour (0-23) */
  newStartHour: number;
  /** New end hour (1-24) */
  newEndHour: number;
  /** Updated total amount */
  newAmount: number;
  /** Booking date (YYYY-MM-DD) */
  date: string;
  /** Sport */
  sport: string;
  /** Customer name */
  customerName: string;
  /** Customer phone */
  customerPhone: string;
}

/**
 * API Route: /api/admin/update-booking
 * Admin-only endpoint to edit booking timing and pricing.
 * Deletes old calendar events and creates new ones for the updated range.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'PUT,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin authentication via JWT
  try {
    extractAndVerifyAdmin(req.headers.authorization);
  } catch (authError: any) {
    return res.status(401).json({ error: authError.message || 'Unauthorized' });
  }

  try {
    const {
      eventIds,
      newStartHour,
      newEndHour,
      newAmount,
      date,
      sport,
      customerName,
      customerPhone,
    }: UpdateBookingRequest = req.body;

    if (!eventIds || eventIds.length === 0 || newStartHour === undefined || !newEndHour || !date || !sport) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newStartHour >= newEndHour) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // 1. Delete all old events for this booking
    const deleteErrors: string[] = [];
    for (const eventId of eventIds) {
      try {
        await deleteCalendarBooking(eventId);
      } catch (err: any) {
        console.error(`Failed to delete event ${eventId}:`, err.message);
        deleteErrors.push(eventId);
      }
    }

    // 2. Create new events for the updated time range
    const newEventIds: string[] = [];
    const totalSlots = newEndHour - newStartHour;

    for (let hour = newStartHour; hour < newEndHour; hour++) {
      const slotId = `${hour}-${hour + 1}`;
      const startTime = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+05:30`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      // Put total amount on first slot only to avoid inflating revenue
      const slotAmount = (hour === newStartHour) ? newAmount.toString() : '0';

      const event = {
        summary: `${sport.toUpperCase()} - ${customerName}`,
        description: `👤 Name: ${customerName}\n📱 Phone: ${customerPhone}\n⚽ Sport: ${sport}\n💰 Amount: ₹${newAmount}\n⏰ Slot: ${slotId}\n\nEdited via Admin Panel`,
        start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Kolkata' },
        extendedProperties: {
          private: {
            blocked: 'false',
            sport,
            slotId,
            name: customerName,
            phone: customerPhone,
            amount: slotAmount,
            reason: 'Phone Booking',
            customerName,
            customerPhone,
          },
        },
        colorId: sport === 'cricket' ? '9' : sport === 'football-5s' ? '6' : '11',
      };

      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: event,
      });

      if (response.data.id) {
        newEventIds.push(response.data.id);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Booking updated: ${totalSlots} slot(s) from ${newStartHour}:00 to ${newEndHour}:00`,
      newEventIds,
      deletedCount: eventIds.length - deleteErrors.length,
    });
  } catch (error: any) {
    console.error('Update booking error:', error);
    return res.status(500).json({ error: 'Failed to update booking', details: error.message });
  }
}
