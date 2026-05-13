import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Phone, Check, Loader2, Shield, User } from "lucide-react";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

interface TimeSlot {
  id: string;
  time: string;
  startHour: number;
  endHour: number;
  available: boolean;
  price: number;
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

const Booking = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [sport, setSport] = useState<"cricket" | "football-7s" | "football-11s">("cricket");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState<Array<{slotId: string}>>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [showAllSlots, setShowAllSlots] = useState(false);
  
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
      setSelectedSlots([]); // Clear selected slots when date or sport changes
    }
  }, [date, sport]);



  const fetchSlots = async () => {
    setLoading(true);
    try {
      try {
        const response = await fetch(`/api/slots?date=${date}&sport=${sport}`);
        const data = await response.json();
        const availableSlotsWithWeekendRule = enforceWeekendRule(data.slots || [], date);
        setAvailableSlots(availableSlotsWithWeekendRule);
      } catch (apiError) {
        console.log('API not available, using mock data');
        let mockSlots = generateMockSlots(date, sport);
        mockSlots = enforceWeekendRule(mockSlots, date);
        setAvailableSlots(mockSlots);
      }
    } catch (err) {
      setError("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const enforceWeekendRule = (slots: TimeSlot[], targetDateStr: string) => {
    const targetDate = new Date(targetDateStr);
    const dayOfWeek = targetDate.getDay();
    const todayDayOfWeek = new Date().getDay();
    
    // Only allow booking weekend slots (Sat=6, Sun=0) if today is Friday (5)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFridayToday = todayDayOfWeek === 5;
    const isWeekendAllowed = !isWeekend || isFridayToday;

    if (!isWeekendAllowed) {
      return slots.map(s => ({ ...s, available: false }));
    }
    return slots;
  };

  const generateMockSlots = (date: string, sport: string) => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const isPeak = hour >= 18 && hour <= 22;
      const cricketPrice = isPeak ? 1950 : 1500;
      const footballPrice = isPeak ? 1300 : 1000;
      
      let nextHour = hour + 1;
      let nextHourStr = String(nextHour).padStart(2, '0');
      if (nextHour === 24) {
        nextHour = 0;
        nextHourStr = '00';
      }

      slots.push({
        id: `${date}-${hour}`,
        time: `${String(hour).padStart(2, '0')}:00 - ${nextHourStr}:00`,
        startHour: hour,
        endHour: nextHour,
        available: Math.random() > 0.3, // Randomly make some booked for realism
        price: sport === 'cricket' ? cricketPrice : footballPrice
      });
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
      await createBooking(idToken);
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
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  const formatDateDisplay = (d: Date, index: number) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-gray-900 relative overflow-hidden font-sans">
      <div id="recaptcha-container"></div>
      
      {/* Clean White Header */}
      <div className="relative pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-10 w-full bg-white overflow-hidden shadow-sm flex flex-col items-center justify-center">
        {/* Soft Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3E635]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#84cc16]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center">
          <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300 mb-4">
            <img 
              src="/logo.png" 
              alt="Grand Pavilion" 
              className="h-24 sm:h-32 md:h-40 w-auto object-contain"
            />
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Reserve your slot
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl relative z-30">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            
            {/* Pick a Date */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pick a Date</h2>
                <button 
                  onClick={() => dateInputRef.current?.showPicker()} 
                  className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-green-600"
                >
                  <CalendarIcon className="w-5 h-5" />
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
              
              <div 
                ref={dateScrollRef}
                className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {next7Days.map((d, i) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const isSelected = date === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setDate(dateStr)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] py-3 px-4 rounded-xl transition-all snap-start ${
                        isSelected 
                          ? 'bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white shadow-md font-bold border-transparent' 
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      <span className={`text-xs mb-1 ${isSelected ? 'opacity-80' : 'text-gray-400'}`}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-sm">
                        {formatDateDisplay(d, i)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Sport */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Sport</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "cricket", label: "Cricket" },
                  { value: "football-7s", label: "Football (7s)" },
                  { value: "football-11s", label: "Football (11s)" }
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSport(s.value as any)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                      sport === s.value
                        ? 'border-[#A3E635] bg-[#F7FEE7]'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="font-bold text-gray-900">{s.label}</div>
                    {sport === s.value && (
                      <div className="w-5 h-5 bg-[#A3E635] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#1A2E05]" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-1.5 text-center font-semibold bg-gray-50 rounded-xl py-3">
                <div>Cricket - 1600/hr</div>
                <div>7-a-side - 1600/hr</div>
                <div>11-a-side - ₹2200/hr</div>
              </div>
            </div>

            {/* Available Time Slots */}
            {date && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Pick a Slot</h2>
                  {(() => {
                    const d = new Date(date);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isFridayToday = new Date().getDay() === 5;
                    if (isWeekend && !isFridayToday) {
                      return <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded">Weekends only available on Fridays</span>;
                    }
                    return null;
                  })()}
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#A3E635]" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No slots available for this date.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(() => {
                      // Sort slots so 17:00 (5 PM) starts first, wrapping around
                      const sortedSlots = [...availableSlots].sort((a, b) => {
                        const getSortValue = (h: number) => h >= 17 ? h - 17 : h + 7;
                        return getSortValue(a.startHour) - getSortValue(b.startHour);
                      });

                      // Visible slots logic
                      const visibleSlots = showAllSlots 
                        ? sortedSlots 
                        : sortedSlots.filter(s => {
                            // Show slots from 17:00 up to 00:00 (which is startHour 0)
                            return s.startHour >= 17 || s.startHour === 0;
                          });

                      return (
                        <>
                          {visibleSlots.map(slot => {
                            const isSelected = selectedSlots.some(s => s.slotId === slot.id);
                            
                            return (
                        <button
                          key={slot.id}
                          onClick={() => slot.available && toggleSlot(slot.id)}
                          disabled={!slot.available}
                          className={`relative p-2 sm:p-3 rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#84cc16] to-[#65a30d] border-transparent text-white shadow-md'
                              : slot.available
                              ? 'bg-white border-gray-200 text-gray-700 hover:border-[#A3E635]'
                              : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${!slot.available && 'opacity-60'}`}>
                            {formatTime12Hour(slot.time)}
                          </div>
                        </button>
                      );
                    })}
                    
                    {!showAllSlots && sortedSlots.length > 0 && (
                      <button 
                        onClick={() => setShowAllSlots(true)}
                        className="col-span-full mt-2 flex flex-col items-center justify-center p-2 rounded-xl text-[#84cc16] hover:bg-[#A3E635]/10 transition-colors group"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider mb-1">Show More Slots</span>
                        <div className="w-8 h-8 rounded-full bg-[#A3E635]/20 flex items-center justify-center group-hover:bg-[#A3E635]/30 transition-colors">
                          <span className="text-sm font-bold">▽</span>
                        </div>
                      </button>
                    )}
                    </>
                  );
                })()}
              </div>
                )}
              </div>
            )}

            {/* Booking Summary & Next */}
            {selectedSlots.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border-2 border-[#A3E635]">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h3>
                
                <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Selected Timings</div>
                  <div className="space-y-1.5">
                    {getSelectedTimings().map((timing, idx) => (
                      <div key={idx} className="font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                        {timing}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=""
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <div className="relative flex">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                          <span className="pl-12 pr-3 py-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-600 font-semibold">+91</span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder=""
                            maxLength={10}
                            className="flex-1 px-4 py-3 bg-white border border-l-0 border-gray-200 rounded-r-xl text-gray-900 placeholder:text-gray-400 focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                      <button
                        onClick={sendOTP}
                        disabled={loading || !phone || phone.length !== 10 || !name}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white disabled:from-gray-200 disabled:to-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#84cc16]/30 flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        Send OTP
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="max-w-md mx-auto mt-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="w-20 h-20 bg-[#F7FEE7] rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-[#84cc16]" />
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
          <div className="max-w-md mx-auto mt-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Confirmed!</h2>
              <p className="text-gray-500 mb-8">Your slot has been successfully reserved</p>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-lg font-bold mb-6 pb-4 border-b border-gray-200 text-gray-900">Booking Details</h3>
                <div className="space-y-4 text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Sport</span>
                    <span className="font-semibold text-gray-900 capitalize">{sport}</span>
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
                    <p className="text-sm text-center text-gray-500">Payment: Cash at venue</p>
                  </div>
                </div>
              </div>
              
              <Link to="/">
                <button className="w-full px-6 py-4 bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#84cc16]/30 text-lg">
                  Return to Home
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS to hide scrollbar for horizontal date picker */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Booking;

