import { MapPin, Mail, Instagram, Phone } from "lucide-react";

const LocationMap = () => {
  return (
    <section className="py-10 sm:py-16 lg:py-24 bg-white text-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-gray-900 tracking-tight">
                Visit <span className="text-[#84cc16]">Us</span>
              </h2>
              <div className="w-24 h-1.5 bg-[#84cc16] rounded-full" />
            </div>

            <p className="text-gray-600 text-sm sm:text-lg leading-relaxed max-w-md">
              Conveniently located in Palakkad, easily accessible from major routes. Drop by for a game or to check out our facilities.
            </p>

            <div className="space-y-6 pt-4">
              <a
                href="https://share.google/movf7qAUVXIpgCGzu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="p-3 bg-[#F5F7FA] rounded-lg text-[#84cc16] group-hover:bg-[#A3E635] group-hover:text-[#1A2E05] transition-all duration-300">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-[#65a30d] transition-colors">View on Maps</p>
                  <p className="text-sm text-gray-500">Near Main Highway, Palakkad</p>
                </div>
              </a>

              <a
                href="tel:+919562766676"
                className="flex items-center gap-4 group"
              >
                <div className="p-3 bg-[#F5F7FA] rounded-lg text-[#84cc16] group-hover:bg-[#A3E635] group-hover:text-[#1A2E05] transition-all duration-300">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-[#65a30d] transition-colors">Call Us</p>
                  <p className="text-sm text-gray-500">+91 9562766676</p>
                </div>
              </a>

              <a
                href="mailto:pavilliongrand@gmail.com"
                className="flex items-center gap-4 group"
              >
                <div className="p-3 bg-[#F5F7FA] rounded-lg text-[#84cc16] group-hover:bg-[#A3E635] group-hover:text-[#1A2E05] transition-all duration-300">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-[#65a30d] transition-colors">Email Us</p>
                  <p className="text-sm text-gray-500">pavilliongrand@gmail.com</p>
                </div>
              </a>

              <a
                href="https://instagram.com/grand.pavillion"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="p-3 bg-[#F5F7FA] rounded-lg text-[#84cc16] group-hover:bg-[#A3E635] group-hover:text-[#1A2E05] transition-all duration-300">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-[#65a30d] transition-colors">Follow Us</p>
                  <p className="text-sm text-gray-500">@grand.pavillion</p>
                </div>
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="h-[280px] sm:h-[380px] lg:h-[500px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group">
            <div className="absolute inset-0 bg-[#A3E635]/5 pointer-events-none group-hover:bg-transparent transition-colors duration-500 z-10" />
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919!2d76.2274075!3d10.8192527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba7c5dcbf903af9%3A0xee60446b9c4e6e65!2sGrand%20Pavilion%20Sports%20Turf!5e0!3m2!1sen!2sin!4v1747224000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
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