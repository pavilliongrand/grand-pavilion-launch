import { createHmac, timingSafeEqual } from 'crypto';

const ALG = 'HS256';
const TOKEN_EXPIRY_HOURS = 8;

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function getSigningSecret(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD env var is not configured');
  }
  // Derive a 256-bit signing key from the password using HMAC
  return createHmac('sha256', 'grand-pavilion-admin-jwt-salt').update(password).digest('hex');
}

/**
 * Sign a JWT with HMAC-SHA256 using a key derived from ADMIN_PASSWORD.
 * No external dependency required.
 */
export function signAdminToken(): string {
  const secret = getSigningSecret();

  const header = base64url(JSON.stringify({ alg: ALG, typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({
    sub: 'admin',
    iat: now,
    exp: now + TOKEN_EXPIRY_HOURS * 3600,
  }));

  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Verify and decode an admin JWT.
 * Returns true if the token is valid and not expired.
 * Throws on invalid/expired/missing tokens.
 */
export function verifyAdminToken(token: string): boolean {
  if (!token) throw new Error('No token provided');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');

  const [header, payload, signature] = parts;
  const secret = getSigningSecret();

  // Verify signature using timing-safe comparison
  const expectedSig = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expectedSig, 'base64url');

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature');
  }

  // Check expiry
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < now) {
    throw new Error('Token expired');
  }

  return true;
}

/**
 * Extract and verify the admin token from an Authorization header.
 * Accepts: "Bearer <token>" format.
 */
export function extractAndVerifyAdmin(authHeader: string | undefined): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  return verifyAdminToken(token);
}
