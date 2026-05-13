import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { extractAndVerifyAdmin } from '../lib/verifyAdminToken.js';
import { applyCors } from '../lib/cors.js';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin authentication via JWT
  try {
    extractAndVerifyAdmin(req.headers.authorization);
  } catch (authError: any) {
    return res.status(401).json({ error: authError.message || 'Unauthorized' });
  }

  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    });

    return res.status(200).json({ success: true, message: 'Slot unblocked successfully' });
  } catch (error: any) {
    console.error('Unblock slot error:', error);
    return res.status(500).json({ error: 'Failed to unblock slot', details: error.message });
  }
}
