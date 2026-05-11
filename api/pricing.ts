import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPricingConfig, savePricingConfig } from './lib/firestore.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const pricing = await getPricingConfig();
      return res.status(200).json(pricing);
    }

    if (req.method === 'POST') {
      const { hourlyPricing, workingHours, sportAvailability } = req.body;
      
      if (!hourlyPricing || !Array.isArray(hourlyPricing)) {
        return res.status(400).json({ error: 'Invalid pricing data' });
      }

      const result = await savePricingConfig({ hourlyPricing, workingHours, sportAvailability });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Pricing and working hours updated successfully',
        lastUpdated: result.lastUpdated
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Pricing API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
