import { MapPin, ExternalLink, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const LocationMap = () => {
  const headerAnimation = useScrollAnimation();
  const mapAnimation = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-900/10 to-black">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div 
          ref={headerAnimation.ref}
          className={`text-center mb-12 sm:mb-16 lg:mb-20 space-y-4 sm:space-y-6 transition-all duration-700 ${headerAnimation.className}`}
        >
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground px-4 tracking-tight">
              Find Us
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-600/50 via-amber-500 to-amber-600/50 mx-auto rounded-full shadow-lg shadow-amber-500/30" />
          </div>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
            Located in the heart of the city, easily accessible by all modes of transport
          </p>
        </div>

        {/* Map and Social Links */}
        <div 
          ref={mapAnimation.ref}
          className={`max-w-6xl mx-auto space-y-12 transition-all duration-700 ${mapAnimation.className}`}
        >
          {/* Map Embed */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 bg-gray-900/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-black/20 pointer-events-none" />
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3923.6892745697447!2d76.22722!3d10.819253!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba7c5dcbf903af9%3A0xee60446b9c4e6e65!2sGrand%20Pavilion%20Sports%20Turf!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Grand Pavilion Sports Turf Location"
              className="w-full h-[250px] sm:h-[300px] lg:h-[400px]"
              onLoad={() => console.log('Map loaded successfully')}
              onError={() => console.error('Failed to load map')}
            ></iframe>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 max-w-md mx-auto">
            <a
              href="https://maps.app.goo.gl/wwNmqftNskQb9V8g6"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-4 sm:p-5 rounded-full bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-lg border border-gray-700/30 text-blue-400 hover:text-blue-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-110 hover:-translate-y-1"
              title="Open in Maps"
            >
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300" />
              <div className="absolute inset-0 rounded-full bg-blue-500/0 group-hover:bg-blue-500/10 transition-all duration-500" />
            </a>

            <a
              href="mailto:pavilliongrand@gmail.com"
              className="group relative p-4 sm:p-5 rounded-full bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-lg border border-gray-700/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-500 hover:scale-110 hover:-translate-y-1"
              title="Email Us"
            >
              <Mail className="w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300" />
              <div className="absolute inset-0 rounded-full bg-amber-500/0 group-hover:bg-amber-500/10 transition-all duration-500" />
            </a>
            
            <a
              href="https://www.instagram.com/grand.pavillion/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-4 sm:p-5 rounded-full bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-lg border border-gray-700/30 text-pink-400 hover:text-pink-300 hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/20 transition-all duration-500 hover:scale-110 hover:-translate-y-1"
              title="Follow us on Instagram"
            >
              <Instagram className="w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300" />
              <div className="absolute inset-0 rounded-full bg-pink-500/0 group-hover:bg-pink-500/10 transition-all duration-500" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;