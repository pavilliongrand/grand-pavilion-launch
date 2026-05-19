import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { extractAndVerifyAdmin } from '../lib/verifyAdminToken.js';
import { applyCors } from '../lib/cors.js';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const PRIVATE_KEY = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

interface BlockSlotRequest {
  sport: 'cricket' | 'football' | 'football-7s' | 'football-11s';
  date: string;
  slotIds: string[];
  reason: string;
  customerName?: string;
  customerPhone?: string;
  isBooking?: boolean;
  amount?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin authentication via JWT
  try {
    extractAndVerifyAdmin(req.headers.authorization);
  } catch (authError: any) {
    return res.status(401).json({ error: authError.message || 'Unauthorized' });
  }

  try {
    const { sport, date, slotIds, reason, customerName, customerPhone, isBooking, amount }: BlockSlotRequest = req.body;

    if (!sport || !date || !slotIds || slotIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const blockedEvents = [];
    for (let i = 0; i < slotIds.length; i++) {
      const slotId = slotIds[i];
      const [startHour] = slotId.split('-').map(Number);
      const endHour = startHour + 1;
      const startTime = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00+05:30`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Accurately adds 1 hour regardless of timezone

      // For multi-slot bookings (tournaments/camps), put the total amount ONLY on the
      // first slot to avoid inflating revenue. Subsequent slots get amount=0.
      const slotAmount = (isBooking && amount && i === 0) ? amount.toString() : '0';

      const event = {
        summary: isBooking ? `${sport.toUpperCase()} - ${reason}` : `BLOCKED - ${sport.toUpperCase()}`,
        description: `🚫 Reason: ${reason}\n🏏 Sport: ${sport}\n⏰ Time: ${startHour}:00 - ${startHour + 1}:00\n👤 Customer: ${customerName || 'N/A'}\n📞 Phone: ${customerPhone || 'N/A'}`,
        start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Kolkata' },
        extendedProperties: {
          private: { 
            blocked: isBooking ? 'false' : 'true', 
            sport, 
            slotId, 
            reason,
            customerName: customerName || '',
            customerPhone: customerPhone || '',
            name: customerName || reason,
            phone: customerPhone || '',
            amount: slotAmount,
          },
        },
        colorId: isBooking ? (sport === 'cricket' ? '9' : '11') : '11',
      };

      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: event,
      });

      blockedEvents.push(response.data);
    }

    return res.status(200).json({
      success: true,
      message: `Blocked ${blockedEvents.length} slot(s)`,
      blockedEvents,
    });
  } catch (error: any) {
    console.error('Block slots error:', error);
    return res.status(500).json({ error: 'Failed to block slots', details: error.message });
  }
}
