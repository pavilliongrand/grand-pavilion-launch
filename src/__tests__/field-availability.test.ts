import { describe, it, expect } from 'vitest';

// ─── Field availability types (mirrors api/lib/calendarService.ts) ────────
interface OccupiedSlotInfo {
  slotId: string;
  reason: string;
  blocked: boolean;
  bookingCount: number;
  bookingSport?: string;
  football5sCount?: number;
  football7sCount?: number;
  otherSport?: boolean;
}

interface SlotRequest {
  sport: string;
  occupied?: OccupiedSlotInfo;
}

// ─── Core logic extracted from api/slots.ts for testing ───────────────────
const MAX_FIELDS = 2;

function isSlotAvailable(req: SlotRequest): { available: boolean; reason?: string } {
  const { sport, occupied } = req;
  const is7s = sport === 'football-7s';
  const is5s = sport === 'football-5s';
  const isFootball = is7s || is5s;

  if (!occupied) {
    return { available: true };
  }

  if (occupied.blocked) {
    return { available: false, reason: occupied.reason };
  }

  // Cricket/11s: any existing booking fully blocks the slot
  if (occupied.otherSport) {
    return { available: false, reason: occupied.reason };
  }

  if (isFootball) {
    const totalFieldBookings = (occupied.football5sCount || 0) + (occupied.football7sCount || 0);
    const freeFields = Math.max(0, MAX_FIELDS - totalFieldBookings);

    if (is7s) {
      return { available: freeFields > 0 };
    }

    // 5s: no existing 5s (one goalpost) AND a free field exists
    const has5s = (occupied.football5sCount || 0) >= 1;
    return { available: !has5s && freeFields > 0 };
  }

  // Cricket/11s: no double booking
  return { available: false, reason: 'Already booked' };
}

// ─── Price calculation extracted from api/book.ts ─────────────────────────
function calculatePrice(
  sport: string,
  startHour: number,
  rates: {
    cricketDay: number; cricketNight: number;
    football7sDay: number; football7sNight: number;
    football11sDay: number; football11sNight: number;
    football5sDay: number; football5sNight: number;
  },
  cutoff: number = 18
): number {
  const isNight = startHour >= cutoff || startHour < 6;
  if (sport === 'cricket') return isNight ? rates.cricketNight : rates.cricketDay;
  if (sport === 'football-11s') return isNight ? rates.football11sNight : rates.football11sDay;
  if (sport === 'football-5s') return isNight ? rates.football5sNight : rates.football5sDay;
  return isNight ? rates.football7sNight : rates.football7sDay;
}

const DEFAULT_RATES = {
  cricketDay: 1600, cricketNight: 1950,
  football7sDay: 1600, football7sNight: 1950,
  football11sDay: 2200, football11sNight: 2600,
  football5sDay: 1600, football5sNight: 1950,
};

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Field Availability', () => {

  describe('Empty slots (no existing bookings)', () => {
    it('allows 5s on an empty slot', () => {
      expect(isSlotAvailable({ sport: 'football-5s' })).toEqual({ available: true });
    });
    it('allows 7s on an empty slot', () => {
      expect(isSlotAvailable({ sport: 'football-7s' })).toEqual({ available: true });
    });
    it('allows cricket on an empty slot', () => {
      expect(isSlotAvailable({ sport: 'cricket' })).toEqual({ available: true });
    });
    it('allows 11s on an empty slot', () => {
      expect(isSlotAvailable({ sport: 'football-11s' })).toEqual({ available: true });
    });
  });

  describe('Admin blocks', () => {
    it('blocks any sport when admin has blocked the slot', () => {
      const occupied: OccupiedSlotInfo = { slotId: '9-10', reason: 'Maintenance', blocked: true, bookingCount: 0 };
      expect(isSlotAvailable({ sport: 'football-5s', occupied })).toEqual({ available: false, reason: 'Maintenance' });
      expect(isSlotAvailable({ sport: 'football-7s', occupied })).toEqual({ available: false, reason: 'Maintenance' });
      expect(isSlotAvailable({ sport: 'cricket', occupied })).toEqual({ available: false, reason: 'Maintenance' });
    });
  });

  describe('Cricket/11s block everything', () => {
    it('cricket blocks 5s', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'cricket', otherSport: true,
      };
      expect(isSlotAvailable({ sport: 'football-5s', occupied }).available).toBe(false);
    });
    it('cricket blocks 7s', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'cricket', otherSport: true,
      };
      expect(isSlotAvailable({ sport: 'football-7s', occupied }).available).toBe(false);
    });
    it('11s blocks 5s', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'football-11s', otherSport: true,
      };
      expect(isSlotAvailable({ sport: 'football-5s', occupied }).available).toBe(false);
    });
    it('11s blocks 7s', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'football-11s', otherSport: true,
      };
      expect(isSlotAvailable({ sport: 'football-7s', occupied }).available).toBe(false);
    });
    it('cricket blocks cricket (no double booking)', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'cricket', otherSport: true,
      };
      expect(isSlotAvailable({ sport: 'cricket', occupied }).available).toBe(false);
    });
  });

  describe('Football-only interactions (5s and 7s share 2 fields)', () => {
    it('7s+7s: allows second 7s when one field is occupied', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, football7sCount: 1, football5sCount: 0,
      };
      expect(isSlotAvailable({ sport: 'football-7s', occupied })).toEqual({ available: true });
    });
    it('7s+7s: blocks third 7s (only 2 fields)', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 2, football7sCount: 2, football5sCount: 0,
      };
      expect(isSlotAvailable({ sport: 'football-7s', occupied })).toEqual({ available: false });
    });
    it('5s+7s: allows 7s when one 5s exists (different fields)', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, football7sCount: 0, football5sCount: 1,
      };
      expect(isSlotAvailable({ sport: 'football-7s', occupied })).toEqual({ available: true });
    });
    it('5s+7s: allows 5s when one 7s exists (different fields)', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, football7sCount: 1, football5sCount: 0,
      };
      expect(isSlotAvailable({ sport: 'football-5s', occupied })).toEqual({ available: true });
    });
    it('5s+5s: blocks second 5s (one goalpost)', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, football7sCount: 0, football5sCount: 1,
      };
      expect(isSlotAvailable({ sport: 'football-5s', occupied })).toEqual({ available: false });
    });
    it('5s+7s+7s: blocks 5s when both fields are occupied', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 2, football7sCount: 2, football5sCount: 0,
      };
      expect(isSlotAvailable({ sport: 'football-5s', occupied })).toEqual({ available: false });
    });
    it('5s+7s: blocks 7s when both fields are occupied (5s+7s)', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 2, football7sCount: 1, football5sCount: 1,
      };
      expect(isSlotAvailable({ sport: 'football-7s', occupied })).toEqual({ available: false });
    });
  });

  describe('Mixed sport + field interactions', () => {
    it('cricket exists, then 5s requested: blocked', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'cricket', otherSport: true,
        football5sCount: 0, football7sCount: 0,
      };
      expect(isSlotAvailable({ sport: 'football-5s', occupied }).available).toBe(false);
    });
    it('cricket exists, then 7s requested: blocked', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'cricket', otherSport: true,
        football5sCount: 0, football7sCount: 0,
      };
      expect(isSlotAvailable({ sport: 'football-7s', occupied }).available).toBe(false);
    });
    it('7s exists, then cricket requested: blocked', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'football-7s', otherSport: false,
        football5sCount: 0, football7sCount: 1,
      };
      expect(isSlotAvailable({ sport: 'cricket', occupied }).available).toBe(false);
    });
    it('5s exists, then 11s requested: blocked', () => {
      const occupied: OccupiedSlotInfo = {
        slotId: '9-10', reason: 'Booked', blocked: false,
        bookingCount: 1, bookingSport: 'football-5s', otherSport: false,
        football5sCount: 1, football7sCount: 0,
      };
      expect(isSlotAvailable({ sport: 'football-11s', occupied }).available).toBe(false);
    });
  });
});

describe('Price Calculation', () => {
  it('cricket day rate at 10 AM', () => {
    expect(calculatePrice('cricket', 10, DEFAULT_RATES)).toBe(1600);
  });
  it('cricket night rate at 7 PM', () => {
    expect(calculatePrice('cricket', 19, DEFAULT_RATES)).toBe(1950);
  });
  it('football-7s day rate at 3 PM', () => {
    expect(calculatePrice('football-7s', 15, DEFAULT_RATES)).toBe(1600);
  });
  it('football-7s night rate at 8 PM', () => {
    expect(calculatePrice('football-7s', 20, DEFAULT_RATES)).toBe(1950);
  });
  it('football-11s day rate at 11 AM', () => {
    expect(calculatePrice('football-11s', 11, DEFAULT_RATES)).toBe(2200);
  });
  it('football-11s night rate at 9 PM', () => {
    expect(calculatePrice('football-11s', 21, DEFAULT_RATES)).toBe(2600);
  });
  it('football-5s day rate at 2 PM', () => {
    expect(calculatePrice('football-5s', 14, DEFAULT_RATES)).toBe(1600);
  });
  it('football-5s night rate at 8 PM', () => {
    expect(calculatePrice('football-5s', 20, DEFAULT_RATES)).toBe(1950);
  });
  it('football-5s night rate at 5 AM (pre-dawn lights)', () => {
    expect(calculatePrice('football-5s', 5, DEFAULT_RATES)).toBe(1950);
  });
  it('football-5s day rate at 6 AM (cutoff boundary)', () => {
    expect(calculatePrice('football-5s', 6, DEFAULT_RATES)).toBe(1600);
  });
  it('football-5s night rate at 6 PM (cutoff boundary)', () => {
    expect(calculatePrice('football-5s', 18, DEFAULT_RATES)).toBe(1950);
  });
});
