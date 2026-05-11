import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (server-side only)
// Uses the same service account credentials as Google Calendar
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Default pricing configuration (matches existing pricing.json)
const DEFAULT_PRICING = {
  workingHours: { start: 11, end: 24 },
  sportAvailability: { cricket: true, football: true },
  hourlyPricing: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    cricketPrice: i >= 18 && i < 22 ? 1950 : 1500,
    footballPrice: i >= 18 && i < 22 ? 1300 : 1000,
  })),
  lastUpdated: new Date().toISOString(),
};

/**
 * Get pricing config from Firestore.
 * Auto-seeds default config if document doesn't exist (first-run setup).
 */
export async function getPricingConfig() {
  try {
    const doc = await db.collection('config').doc('pricing').get();
    
    if (!doc.exists) {
      // First run: seed default pricing
      await db.collection('config').doc('pricing').set(DEFAULT_PRICING);
      return DEFAULT_PRICING;
    }
    
    return doc.data();
  } catch (error) {
    console.error('Error reading pricing from Firestore:', error);
    // Return defaults as fallback so the app never fully breaks
    return DEFAULT_PRICING;
  }
}

/**
 * Save pricing config to Firestore.
 */
export async function savePricingConfig(data: {
  hourlyPricing: any[];
  workingHours?: { start: number; end: number };
  sportAvailability?: { cricket: boolean; football: boolean };
}) {
  try {
    const pricingData = {
      workingHours: data.workingHours || { start: 6, end: 24 },
      sportAvailability: data.sportAvailability || { cricket: true, football: true },
      hourlyPricing: data.hourlyPricing,
      lastUpdated: new Date().toISOString(),
    };

    await db.collection('config').doc('pricing').set(pricingData, { merge: true });
    
    return { success: true, lastUpdated: pricingData.lastUpdated };
  } catch (error) {
    console.error('Error saving pricing to Firestore:', error);
    throw new Error('Failed to save pricing configuration');
  }
}

export { db };
