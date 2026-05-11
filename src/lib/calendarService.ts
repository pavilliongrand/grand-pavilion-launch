import { google } from 'googleapis';

// Server-side Google Calendar API using Service Account
// This runs on Vercel serverless functions, not client-side

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// Initialize Google Calendar client with Service Account
function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

/**
 * Get occupied slot IDs for a specific date and sport
 */
export async function getOccupiedSlotsFromCalendar(date: string, sport: string): Promise<string[]> {
  try {
    const calendar = getCalendarClient();
    
    const timeMin = new Date(date);
    timeMin.setHours(6, 0, 0, 0);
    
    const timeMax = new Date(date);
    timeMax.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    // Filter by sport and extract slot IDs
    const occupiedSlotIds: string[] = [];
    
    events.forEach((event: any) => {
      const eventSport = event.extendedProperties?.private?.sport;
      const slotId = event.extendedProperties?.private?.slotId;
      
      if (eventSport === sport && slotId) {
        occupiedSlotIds.push(slotId);
      }
    });

    return occupiedSlotIds;
  } catch (error) {
    console.error('Error fetching occupied slots from calendar:', error);
    return [];
  }
}

/**
 * Create a booking event in YOUR Google Calendar
 * This is your main database - all bookings stored here
 */
export async function createCalendarBooking(data: {
  sport: string;
  date: string;
  slotId: string;
  phone: string;
  amount: number;
  paymentMethod: string;
}): Promise<string> {
  try {
    const calendar = getCalendarClient();
    
    // Parse slot ID to get start and end hours
    const [startHour, endHour] = data.slotId.split('-').map(Number);
    
    // Create date-time objects (India timezone)
    const startDateTime = new Date(data.date);
    startDateTime.setHours(startHour, 0, 0, 0);
    
    const endDateTime = new Date(data.date);
    endDateTime.setHours(endHour, 0, 0, 0);

    const event = {
      summary: `🏏 ${data.sport.toUpperCase()} - ${data.phone}`,
      description: `
📱 Phone: ${data.phone}
⚽ Sport: ${data.sport}
💰 Amount: ₹${data.amount}
💳 Payment: ${data.paymentMethod}
⏰ Slot: ${data.slotId}

Booked via Grand Pavilion Website
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      extendedProperties: {
        private: {
          sport: data.sport,
          phone: data.phone,
          amount: data.amount.toString(),
          paymentMethod: data.paymentMethod,
          slotId: data.slotId,
          bookingDate: new Date().toISOString(),
        },
      },
      colorId: data.sport === 'cricket' ? '9' : '11', // Blue for cricket, Red for football
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return response.data.id || '';
  } catch (error) {
    console.error('Error creating calendar booking:', error);
    throw new Error('Failed to create booking in calendar');
  }
}

/**
 * Delete a booking from calendar
 */
export async function deleteCalendarBooking(eventId: string): Promise<void> {
  try {
    const calendar = getCalendarClient();
    
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar booking:', error);
    throw error;
  }
}

/**
 * Get all bookings for admin dashboard
 */
export async function getAllBookings(startDate: string, endDate: string) {
  try {
    const calendar = getCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}
