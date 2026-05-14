import type { VercelResponse } from '@vercel/node';

/**
 * Apply CORS headers to a response.
 * Uses ALLOWED_ORIGIN env var in production; falls back to '*' for development.
 * Note: Access-Control-Allow-Credentials is only set when a specific origin is configured,
 * as browsers reject credentials with wildcard origins.
 */
export function applyCors(res: VercelResponse, methods: string = 'GET,POST,OPTIONS') {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  if (allowedOrigin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
}
