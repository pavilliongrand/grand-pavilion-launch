import { useState } from "react";
import { Calendar, Clock, Phone, ArrowRight, Zap, CreditCard, CalendarDays } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export const BookingWidget = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedSport, setSelectedSport] = useState<"cricket" | "football">("cricket");

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[#F5F7FA]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Title */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Quick Booking
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">
              Reserve your slot in seconds with OTP verification
            </p>
          </div>

          {/* Booking Card */}
          <div className="max-w-2xl mx-auto bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden">
            {/* Subtle Gradient Glow Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3E635]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#84cc16]/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Sport Selection */}
            <div className="mb-6 sm:mb-8 relative z-10">
              <label className="block text-gray-900 font-semibold mb-3 sm:mb-4">
                Select Sport
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => setSelectedSport("cricket")}
                  className={`py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold transition-all duration-300 border ${
                    selectedSport === "cricket"
                      ? "bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white shadow-lg shadow-[#84cc16]/30 border-transparent"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  Cricket (₹250/hr)
                </button>
                <button
                  onClick={() => setSelectedSport("football")}
                  className={`py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold transition-all duration-300 border ${
                    selectedSport === "football"
                      ? "bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white shadow-lg shadow-[#84cc16]/30 border-transparent"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  Football (₹400/hr)
                </button>
              </div>
            </div>

            {/* Date Picker Placeholder */}
            <div className="mb-6 sm:mb-8 relative z-10">
              <label className="block text-gray-900 font-semibold mb-3 sm:mb-4">
                Select Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose date (Backend integration pending)"
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 sm:py-4 px-4 sm:px-5 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Time Slot Placeholder */}
            <div className="mb-6 sm:mb-8 relative z-10">
              <label className="block text-gray-900 font-semibold mb-3 sm:mb-4">
                Select Time Slot
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose time (Backend integration pending)"
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 sm:py-4 px-4 sm:px-5 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Phone Number Placeholder */}
            <div className="mb-8 sm:mb-10 relative z-10">
              <label className="block text-gray-900 font-semibold mb-3 sm:mb-4">
                Phone Number (OTP will be sent)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 sm:py-4 px-4 sm:px-5 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled
              className="relative z-10 w-full bg-gray-100 text-gray-400 font-bold py-3.5 sm:py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 transition-all"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Backend Status */}
            <div className="mt-5 sm:mt-6 text-center relative z-10">
              <p className="text-xs sm:text-sm text-[#84cc16] font-medium bg-[#A3E635]/10 inline-block px-3 py-1.5 rounded-full border border-[#84cc16]/20">
                🚧 Backend integration in progress - Booking will be live soon
              </p>
            </div>
          </div>

          {/* Features Below Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto mt-8 sm:mt-10">
            <div className="text-center p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#84cc16]/30 transition-all duration-300 group">
              <div className="mb-3 flex justify-center">
                <div className="p-3 bg-[#A3E635]/10 rounded-lg group-hover:bg-[#A3E635]/20 transition-colors">
                  <Zap className="w-6 h-6 text-[#65a30d]" />
                </div>
              </div>
              <div className="text-gray-900 font-bold text-sm sm:text-base">Instant OTP</div>
              <div className="text-gray-500 text-xs sm:text-sm mt-1">Secure verification</div>
            </div>
            <div className="text-center p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#84cc16]/30 transition-all duration-300 group">
              <div className="mb-3 flex justify-center">
                <div className="p-3 bg-[#A3E635]/10 rounded-lg group-hover:bg-[#A3E635]/20 transition-colors">
                  <CreditCard className="w-6 h-6 text-[#65a30d]" />
                </div>
              </div>
              <div className="text-gray-900 font-bold text-sm sm:text-base">Easy Payment</div>
              <div className="text-gray-500 text-xs sm:text-sm mt-1">UPI/Cards accepted</div>
            </div>
            <div className="text-center p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#84cc16]/30 transition-all duration-300 group">
              <div className="mb-3 flex justify-center">
                <div className="p-3 bg-[#A3E635]/10 rounded-lg group-hover:bg-[#A3E635]/20 transition-colors">
                  <CalendarDays className="w-6 h-6 text-[#65a30d]" />
                </div>
              </div>
              <div className="text-gray-900 font-bold text-sm sm:text-base">Calendar Sync</div>
              <div className="text-gray-500 text-xs sm:text-sm mt-1">Auto-sync bookings</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingWidget;
