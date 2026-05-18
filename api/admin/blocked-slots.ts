import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { extractAndVerifyAdmin } from '../lib/verifyAdminToken.js';
import { applyCors } from '../lib/cors.js';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const PRIVATE_KEY = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin authentication via JWT
  try {
    extractAndVerifyAdmin(req.headers.authorization);
  } catch (authError: any) {
    return res.status(401).json({ error: authError.message || 'Unauthorized' });
  }

  try {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    const blockedSlots = events
      .filter((event) => event.extendedProperties?.private?.blocked === 'true')
      .map((event) => {
        const startTime = new Date(event.start?.dateTime || event.start?.date || '');
        const endTime = new Date(event.end?.dateTime || event.end?.date || '');
        // IST-safe hour extraction
        const startHourIST = new Date(startTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
        const endHourIST = new Date(endTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
        const dateIST = new Date(startTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const dateStr = `${dateIST.getFullYear()}-${String(dateIST.getMonth() + 1).padStart(2, '0')}-${String(dateIST.getDate()).padStart(2, '0')}`;

        return {
          id: event.id,
          sport: event.extendedProperties?.private?.sport || '',
          date: dateStr,
          slotIds: [event.extendedProperties?.private?.slotId || ''],
          slotTimes: [`${startHourIST}:00 - ${endHourIST === 0 ? 24 : endHourIST}:00`],
          reason: event.extendedProperties?.private?.reason || '',
          customerName: event.extendedProperties?.private?.customerName || '',
          customerPhone: event.extendedProperties?.private?.customerPhone || '',
          createdAt: event.created || '',
        };
      });

    return res.status(200).json({ blockedSlots });
  } catch (error: any) {
    console.error('Fetch blocked slots error:', error);
    return res.status(500).json({ error: 'Failed to fetch blocked slots', details: error.message });
  }
}
