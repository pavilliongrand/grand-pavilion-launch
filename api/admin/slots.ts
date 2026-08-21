import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { extractAndVerifyAdmin } from '../lib/verifyAdminToken.js';
import { applyCors } from '../lib/cors.js';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const PRIVATE_KEY = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\\\n/g, '\\n');

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

interface BlockSlotRequest {
  sport: 'cricket' | 'football' | 'football-7s' | 'football-11s' | 'football-5s';
  date: string;
  slotIds: string[];
  reason: string;
  customerName?: string;
  customerPhone?: string;
  isBooking?: boolean;
  amount?: number;
}

/**
 * Consolidated admin slots endpoint:
 *   GET    /api/admin/slots  — list blocked slots (next 30 days)
 *   POST   /api/admin/slots  — block slots / create admin bookings
 *   DELETE /api/admin/slots  — unblock a slot by eventId
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET,POST,DELETE,OPTIONS');

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
      return handleListBlockedSlots(res);
    }

    if (req.method === 'POST') {
      return handleBlockSlots(req, res);
    }

    if (req.method === 'DELETE') {
      return handleUnblockSlot(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admin slots error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// ── GET: List blocked slots ────────────────────────────────
async function handleListBlockedSlots(res: VercelResponse) {
  const calendar = getCalendarClient();

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
}

// ── POST: Block slots / create admin bookings ──────────────
async function handleBlockSlots(req: VercelRequest, res: VercelResponse) {
  const { sport, date, slotIds, reason, customerName, customerPhone, isBooking, amount }: BlockSlotRequest = req.body;

  if (!sport || !date || !slotIds || slotIds.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const calendar = getCalendarClient();
  const blockedEvents = [];

  for (let i = 0; i < slotIds.length; i++) {
    const slotId = slotIds[i];
    const [startHour] = slotId.split('-').map(Number);
    const startTime = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00+05:30`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

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
      colorId: isBooking ? (sport === 'cricket' ? '9' : sport === 'football-5s' ? '6' : '11') : '11',
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
}

// ── DELETE: Unblock a slot ─────────────────────────────────
async function handleUnblockSlot(req: VercelRequest, res: VercelResponse) {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const calendar = getCalendarClient();

  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId: eventId,
  });

  return res.status(200).json({ success: true, message: 'Slot unblocked successfully' });
}
