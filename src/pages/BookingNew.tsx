import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Phone, Check, Loader2, IndianRupee, Info, Shield, User, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

interface TimeSlot {
  id: string;
  time: string;
  startHour: number;
  endHour: number;
  available: boolean;
  price: number;
  turf?: number; // For football: 1 or 2
  availableTurfs?: number[]; // For football: which turfs are available
}

const Booking = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [sport, setSport] = useState<"cricket" | "football">("cricket");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState<Array<{slotId: string, turf?: number}>>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Set up invisible reCAPTCHA on mount (required by Firebase Phone Auth)
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
    }
  }, [date, sport]);

  // Fetch slots on initial load since date defaults to today
  useEffect(() => {
    fetchSlots();
  }, []);

  // Auto-detect OTP from clipboard
  useEffect(() => {
    if (step === 2) {
      // Try to read from clipboard when OTP step is active
      const checkClipboard = async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            // Check if clipboard contains a 6-digit number
            const otpMatch = text.match(/\b\d{6}\b/);
            if (otpMatch && otp === '') {
              setOtp(otpMatch[0]);
            }
          }
        } catch (err) {
          // Clipboard access denied or not available
          console.log('Clipboard access not available');
        }
      };

      // Check clipboard after a short delay
      const timer = setTimeout(checkClipboard, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      // For development: Generate mock slots if API fails
      try {
        const response = await fetch(`/api/slots?date=${date}&sport=${sport}`);
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } catch (apiError) {
        // Fallback to mock data for development
        console.log('API not available, using mock data');
        const mockSlots = generateMockSlots(date, sport);
        setAvailableSlots(mockSlots);
      }
    } catch (err) {
      setError("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  // Generate mock slots for development
  const generateMockSlots = (date: string, sport: string) => {
    const slots = [];
    for (let hour = 6; hour < 23; hour++) {
      const isPeak = hour >= 18 && hour <= 22;
      const cricketPrice = isPeak ? 1950 : 1500;
      const footballPrice = isPeak ? 1300 : 1000;
      
      slots.push({
        id: `${date}-${hour}`,
        time: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
        startHour: hour,
        endHour: hour + 1,
        available: true,
        price: sport === 'cricket' ? cricketPrice : footballPrice
      });
    }
    return slots;
  };

  const toggleSlot = (slotId: string, turf?: number) => {
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.slotId === slotId && s.turf === turf);
      if (exists) {
        return prev.filter(s => !(s.slotId === slotId && s.turf === turf));
      } else {
        return [...prev, { slotId, turf }];
      }
    });
  };

  const calculateTotal = () => {
    return selectedSlots.reduce((sum, selected) => {
      // For football with turf, match by base slot ID; for cricket, match directly
      const matchedSlot = availableSlots.find(slot => {
        const baseId = slot.turf ? slot.id.replace(`-turf${slot.turf}`, '') : slot.id;
        return baseId === selected.slotId && (!slot.turf || slot.turf === selected.turf);
      });
      return sum + (matchedSlot?.price || 0);
    }, 0);
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
      // Reset reCAPTCHA on error so user can retry
      if ((window as any).recaptchaVerifier) {
        try { (window as any).recaptchaVerifier.clear(); } catch (_) {}
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
      await confirmationResult.confirm(otp);
      await createBooking();
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sport,
          date,
          slots: selectedSlots,
          phone,
          amount: calculateTotal(),
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

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white relative overflow-hidden">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />
      
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
      </div>
      
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-black/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors group">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold text-sm sm:text-base">Back</span>
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                <span className="text-white">GRAND PAVILION</span>
                <span className="hidden sm:inline text-gray-600 mx-2">|</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 block sm:inline text-sm sm:text-xl md:text-2xl">Book Your Slot</span>
              </h1>
            </div>
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            {[
              { num: 1, label: "Select Slot" },
              { num: 2, label: "Verify OTP" },
              { num: 3, label: "Confirmed" }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 sm:gap-3 ${idx > 0 ? 'ml-2 sm:ml-4' : ''}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                    step >= s.num 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50' 
                      : 'bg-zinc-800 text-gray-500'
                  }`}>
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`hidden sm:block text-sm font-medium ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`hidden sm:block w-20 h-1 mx-2 rounded ${step > s.num ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Select Sport, Date & Slots */}
        {step === 1 && (
          <div className="space-y-6 sm:space-y-8">
            {/* Sport Selection */}
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl sm:rounded-2xl" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 relative z-10">Select Sport</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
                {[
                  { value: "cricket", label: "Cricket", duration: "Minimum 2 Hours" },
                  { value: "football", label: "Football", duration: "Minimum 1 Hour" }
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSport(s.value as any)}
                    className={`group p-4 sm:p-8 rounded-lg sm:rounded-xl border-2 transition-all relative overflow-hidden active:scale-95 ${
                      sport === s.value
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-500/10 shadow-lg shadow-amber-500/20'
                        : 'border-zinc-700 hover:border-amber-500/50 bg-zinc-800/50 hover:shadow-lg hover:shadow-amber-500/10'
                    }`}
                  >
                    <div className="relative z-10">
                      <div className="font-bold text-base sm:text-xl mb-1 sm:mb-2">{s.label}</div>
                      <div className="text-xs sm:text-sm text-gray-400">{s.duration}</div>
                    </div>
                    {sport === s.value && (
                      <div className="absolute top-3 right-3">
                        <Check className="w-6 h-6 text-amber-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl sm:rounded-2xl" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 relative z-10">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                Select Date
              </h2>
              <div className="relative z-10">
                <input
                  type="date"
                  value={date}
                  min={getTodayDate()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-zinc-800/80 border-2 border-zinc-700 rounded-lg sm:rounded-xl text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-base sm:text-lg transition-all hover:border-zinc-600"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>

            {/* Available Slots */}
            {date && (
              <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl sm:rounded-2xl" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-5 sm:mb-6 relative z-10">
                  <h2 className="text-xl sm:text-2xl font-bold">Available Time Slots</h2>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/40 rounded-lg text-xs sm:text-sm text-blue-300 shadow-lg shadow-blue-500/10">
                    <Info className="w-4 h-4" />
                    <span className="font-semibold">Peak hours: 6PM-10PM</span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12 relative z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 relative z-10">
                    {availableSlots.map(slot => {
                      const isSelected = selectedSlots.some(s => 
                        (slot.turf ? s.slotId === slot.id.replace(`-turf${slot.turf}`, '') && s.turf === slot.turf : s.slotId === slot.id)
                      );
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => slot.available && toggleSlot(
                            slot.turf ? slot.id.replace(`-turf${slot.turf}`, '') : slot.id,
                            slot.turf
                          )}
                          disabled={!slot.available}
                          className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all active:scale-95 ${
                            isSelected
                              ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-500/10'
                              : slot.available
                              ? 'border-zinc-700 hover:border-amber-500/50 bg-zinc-800/50 hover:bg-zinc-800'
                              : 'border-zinc-800 bg-zinc-900/50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {/* Small tick for available slots */}
                          {slot.available && !isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                          )}
                          
                          {/* Selected indicator */}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                            </div>
                          )}
                          
                          <div className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{slot.time}</div>
                          
                          {/* Turf label for football */}
                          {slot.turf && (
                            <div className="text-xs text-amber-400 font-medium mb-1">Turf {slot.turf}</div>
                          )}
                          
                          <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs sm:text-sm">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {slot.price}
                          </div>
                          
                          {!slot.available && (
                            <div className="text-xs text-red-400 mt-2 font-medium">Booked</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Booking Summary & Next */}
            {selectedSlots.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/40 rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-2xl shadow-amber-500/20 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-xl sm:rounded-2xl" />
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 relative z-10">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8 relative z-10">
                  <div className="p-3 sm:p-5 bg-gradient-to-br from-black/40 to-black/20 border border-amber-500/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 font-semibold">Total Amount</div>
                    <div className="text-xl sm:text-3xl font-bold flex items-center gap-1 sm:gap-2 text-amber-400">
                      <IndianRupee className="w-5 h-5 sm:w-7 sm:h-7" />
                      {calculateTotal()}
                    </div>
                  </div>
                  <div className="p-3 sm:p-5 bg-gradient-to-br from-black/40 to-black/20 border border-amber-500/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 font-semibold">Selected Slots</div>
                    <div className="text-xl sm:text-3xl font-bold text-amber-400">{selectedSlots.length}</div>
                  </div>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-300">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-black/30 border-2 border-zinc-700 rounded-lg sm:rounded-xl text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-300">Phone Number</label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <div className="relative flex">
                          <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
                          <span className="pl-9 sm:pl-12 pr-2 sm:pr-3 py-3 sm:py-4 bg-black/30 border-2 border-zinc-700 border-r-0 rounded-l-lg sm:rounded-l-xl text-white font-semibold text-sm sm:text-base">+91</span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            maxLength={10}
                            className="flex-1 px-3 sm:px-4 py-3 sm:py-4 bg-black/30 border-2 border-l-0 border-zinc-700 rounded-r-lg sm:rounded-r-xl text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none transition-all text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <button
                        onClick={sendOTP}
                        disabled={loading || !phone || phone.length !== 10 || !name}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base active:scale-95"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
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
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-purple-500/5 rounded-xl sm:rounded-2xl" />
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500/30 to-orange-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 relative z-10 shadow-lg shadow-amber-500/20">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 relative z-10">Verification</h2>
              <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 relative z-10 px-2">Enter the 6-digit code sent to +91 {phone}</p>
              
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-zinc-800/80 border-2 border-zinc-700 rounded-lg sm:rounded-xl text-white text-center text-2xl sm:text-3xl font-bold tracking-[0.3em] sm:tracking-[0.5em] focus:border-amber-500 focus:outline-none mb-6 sm:mb-8 transition-all relative z-10 shadow-xl"
              />
              
              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full px-6 py-4 sm:py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 text-base sm:text-lg relative z-10 shadow-xl shadow-amber-500/30 active:scale-95"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-xl sm:rounded-2xl" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 relative z-10 shadow-lg shadow-green-500/20">
                <Check className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 relative z-10">Booking Confirmed</h2>
              <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 relative z-10 px-2">Your slot has been successfully reserved</p>
              
              <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/50 border border-zinc-700 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-left relative z-10 shadow-xl backdrop-blur-sm">
                <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 pb-3 border-b border-zinc-700">Booking Details</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sport</span>
                    <span className="font-semibold capitalize">{sport}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Date</span>
                    <span className="font-semibold">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Time Slots</span>
                    <span className="font-semibold">{selectedSlots.length} Hour{selectedSlots.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-zinc-700">
                    <span className="text-gray-400 font-semibold">Total Amount</span>
                    <span className="font-bold text-2xl text-amber-500 flex items-center gap-1">
                      <IndianRupee className="w-5 h-5" />
                      {calculateTotal()}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-zinc-700">
                    <p className="text-sm text-gray-500 text-center">Payment: Cash at venue</p>
                  </div>
                </div>
              </div>
              
              <Link to="/" className="relative z-10">
                <button className="w-full px-6 py-4 sm:py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold rounded-lg sm:rounded-xl transition-all text-base sm:text-lg shadow-xl shadow-amber-500/30 active:scale-95">
                  Return to Home
                </button>
              </Link>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default Booking;
