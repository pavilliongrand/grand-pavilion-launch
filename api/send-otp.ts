import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendOTP } from './lib/twilioService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
