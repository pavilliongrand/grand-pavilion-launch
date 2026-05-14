import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPricingConfig, savePricingConfig } from './lib/firestore.js';
import { extractAndVerifyAdmin } from './lib/verifyAdminToken.js';
import { applyCors } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const pricing = await getPricingConfig();
      return res.status(200).json(pricing);
    }

    if (req.method === 'POST') {
      // Admin authentication via JWT
      try {
        extractAndVerifyAdmin(req.headers.authorization);
      } catch (authError: any) {
        return res.status(401).json({ error: authError.message || 'Unauthorized' });
      }

      const { rates, dayNightCutoffHour, workingHours, sportAvailability } = req.body;

      if (!rates) {
        return res.status(400).json({ error: 'Invalid pricing data' });
      }

      const result = await savePricingConfig({ rates, dayNightCutoffHour, workingHours, sportAvailability });

      return res.status(200).json({
        success: true,
        message: 'Pricing and working hours updated successfully',
        lastUpdated: result.lastUpdated,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Pricing API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
