import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signAdminToken } from '../lib/verifyAdminToken.js';
import { applyCors } from '../lib/cors.js';

/**
 * API Route: /api/admin/login
 * Verifies admin password and returns a signed JWT.
 * No fallback password — ADMIN_PASSWORD env var MUST be set.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD env var is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Generate a signed JWT
    const token = signAdminToken();

    return res.status(200).json({
      success: true,
      message: 'Authenticated',
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
