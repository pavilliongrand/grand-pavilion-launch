import type { VercelRequest, VercelResponse } from '@vercel/node';

// For now, pricing is stored in-memory
// TODO: Store in database or Firebase Realtime Database
let pricingRules: any[] = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  cricketPrice: i >= 18 && i <= 22 ? 1950 : 1500,
  footballPrice: i >= 18 && i <= 22 ? 1300 : 1000,
  isPeak: i >= 18 && i <= 22
}));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, pricingRules });
    }

    if (req.method === 'POST') {
      const { pricingRules: newRules } = req.body;
      
      if (!Array.isArray(newRules)) {
        return res.status(400).json({ error: 'Invalid pricing rules format' });
      }

      pricingRules = newRules;
      
      return res.status(200).json({ success: true, message: 'Pricing updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Pricing API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
