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

      {/* Top Logo */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 lg:left-12 z-20">
        <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300">
          <img src="/client-logo.jpg" alt="Grand Pavilion" className="h-12 sm:h-16 w-auto object-contain drop-shadow-md" />
        </Link>
      </div>

      <div className="container relative z-10 h-full flex flex-col justify-end md:justify-center pb-24 md:pb-0 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl space-y-8 animate-fade-in">

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight font-heading leading-tight">
            GRAND PAVILION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#65a30d]">
              SPORTS TURF
            </span>
          </h1>

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
                Reserve Turf
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
