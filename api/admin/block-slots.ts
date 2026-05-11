import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n');

interface BlockSlotRequest {
  sport: 'cricket' | 'football';
  date: string;
  slotIds: string[];
  reason: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sport, date, slotIds, reason }: BlockSlotRequest = req.body;

    if (!sport || !date || !slotIds || slotIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Create blocked event for each slot
    const blockedEvents = [];
    for (const slotId of slotIds) {
      const [startHour] = slotId.split('-').map(Number);
      const startTime = new Date(date);
      startTime.setHours(startHour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startHour + 1, 0, 0, 0);

      const event = {
        summary: `BLOCKED - ${sport.toUpperCase()}`,
        description: `🚫 Reason: ${reason}\n🏏 Sport: ${sport}\n⏰ Time: ${startHour}:00 - ${startHour + 1}:00`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Kolkata'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata'
        },
        extendedProperties: {
          private: {
            blocked: 'true',
            sport,
            slotId,
            reason
          }
        },
        colorId: '11' // Red color for blocked slots
      };

      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: event
      });

      blockedEvents.push(response.data);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Blocked ${blockedEvents.length} slot(s)`,
      blockedEvents 
    });
  } catch (error: any) {
    console.error('Block slots error:', error);
    return res.status(500).json({ 
      error: 'Failed to block slots',
      details: error.message 
    });
  }
}
