import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar as CalendarIcon, Phone, Check, Loader2, Shield, User, Sun, Lightbulb } from "lucide-react";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

interface TimeSlot {
  id: string;
  time: string;
  startHour: number;
  endHour: number;
  available: boolean;
  price: number;
  unavailableReason?: string;
}

const formatTime12Hour = (timeStr: string) => {
  if (!timeStr) return timeStr;
  // If the time string is already in AM/PM format (like from the API), return it directly
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }

  const parts = timeStr.split(' - ');
  if (parts.length !== 2) return timeStr;
  
  const formatPart = (part: string) => {
    const [hourStr, minStr] = part.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; 
    return `${String(hour).padStart(2, '0')}:${minStr} ${ampm}`;
  };
  
  return `${formatPart(parts[0])} - ${formatPart(parts[1])}`;
};

const CricketSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bat */}
    <rect x="10" y="28" width="8" height="26" rx="3" fill="currentColor" opacity="0.85" transform="rotate(-15 14 41)" />
    <rect x="12" y="18" width="4" height="12" rx="1.5" fill="currentColor" opacity="0.6" transform="rotate(-15 14 24)" />
    {/* Ball */}
    <circle cx="44" cy="20" r="10" fill="currentColor" opacity="0.9" />
    <path d="M37 14 C40 20 48 20 51 14" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
    <path d="M37 26 C40 20 48 20 51 26" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
  </svg>
);

const FootballSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Ball */}
    <circle cx="32" cy="32" r="22" fill="currentColor" opacity="0.15" />
    <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.5" fill="none" />
    {/* Pentagon pattern */}
    <path d="M32 18L40 24L38 34H26L24 24Z" fill="currentColor" opacity="0.7" />
    {/* Lines to edge */}
    <line x1="32" y1="18" x2="32" y2="10" stroke="currentColor" strokeWidth="2" />
    <line x1="40" y1="24" x2="52" y2="21" stroke="currentColor" strokeWidth="2" />
    <line x1="38" y1="34" x2="48" y2="44" stroke="currentColor" strokeWidth="2" />
    <line x1="26" y1="34" x2="16" y2="44" stroke="currentColor" strokeWidth="2" />
    <line x1="24" y1="24" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const Booking = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Read ?sport= query param to pre-select sport (e.g. from Services page)
  const initialSport = (() => {
    const sp = searchParams.get('sport');
    if (sp === 'football-7s' || sp === 'football-11s') return sp;
    if (sp === 'football') return 'football-7s' as const;
    return 'cricket' as const;
  })();
  const [sport, setSport] = useState<"cricket" | "football-7s" | "football-11s">(initialSport);
  // Use IST date for initial value — toISOString() gives UTC which is wrong for users after midnight IST
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
  const [selectedSlots, setSelectedSlots] = useState<Array<{slotId: string}>>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [pricing, setPricing] = useState<{ rates?: { cricketDay: number; cricketNight: number; football7sDay: number; football7sNight: number; football11sDay: number; football11sNight: number }; dayNightCutoffHour?: number } | null>(null);
  
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  }, []);

  useEffect(() => {
    if (date && sport) {
      fetchSlots();
      setSelectedSlots([]);
    }
  }, [date, sport]);

  useEffect(() => {
    fetch('/api/pricing')
      .then(r => r.json())
      .then(data => setPricing(data))
      .catch(() => {});
  }, []);

  const getSportPriceRange = (sportVal: string) => {
    if (!pricing?.rates) return null;
    const r = pricing.rates;
    if (sportVal === 'cricket') return { day: r.cricketDay, night: r.cricketNight };
    if (sportVal === 'football-7s') return { day: r.football7sDay, night: r.football7sNight };
    if (sportVal === 'football-11s') return { day: r.football11sDay, night: r.football11sNight };
    return null;
  };

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/slots?date=${date}&sport=${sport}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load slots. Please try again.');
        setAvailableSlots([]);
        return;
      }
      const availableSlotsWithWeekendRule = enforceWeekendRule(data.slots || [], date);
      setAvailableSlots(availableSlotsWithWeekendRule);
    } catch (err) {
      setError('Unable to reach the server. Please check your connection.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const enforceWeekendRule = (slots: TimeSlot[], targetDateStr: string) => {
    const targetDate = new Date(targetDateStr);
    const dayOfWeek = targetDate.getDay();
    const today = new Date();
    const todayDayOfWeek = today.getDay();

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWeekendAllowed = !isWeekend || (todayDayOfWeek === 5 || todayDayOfWeek === 6 || todayDayOfWeek === 0);

    if (!isWeekendAllowed) {
      return slots.map(s => ({ ...s, available: false, unavailableReason: 'Booking opens Friday' }));
    }
    return slots;
  };

  const toggleSlot = (slotId: string) => {
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.slotId === slotId);
      if (exists) {
        return prev.filter(s => s.slotId !== slotId);
      } else {
        return [...prev, { slotId }];
      }
    });
  };

  const calculateTotal = () => {
    return selectedSlots.reduce((sum, selected) => {
      const matchedSlot = availableSlots.find(slot => slot.id === selected.slotId);
      return sum + (matchedSlot?.price || 0);
    }, 0);
  };

  const getSelectedTimings = () => {
    return selectedSlots.map(selected => {
      const slot = availableSlots.find(s => s.id === selected.slotId);
      return slot ? formatTime12Hour(slot.time) : '';
    }).filter(Boolean);
  };

  const sendOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const formattedPhone = `+91${phone}`;
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep(2);
    } catch (err: any) {
      console.error('Firebase OTP error:', err);
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch {
          // Ignore cleanup failures; a fresh verifier is created below.
        }
        // Clean up the DOM to avoid stacking invisible iframes
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }
      setError(err.message || 'Failed to send OTP. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!confirmationResult) return;
    setLoading(true);
    setError(null);
    try {
      const credential = await confirmationResult.confirm(otp);
      const idToken = await credential.user.getIdToken();
      try {
        await createBooking(idToken);
      } catch (bookingErr: any) {
        setError(bookingErr.message || 'Booking failed. Please try again.');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (idToken: string) => {
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name,
          sport,
          date,
          slots: selectedSlots,
          phone,
          paymentMethod: 'cash'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Booking failed');
      }
      setStep(3);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to create booking. Please try again or contact support.");
    }
  };

  const getNext7Days = () => {
    const dates = [];
    const today = new Date();
    const todayDay = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    let daysToAdd = 0;
    if (todayDay === 5) {
      daysToAdd = 7; // Fri to next Fri
    } else if (todayDay === 6) {
      daysToAdd = 6; // Sat to next Fri
    } else if (todayDay === 0) {
      daysToAdd = 5; // Sun to next Fri
    } else {
      daysToAdd = 5 - todayDay;
    }

    for (let i = 0; i <= daysToAdd; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const next7Days = getNext7Days();
  const getTodayDateStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans">
      <div id="recaptcha-container" />

      {/* Logo Header */}
      <div className="bg-white px-4 py-5 flex items-center justify-center border-b border-gray-100 mb-2">
        <Link to="/" className="flex flex-col items-center gap-1.5">
          <img src="/logo-transparent.png" alt="Grand Pavilion" className="h-16 w-auto object-contain brightness-0" />
        </Link>
      </div>

      {step === 1 && (
        <div className="pb-10">

          {/* Title */}
          <div className="px-4 pt-5 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Reserve your slot</h1>
            <p className="text-sm text-gray-500 mt-0.5">Premium sports turf booking</p>
          </div>

          {error && (
            <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Sport Selector */}
          <div className="px-4 mb-5">
            <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
              {[
                { value: "cricket", label: "Cricket", Icon: CricketSVG },
                { value: "football-7s", label: "Football (7s)", Icon: FootballSVG },
                { value: "football-11s", label: "Football (11s)", Icon: FootballSVG },
              ].map(s => {
                const priceRange = getSportPriceRange(s.value);
                const isSel = sport === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setSport(s.value as any)}
                    className={`flex-shrink-0 flex flex-col p-3 rounded-2xl border-2 min-w-[120px] transition-all text-left ${
                      isSel ? 'border-[#84cc16] bg-[#F7FEE7] shadow-sm' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-6 h-6 flex items-center justify-center ${isSel ? 'text-[#84cc16]' : 'text-gray-400'}`}>
                        <s.Icon className="w-full h-full" />
                      </span>
                      {isSel && (
                        <div className="w-5 h-5 bg-[#84cc16] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-gray-900 text-sm">{s.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Strip */}
          <div className="px-4 mb-5">
            <div ref={dateScrollRef} className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {next7Days.map((d, i) => {
                const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                const isSel = date === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setDate(dateStr)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[52px] py-2.5 px-2 rounded-xl transition-all ${
                      isSel ? 'bg-[#84cc16] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSel ? 'text-white/80' : 'text-gray-400'}`}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-base font-bold leading-tight">{d.getDate()}</span>
                    {i <= 1 && (
                      <span className={`text-[9px] font-medium ${isSel ? 'text-white/80' : 'text-gray-400'}`}>
                        {i === 0 ? 'Today' : 'Tomorrow'}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => dateInputRef.current?.showPicker()}
                className="flex-shrink-0 flex items-center justify-center min-w-[48px] rounded-xl bg-white border border-gray-200 text-gray-400 hover:border-gray-300"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <input
                type="date"
                ref={dateInputRef}
                min={getTodayDateStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />
            </div>
          </div>

          {/* Weekend warning */}
          {(() => {
            const d = new Date(date);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const todayDayOfWeek = new Date().getDay();
            const isWeekendAllowed = !isWeekend || (todayDayOfWeek === 5 || todayDayOfWeek === 6 || todayDayOfWeek === 0);
            if (!isWeekendAllowed) {
              return (
                <div className="mx-4 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <span className="text-amber-500 text-base leading-none">⚠</span>
                  <p className="text-amber-700 text-sm font-medium">Weekend slots open for booking on Friday.</p>
                </div>
              );
            }
            return null;
          })()}

          {/* Available Slots */}
          <div className="px-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-[#84cc16]" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No slots available for this date.</div>
            ) : (() => {
              const sortedSlots = [...availableSlots].sort((a, b) => a.startHour - b.startHour);
              const isToday = date === getTodayDateStr();
              const currentHour = new Date().getHours();
              const visibleSlots = sortedSlots.filter(s => !isToday || s.startHour > currentHour);
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-900">Available Slots</h2>
                  </div>
                  <div className="space-y-2">
                    {visibleSlots.map(slot => {
                      const isSel = selectedSlots.some(s => s.slotId === slot.id);
                      const isNight = slot.startHour >= 18 || slot.startHour < 6;
                      const [startTime, endTime] = formatTime12Hour(slot.time).split(' - ');
                      return (
                        <button
                          key={slot.id}
                          onClick={() => slot.available && toggleSlot(slot.id)}
                          disabled={!slot.available}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${
                            isSel
                              ? 'border-[#84cc16] bg-[#F7FEE7]'
                              : slot.available
                              ? 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                              : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isNight ? 'bg-indigo-50' : 'bg-amber-50'}`}>
                              {isNight ? <Lightbulb className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                            </div>
                            <div className="text-left">
                              <div className={`font-semibold text-sm ${isSel ? 'text-gray-900' : slot.available ? 'text-gray-800' : 'text-gray-400'}`}>
                                {startTime} – {endTime}
                              </div>
                              {!slot.available && <div className="text-xs text-red-400 font-medium">{slot.unavailableReason === 'Booking opens Friday' ? slot.unavailableReason : (slot.unavailableReason === 'Tournament' || slot.unavailableReason === 'Camp') ? slot.unavailableReason : 'Booked'}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className={`font-bold text-sm ${isSel ? 'text-[#65a30d]' : 'text-gray-700'}`}>₹{slot.price.toLocaleString()}</span>
                            {isSel && (
                              <div className="w-6 h-6 bg-[#84cc16] rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Booking Summary + Form */}
          {selectedSlots.length > 0 && (
            <div className="px-4 mt-5 space-y-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                  <div>
                    <div className="text-xs text-gray-400 font-medium">{selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} Selected</div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">{getSelectedTimings().join(', ')}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Pay at venue</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">₹{calculateTotal().toLocaleString()}</div>
                </div>
                <div className="flex items-center px-4 py-3.5 border-b border-gray-100 gap-3">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-500">+91</span>
                  <div className="w-px h-4 bg-gray-200" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                  />
                </div>
              </div>
              <button
                onClick={sendOTP}
                disabled={loading || !phone || phone.length !== 10 || !name}
                className="w-full py-4 bg-gradient-to-r from-[#84cc16] to-[#65a30d] disabled:from-gray-200 disabled:to-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-[#84cc16]/30 flex items-center justify-center gap-2 text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Send OTP →
              </button>
            </div>
          )}
        </div>
      )}
      {/* Step 2: OTP Verification */}
      {step === 2 && (
        <div className="max-w-md mx-auto px-4 mt-8">
            <div className="bg-white rounded-2xl p-5 sm:p-8 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F7FEE7] rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-[#84cc16]" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">Verification</h2>
              <p className="text-gray-500 mb-8">Enter the 6-digit code sent to +91 {phone}</p>
              
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-center text-3xl font-bold tracking-[0.5em] focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] focus:outline-none mb-8 transition-all"
              />
              
              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white disabled:from-gray-200 disabled:to-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#84cc16]/30 flex items-center justify-center gap-2 text-lg"
              >
                {loading && <Loader2 className="w-6 h-6 animate-spin" />}
                {loading ? 'Verifying...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="max-w-md mx-auto px-4 mt-8">
            <div className="bg-white rounded-2xl p-5 sm:p-8 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-8">
                <Check className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900">Confirmed!</h2>
              <p className="text-gray-500 mb-5 sm:mb-8">Your slot has been successfully reserved</p>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 sm:p-6 mb-5 sm:mb-8 text-left">
                <h3 className="text-lg font-bold mb-6 pb-4 border-b border-gray-200 text-gray-900">Booking Details</h3>
                <div className="space-y-4 text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Name</span>
                    <span className="font-semibold text-gray-900">{name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Phone</span>
                    <span className="font-semibold text-gray-900">+91 {phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sport</span>
                    <span className="font-semibold text-gray-900">{sport === 'cricket' ? 'Cricket' : sport === 'football-7s' ? 'Football (7s)' : 'Football (11s)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Date</span>
                    <span className="font-semibold text-gray-900">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span>Timings</span>
                    <div className="font-semibold text-gray-900 text-right">
                      {getSelectedTimings().map((t, i) => <div key={i}>{t}</div>)}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold text-[#84cc16]">₹{calculateTotal()}</span>
                    </div>
                    <p className="text-sm font-semibold text-center text-gray-500 bg-gray-50 py-2 rounded-lg">Pay at venue</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 mb-6 text-left">
                <span className="text-blue-400 text-lg leading-none mt-0.5">📞</span>
                <p className="text-sm text-blue-700 font-medium">We will call you to confirm your appointment. Please keep your phone reachable.</p>
              </div>

              <Link to="/">
                <button className="w-full px-6 py-4 bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#84cc16]/30 text-lg">
                  Return to Home
                </button>
              </Link>
            </div>
          </div>
        )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Booking;

