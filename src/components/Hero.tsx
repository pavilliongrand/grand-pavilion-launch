import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-sports.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Grand Pavilion Sports Facility"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-block">
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/20 border border-primary text-primary-foreground rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase backdrop-blur-sm">
              Coming Soon
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight px-2 text-center">
            Grand Pavilion
          </h1>

          {/* Subheading */}
          <p className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 font-light max-w-3xl mx-auto px-4 text-center">
            Sports Academy & Turf Rental
          </p>

          {/* Description */}
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4 text-center">
            Train with experienced coaches and play on quality turf. 
            Cricket, football, and more, all in one place.
          </p>

          {/* CTA Button */}
          <div className="pt-4 sm:pt-6 animate-fade-in-up px-4 w-full max-w-xs mx-auto">
            <a
              href="https://maps.app.goo.gl/wwNmqftNskQb9V8g6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg w-full"
            >
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Find Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
