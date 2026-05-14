import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * DEPRECATED — This legacy endpoint has been disabled.
 * Use /api/book (requires Firebase phone auth) instead.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({ error: 'This endpoint has been deprecated. Use /api/book instead.' });
}
