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

const DEFAULT_PRICING = {
  workingHours: { start: 0, end: 24 },
  sportAvailability: { cricket: true, football7s: true, football11s: true },
  dayNightCutoffHour: 18,
  rates: {
    cricketDay: 1000,
    cricketNight: 1600,
    football7sDay: 1000,
    football7sNight: 1600,
    football11sDay: 1000,
    football11sNight: 1600,
  },
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
  rates: {
    cricketDay: number;
    cricketNight: number;
    football7sDay: number;
    football7sNight: number;
    football11sDay: number;
    football11sNight: number;
  };
  dayNightCutoffHour?: number;
  workingHours?: { start: number; end: number };
  sportAvailability?: { cricket: boolean; football7s: boolean; football11s: boolean };
}) {
  try {
    const pricingData = {
      workingHours: data.workingHours || { start: 0, end: 24 },
      sportAvailability: data.sportAvailability || { cricket: true, football7s: true, football11s: true },
      dayNightCutoffHour: data.dayNightCutoffHour || 18,
      rates: data.rates,
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
