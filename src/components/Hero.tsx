import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Image with Better Visibility */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-50" 
          style={{
            backgroundImage: `url('/hero-sports.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-amber-900/30 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl space-y-8 animate-fade-in">
          {/* Gold Logo/Brand Name */}
          <div className="inline-block">
            <span className="text-amber-400 font-bold tracking-widest uppercase text-sm md:text-base border-b-2 border-amber-400 pb-1">
              Est. 2025
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight font-heading leading-tight">
            GRAND PAVILION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              SPORTS TURF
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl font-light leading-relaxed">
            Premium Cricket & Football Facilities in Palakkad. <br className="hidden sm:block" />
            Experience professional standards where passion meets excellence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 pt-8">
            <Link to="/booking">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold px-10 h-16 rounded-xl text-lg transition-all duration-300 hover:scale-105"
              >
                <Calendar className="mr-2 h-6 w-6" />
                Book a Slot
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-amber-400 border-2 border-amber-500/50 hover:bg-amber-500 hover:text-black font-bold px-10 h-16 rounded-xl text-lg transition-all duration-300 hover:scale-105"
            >
              View Facilities
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
        <div className="w-[2px] h-16 bg-gradient-to-b from-amber-500 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
      </div>
    </section>
  );
};

export default Hero;
