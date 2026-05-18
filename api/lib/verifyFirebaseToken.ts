import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Ensure Firebase Admin is initialized.
// Prefers FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY (Firebase-specific
// service account). Falls back to the Google Calendar service account.
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * Returns the decoded token containing the user's phone number.
 * Throws on invalid/expired/missing tokens.
 */
export async function verifyFirebaseToken(authHeader: string | undefined): Promise<{
  uid: string;
  phone: string;
}> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const idToken = authHeader.slice(7);
  const decodedToken = await getAuth().verifyIdToken(idToken);

  const phone = decodedToken.phone_number;
  if (!phone) {
    throw new Error('Token does not contain a phone number');
  }

  return {
    uid: decodedToken.uid,
    phone, // Format: "+91XXXXXXXXXX"
  };
}
