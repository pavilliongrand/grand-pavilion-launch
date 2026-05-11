import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Phone, Check, Loader2, IndianRupee, Shield } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

// Types
interface TimeSlot {
  id: string;
  time: string;
  startHour: number;
  endHour: number;
  available: boolean;
  price: number;
}

interface BookingData {
  sport: "cricket" | "football";
  date: string;
  slots: TimeSlot[];
  phone: string;
  otp: string;
}

const Booking = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [step, setStep] = useState(1); // 1: Sport & DateTime, 2: OTP, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    sport: "cricket",
    date: "",
    slots: [],
    phone: "",
    otp: "",
  });

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [pricingConfig, setPricingConfig] = useState<any>(null);

  // Fetch pricing config on mount
  useEffect(() => {
    fetchPricingConfig();
  }, []);

  // Set up reCAPTCHA on mount
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }
  }, []);

  const fetchPricingConfig = async () => {
    try {
      const response = await fetch('/api/pricing');
      if (response.ok) {
        const config = await response.json();
        setPricingConfig(config);
      }
    } catch (error) {
      console.error("Error fetching pricing config:", error);
      // Use default pricing if API fails
      setPricingConfig({
        cricket: { basePrice: 250, minDuration: 2, peakMultiplier: 1.3 },
        football: { basePrice: 400, minDuration: 1, peakMultiplier: 1.3 },
        peakHours: { start: 18, end: 22 }
      });
    }
  };

  // Generate time slots (6 AM - 12 AM)
  const generateSlots = (sport: "cricket" | "football"): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    if (!pricingConfig) return slots;
    
    const config = pricingConfig[sport];
    const basePrice = config.basePrice;
    const minDuration = config.minDuration;
    const peakMultiplier = config.peakMultiplier;
    const peakStart = pricingConfig.peakHours.start;
    const peakEnd = pricingConfig.peakHours.end;

    for (let hour = 6; hour < 24; hour += minDuration) {
      const endHour = hour + minDuration;
      if (endHour > 24) break;

      // Dynamic pricing: peak hours multiplier
      const isPeak = hour >= peakStart && hour < peakEnd;
      const price = isPeak ? Math.round(basePrice * peakMultiplier) : basePrice;

      slots.push({
        id: `${hour}-${endHour}`,
        time: `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"} - ${endHour % 12 || 12}:00 ${endHour < 12 ? "AM" : "PM"}`,
        startHour: hour,
        endHour: endHour,
        available: true, // Will be updated from API
        price: price * minDuration,
      });
    }
    return slots;
  };

  // Fetch available slots when sport or date changes
  useEffect(() => {
    if (bookingData.sport && bookingData.date) {
      fetchAvailableSlots();
    }
  }, [bookingData.sport, bookingData.date]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/slots?date=${bookingData.date}&sport=${bookingData.sport}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      
      const data = await response.json();
      setAvailableSlots(data.slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError("Failed to load available slots. Please try again.");
      
      // Fallback to local generation
      const slots = generateSlots(bookingData.sport);
      setAvailableSlots(slots);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    if (selectedSlotIds.includes(slotId)) {
      setSelectedSlotIds(selectedSlotIds.filter(id => id !== slotId));
    } else {
      setSelectedSlotIds([...selectedSlotIds, slotId]);
    }
  };

  const calculateTotal = (): number => {
    return selectedSlotIds.reduce((total, slotId) => {
      const slot = availableSlots.find(s => s.id === slotId);
      return total + (slot?.price || 0);
    }, 0);
  };

  const handleSendOTP = async () => {
    if (!bookingData.phone || selectedSlotIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Format phone number for Firebase (must include country code)
      const phoneNumber = bookingData.phone.startsWith('+') 
        ? bookingData.phone 
        : `+91${bookingData.phone}`;
      
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      
      setConfirmationResult(result);
      setStep(2);
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError(err.message || "Failed to send OTP. Please check your phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!bookingData.otp || !confirmationResult) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await confirmationResult.confirm(bookingData.otp);
      
      // Create booking directly (no payment required)
      await createBooking();
      
      setStep(3);
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    try {
      // Create booking via API (no payment required)
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: bookingData.sport,
          date: bookingData.date,
          slotIds: selectedSlotIds,
          phone: bookingData.phone,
          amount: calculateTotal(),
          paymentMethod: 'cash', // Pay at venue
        }),
      });
      
      if (!response.ok) {
        throw new Error('Booking failed');
      }
      
      return await response.json();
    } catch (err: any) {
      console.error("Error creating booking:", err);
      throw err;
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div
          ref={ref}
          className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Book Your Slot
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
              Step {step} of 3
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step ? "bg-amber-500 text-black" : 
                    s === step ? "bg-amber-500 text-black ring-4 ring-amber-500/30" : 
                    "bg-zinc-800 text-gray-500"
                  }`}>
                    {s < step ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                      s < step ? "bg-amber-500" : "bg-zinc-800"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* reCAPTCHA Container (invisible) */}
          <div id="recaptcha-container"></div>

          {/* Step 1: Sport Selection & Date/Time */}
          {step === 1 && (
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 sm:p-8 lg:p-10">
              {/* Sport Selection */}
              <div className="mb-8">
                <label className="block text-white font-semibold mb-4 text-lg">
                  Select Sport
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setBookingData({ ...bookingData, sport: "cricket" });
                      setSelectedSlotIds([]);
                    }}
                    className={`py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      bookingData.sport === "cricket"
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50"
                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}
                  >
                    Cricket
                    <div className="text-xs mt-1 opacity-80">₹250/hr (2hr min)</div>
                  </button>
                  <button
                    onClick={() => {
                      setBookingData({ ...bookingData, sport: "football" });
                      setSelectedSlotIds([]);
                    }}
                    className={`py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      bookingData.sport === "football"
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50"
                        : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}
                  >
                    Football
                    <div className="text-xs mt-1 opacity-80">₹400/hr (1hr min)</div>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-8">
                <label className="block text-white font-semibold mb-4 text-lg">
                  Select Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={getTodayDate()}
                    value={bookingData.date}
                    onChange={(e) => {
                      setBookingData({ ...bookingData, date: e.target.value });
                      setSelectedSlotIds([]);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-4 px-5 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Time Slots */}
              {bookingData.date && (
                <div className="mb-8">
                  <label className="block text-white font-semibold mb-4 text-lg">
                    Select Time Slots
                  </label>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          disabled={!slot.available}
                          onClick={() => toggleSlot(slot.id)}
                          className={`p-4 rounded-lg border transition-all duration-300 ${
                            !slot.available
                              ? "bg-zinc-800/50 border-zinc-700 text-gray-600 cursor-not-allowed"
                              : selectedSlotIds.includes(slot.id)
                              ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/30"
                              : "bg-zinc-800 border-zinc-700 text-white hover:border-amber-500/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium text-sm">{slot.time}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold">
                              <IndianRupee className="w-3 h-3" />
                              {slot.price}
                            </div>
                          </div>
                          {!slot.available && (
                            <div className="text-xs mt-2 text-red-400">Occupied</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Phone Number */}
              {selectedSlotIds.length > 0 && (
                <div className="mb-8">
                  <label className="block text-white font-semibold mb-4 text-lg">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-4 px-5 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                    />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Total & Continue */}
              {selectedSlotIds.length > 0 && (
                <div>
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-5 mb-6">
                    <div className="flex items-center justify-between text-lg">
                      <span className="text-gray-300">Total Amount</span>
                      <div className="flex items-center gap-1 font-bold text-amber-500 text-2xl">
                        <IndianRupee className="w-5 h-5" />
                        {calculateTotal()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {selectedSlotIds.length} slot(s) selected
                    </div>
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={!bookingData.phone || loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 sm:p-8 lg:p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
                <p className="text-gray-400">
                  Enter the code sent to {bookingData.phone}
                </p>
              </div>

              <div className="mb-8">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={bookingData.otp}
                  onChange={(e) => setBookingData({ ...bookingData, otp: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-4 px-5 text-white text-center text-2xl tracking-widest focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={bookingData.otp.length !== 6 || loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Pay
                  </>
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full mt-4 text-gray-400 hover:text-white transition-colors"
              >
                Change phone number
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 sm:p-8 lg:p-10 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Booking Confirmed! 🎉</h2>
              <p className="text-gray-400 mb-2">
                Your booking has been added to the calendar
              </p>
              <p className="text-sm text-gray-500 mb-8">
                ✓ Calendar event created • Pay cash at venue
              </p>
              
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-white mb-4">Booking Details</h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between">
                    <span>Sport:</span>
                    <span className="font-semibold capitalize">{bookingData.sport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-semibold">{bookingData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slots:</span>
                    <span className="font-semibold">{selectedSlotIds.length}</span>
                  </div>
                  <div className="flex justify-between text-amber-500 text-lg font-bold border-t border-zinc-700 pt-3 mt-3">
                    <span>Amount to Pay:</span>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {calculateTotal()}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="font-semibold text-green-400">Cash at Venue</span>
                  </div>
                </div>
              </div>

              <Link to="/">
                <button className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 px-8 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50">
                  Back to Home
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Booking;
