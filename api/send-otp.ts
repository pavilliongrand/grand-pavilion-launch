import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendOTP } from './lib/twilioService.js';
import { applyCors } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await sendOTP(phone);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      console.error('Twilio sendOTP failed:', result.error);
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('Send OTP API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
