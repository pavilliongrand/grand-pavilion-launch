import type { VercelResponse } from '@vercel/node';

/**
 * Apply CORS headers to a response.
 * Uses ALLOWED_ORIGIN env var in production; falls back to blocking all cross-origin requests.
 */
export function applyCors(res: VercelResponse, methods: string = 'GET,POST,OPTIONS') {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
}
