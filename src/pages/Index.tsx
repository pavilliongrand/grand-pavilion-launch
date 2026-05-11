import Hero from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import Features from "@/components/Features";
import LocationMap from "@/components/LocationMap";
import Footer from "@/components/Footer";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Hero />
      <About />
      <Services />
      <Features />
      
      {/* Book Now CTA Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
        {/* Gradient background with pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px]" />
        
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Quick & Easy Booking</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Play?</span>
          </h2>
          <p className="text-gray-300 text-lg sm:text-xl mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Book your slot now with instant OTP verification. 
            <br className="hidden sm:block" />
            Pay at venue. Simple. Fast. Secure.
          </p>
          <Link to="/booking">
            <button className="group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold py-5 px-12 sm:py-6 sm:px-16 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 mx-auto text-lg sm:text-xl">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
              Book Your Slot Now
            </button>
          </Link>
        </div>
      </section>

      <LocationMap />
      <Footer />
    </div>
  );
};

export default Index;
