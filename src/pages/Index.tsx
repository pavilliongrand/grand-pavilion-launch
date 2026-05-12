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
    <div className="min-h-screen bg-[#F5F7FA]">
      <Hero />
      <About />
      <Services />
      <Features />
      
      {/* Book Now CTA Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden bg-white">
        {/* Gradient background with pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5F7FA] via-white to-[#F5F7FA]" />
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84cc16]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-[120px]" />
        
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-[#A3E635]/20 border border-[#84cc16]/30 rounded-full shadow-sm">
            <span className="text-[#65a30d] font-bold text-sm uppercase tracking-wider">Quick & Easy Booking</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#65a30d]">Play?</span>
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Book your slot now with instant OTP verification. 
            <br className="hidden sm:block" />
            Pay at venue. Simple. Fast. Secure.
          </p>
          <Link to="/booking">
            <button className="group bg-[#A3E635] hover:bg-[#84cc16] text-[#1A2E05] font-bold py-5 px-12 sm:py-6 sm:px-16 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 mx-auto text-lg sm:text-xl shadow-sm hover:shadow-md">
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
