import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Get blocked slots from the next 30 days
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
    
    // Filter only blocked events
    const blockedSlots = events
      .filter(event => event.extendedProperties?.private?.blocked === 'true')
      .map(event => {
        const startTime = new Date(event.start?.dateTime || event.start?.date || '');
        const endTime = new Date(event.end?.dateTime || event.end?.date || '');
        
        return {
          id: event.id,
          sport: event.extendedProperties?.private?.sport || '',
          date: startTime.toISOString().split('T')[0],
          slotIds: [event.extendedProperties?.private?.slotId || ''],
          slotTimes: [`${startTime.getHours()}:00 - ${endTime.getHours()}:00`],
          reason: event.extendedProperties?.private?.reason || '',
          createdAt: event.created || ''
        };
      });

    return res.status(200).json({ blockedSlots });
  } catch (error: any) {
    console.error('Fetch blocked slots error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch blocked slots',
      details: error.message 
    });
  }
}
