import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK — uses FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY
// (the firebase-adminsdk service account downloaded from Firebase Console →
//  Project Settings → Service Accounts → Generate new private key).
// These credentials have full Firestore access by default.
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

const DEFAULT_PRICING = {
  workingHours: { start: 0, end: 24 },
  sportAvailability: { cricket: true, football7s: true, football11s: true, football5s: true },
  dayNightCutoffHour: 18,
  rates: {
    cricketDay: 1000,
    cricketNight: 1600,
    football7sDay: 1000,
    football7sNight: 1600,
    football11sDay: 1000,
    football11sNight: 1600,
    football5sDay: 1000,
    football5sNight: 1600,
  },
  lastUpdated: new Date().toISOString(),
};

export async function getPricingConfig() {
  try {
    const doc = await db.collection('config').doc('pricing').get();
    if (!doc.exists) {
      await db.collection('config').doc('pricing').set(DEFAULT_PRICING);
      return DEFAULT_PRICING;
    }
    return doc.data();
  } catch (error) {
    console.error('Error reading pricing from Firestore:', error);
    return DEFAULT_PRICING;
  }
}

export async function savePricingConfig(data: {
  rates: {
    cricketDay: number;
    cricketNight: number;
    football7sDay: number;
    football7sNight: number;
    football11sDay: number;
    football11sNight: number;
    football5sDay: number;
    football5sNight: number;
  };
  dayNightCutoffHour?: number;
  workingHours?: { start: number; end: number };
  sportAvailability?: { cricket: boolean; football7s: boolean; football11s: boolean; football5s: boolean };
}) {
  const pricingData = {
    workingHours: data.workingHours || { start: 0, end: 24 },
    sportAvailability: data.sportAvailability || { cricket: true, football7s: true, football11s: true, football5s: true },
    dayNightCutoffHour: data.dayNightCutoffHour ?? 18,
    rates: data.rates,
    lastUpdated: new Date().toISOString(),
  };
  await db.collection('config').doc('pricing').set(pricingData, { merge: true });
  return { success: true, lastUpdated: pricingData.lastUpdated };
}

export { db };
