import { Calendar, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Link } from "react-router-dom";

const services = [
  {
    sport: "Cricket",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2400",
    duration: "2 Hours",
    basePrice: "₹500",
    pricePerHour: 250,
    popular: true
  },
  {
    sport: "Football",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2400",
    duration: "1 Hour",
    basePrice: "₹400",
    pricePerHour: 400,
    popular: false
  }
];

export const Services = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-zinc-900 via-black to-zinc-900 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Title */}
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Our Services
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Book your slot for cricket or football with transparent pricing
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <Link
                key={index}
                to="/booking"
                className="group relative bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-2xl overflow-hidden hover:border-amber-500/70 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20 cursor-pointer block"
              >
                {/* Popular Badge */}
                {service.popular && (
                  <div className="absolute top-4 right-4 z-10 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                )}

                {/* Image */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.sport}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  {/* Sport Title on Image */}
                  <div className="absolute bottom-4 left-4 sm:left-6">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">
                      {service.sport}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 lg:p-8">
                  {/* Duration Info */}
                  <div className="flex items-center gap-2 text-gray-400 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-zinc-800">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-base sm:text-lg font-medium">{service.duration} minimum booking</span>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 sm:py-3.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50 flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    Book {service.sport} Slot
                  </button>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
