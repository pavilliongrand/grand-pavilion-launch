import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyOTP } from './lib/twilioService.js';
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
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const result = await verifyOTP(phone, otp);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message, phone: result.phone });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('Verify OTP API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
