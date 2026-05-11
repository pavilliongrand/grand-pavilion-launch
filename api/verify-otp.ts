import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyOTP } from './lib/twilioService.js';

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
