import { MapPin, Mail, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

const LocationMap = () => {
  return (
    <section className="py-20 sm:py-32 bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-white tracking-tight">
                Visit <span className="text-gold">Us</span>
              </h2>
              <div className="w-24 h-1.5 bg-gold rounded-full" />
            </div>

            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              Conveniently located in Palakkad, easily accessible from major routes. Drop by for a game or to check out our facilities.
            </p>

            <div className="space-y-6 pt-4">
              <a
                href="https://maps.app.goo.gl/A6USjUjBrMueXuZJ6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="p-3 bg-white/5 rounded-lg text-gold group-hover:bg-gold group-hover:text-charcoal transition-all duration-300">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-gold transition-colors">View on Maps</p>
                  <p className="text-sm text-gray-500">Near Main Highway, Palakkad</p>
                </div>
              </a>

              <a
                href="mailto:pavilliongrand@gmail.com"
                className="flex items-center gap-4 group"
              >
                <div className="p-3 bg-white/5 rounded-lg text-gold group-hover:bg-gold group-hover:text-charcoal transition-all duration-300">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-gold transition-colors">Email Us</p>
                  <p className="text-sm text-gray-500">pavilliongrand@gmail.com</p>
                </div>
              </a>

              <a
                href="https://instagram.com/grand.pavillion"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="p-3 bg-white/5 rounded-lg text-gold group-hover:bg-gold group-hover:text-charcoal transition-all duration-300">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-gold transition-colors">Follow Us</p>
                  <p className="text-sm text-gray-500">@grand.pavillion</p>
                </div>
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="h-[400px] lg:h-[500px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gold/5 pointer-events-none group-hover:bg-transparent transition-colors duration-500 z-10" />
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.284747134277!2d76.6548!3d10.7867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ3JzEyLjEiTiA3NsKwMzknMTcuMyJF!5e0!3m2!1sen!2sin!4v1635765432109!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(100%) invert(92%) contrast(83%)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Grand Pavilion Location"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;