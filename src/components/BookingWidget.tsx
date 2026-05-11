import { useState } from "react";
import { Calendar, Clock, Phone, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export const BookingWidget = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedSport, setSelectedSport] = useState<"cricket" | "football">("cricket");

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Title */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Quick Booking
            </h2>
            <p className="text-gray-400 text-base sm:text-lg">
              Reserve your slot in seconds with OTP verification
            </p>
          </div>

          {/* Booking Card */}
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 sm:p-8 lg:p-10">
            {/* Sport Selection */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-white font-semibold mb-3 sm:mb-4">
                Select Sport
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => setSelectedSport("cricket")}
                  className={`py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-300 ${
                    selectedSport === "cricket"
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  Cricket (₹250/hr)
                </button>
                <button
                  onClick={() => setSelectedSport("football")}
                  className={`py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-300 ${
                    selectedSport === "football"
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  Football (₹400/hr)
                </button>
              </div>
            </div>

            {/* Date Picker Placeholder */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-white font-semibold mb-3 sm:mb-4">
                Select Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose date (Backend integration pending)"
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-3 sm:py-4 px-4 sm:px-5 text-gray-400 cursor-not-allowed"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              </div>
            </div>

            {/* Time Slot Placeholder */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-white font-semibold mb-3 sm:mb-4">
                Select Time Slot
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose time (Backend integration pending)"
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-3 sm:py-4 px-4 sm:px-5 text-gray-400 cursor-not-allowed"
                />
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              </div>
            </div>

            {/* Phone Number Placeholder */}
            <div className="mb-8 sm:mb-10">
              <label className="block text-white font-semibold mb-3 sm:mb-4">
                Phone Number (OTP will be sent)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-3 sm:py-4 px-4 sm:px-5 text-gray-400 cursor-not-allowed"
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled
              className="w-full bg-zinc-700 text-gray-500 font-bold py-3.5 sm:py-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Backend Status */}
            <div className="mt-5 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500">
                🚧 Backend integration in progress - Booking will be live soon
              </p>
            </div>
          </div>

          {/* Features Below Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto mt-8 sm:mt-10">
            <div className="text-center p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-white font-semibold text-sm sm:text-base">Instant OTP</div>
              <div className="text-gray-500 text-xs sm:text-sm">Secure verification</div>
            </div>
            <div className="text-center p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div className="text-2xl mb-2">💳</div>
              <div className="text-white font-semibold text-sm sm:text-base">Easy Payment</div>
              <div className="text-gray-500 text-xs sm:text-sm">UPI/Cards accepted</div>
            </div>
            <div className="text-center p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-white font-semibold text-sm sm:text-base">Google Calendar</div>
              <div className="text-gray-500 text-xs sm:text-sm">Auto-sync bookings</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

    const toggleSlot = (id: number) => {
        if (selectedSlots.includes(id)) {
            setSelectedSlots(selectedSlots.filter(s => s !== id));
        } else {
            setSelectedSlots([...selectedSlots, id]);
        }
    };

    const totalAmount = selectedSlots.reduce((acc, id) => {
        const slot = SLOTS.find(s => s.id === id);
        return acc + (slot ? slot.price : 0);
    }, 0);

    return (
        <section className="py-20 bg-forest flex justify-center items-center p-4" id="booking">
            <div className="w-full max-w-4xl bg-cream rounded-2xl shadow-2xl border-2 border-gold overflow-hidden">
                {/* Header */}
                <div className="bg-charcoal p-6 text-center border-b border-gold">
                    <h2 className="text-2xl font-bold font-heading text-gold tracking-wide">
                        Book Your Slot
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Step {step} of 3 • {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </p>
                </div>

                <div className="p-6 sm:p-10">
                    {/* Step 1: Sport & Date */}
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-charcoal uppercase tracking-wider">Select Sport</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSport("cricket")}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all duration-300 font-bold text-lg",
                                            sport === "cricket"
                                                ? "border-gold bg-gold text-charcoal shadow-lg"
                                                : "border-gray-200 bg-white text-gray-500 hover:border-gold/50"
                                        )}
                                    >
                                        Cricket
                                    </button>
                                    <button
                                        onClick={() => setSport("football")}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all duration-300 font-bold text-lg",
                                            sport === "football"
                                                ? "border-gold bg-gold text-charcoal shadow-lg"
                                                : "border-gray-200 bg-white text-gray-500 hover:border-gold/50"
                                        )}
                                    >
                                        Football
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-charcoal uppercase tracking-wider">Select Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-12 border-gray-300 bg-white hover:bg-gray-50",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-gold" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white border-gold" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => setDate(d)}
                                            initialFocus
                                            className="rounded-md border shadow"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Button
                                onClick={() => setStep(2)}
                                className="w-full bg-forest text-white hover:bg-forest/90 h-12 font-bold"
                                disabled={!date}
                            >
                                Next: Select Slots
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Slots */}
                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-charcoal uppercase tracking-wider">Available Slots</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SLOTS.map((slot) => (
                                        <button
                                            key={slot.id}
                                            disabled={slot.status === "occupied"}
                                            onClick={() => toggleSlot(slot.id)}
                                            className={cn(
                                                "p-4 rounded-lg border flex justify-between items-center transition-all",
                                                slot.status === "occupied" && "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed",
                                                slot.status === "available" && !selectedSlots.includes(slot.id) && "bg-white border-gray-200 hover:border-gold",
                                                selectedSlots.includes(slot.id) && "bg-gold border-gold text-charcoal shadow-md"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4" />
                                                <span className="font-medium">{slot.time}</span>
                                            </div>
                                            <span className="font-mono font-bold">₹{slot.price}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <div>
                                    <p className="text-sm text-gray-500">Total Amount</p>
                                    <p className="text-2xl font-bold text-forest font-mono">₹{totalAmount}</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                    <Button
                                        onClick={() => setStep(3)}
                                        className="bg-forest text-white hover:bg-forest/90 font-bold"
                                        disabled={selectedSlots.length === 0}
                                    >
                                        Next: Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Form */}
                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-charcoal uppercase tracking-wider">Your Details</label>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                        <Input
                                            placeholder="Full Name"
                                            className="pl-10 h-12 border-gray-300 focus:border-gold bg-white"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                        <Input
                                            placeholder="Phone Number"
                                            type="tel"
                                            className="pl-10 h-12 border-gray-300 focus:border-gold bg-white"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Sport</span>
                                    <span className="font-medium capitalize">{sport}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Date</span>
                                    <span className="font-medium">{date ? format(date, "PPP") : "-"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Slots</span>
                                    <span className="font-medium">{selectedSlots.length} selected</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between font-bold text-lg text-forest">
                                    <span>Total</span>
                                    <span>₹{totalAmount}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                                <Button
                                    className="flex-[2] bg-gold text-charcoal hover:bg-gold/90 font-bold h-12"
                                    disabled={!formData.name || !formData.phone}
                                >
                                    Confirm Booking
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BookingWidget;
