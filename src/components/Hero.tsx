import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-white">
      {/* Background Image with Better Visibility */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-100" 
          style={{
            backgroundImage: `url('/hero-sports.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        {/* Responsive gradient overlay for readability while keeping image visible */}
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-white/95 via-white/80 md:via-white/60 to-white/30 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F7FA] via-[#F5F7FA]/80 md:via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 h-full flex flex-col justify-end md:justify-center pb-24 md:pb-0 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl space-y-8 animate-fade-in">

          {/* Logo + brand name on one line */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
              <img
                src="/logo-transparent.png"
                alt="Grand Pavilion Sports Turf"
                className="h-14 sm:h-20 md:h-24 lg:h-28 w-auto object-contain"
              />
            </Link>
            <div className="flex flex-col leading-none">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                Grand Pavilion
              </span>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#84cc16] uppercase tracking-[0.25em] mt-1">
                Sports Turf
              </span>
            </div>
          </div>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl font-light leading-relaxed">
            Premium Cricket & Football Facilities in Palakkad. <br className="hidden sm:block" />
            Experience professional standards where passion meets excellence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 pt-8">
            <Link to="/booking">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white font-bold px-10 h-16 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84cc16]/30 border-transparent"
              >
                <Calendar className="mr-2 h-6 w-6" />
                Reserve Your Slot
              </Button>
            </Link>
            <a href="#about">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 font-bold px-10 h-16 rounded-xl text-lg transition-all duration-300 hover:scale-105"
              >
                View Facilities
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
        <div className="w-[2px] h-16 bg-gradient-to-b from-[#84cc16] to-transparent shadow-[0_0_20px_rgba(132,204,22,0.5)]" />
      </div>
    </section>
  );
};

export default Hero;
