import { Instagram, Mail, MapPin, Phone, Clock } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-black via-zinc-900 to-black border-t border-zinc-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-4">
              Grand Pavilion
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Premium sports turf facility offering world-class cricket and football pitches. 
              Experience professional-grade playing surfaces in the heart of Palakkad.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com/grand.pavillion" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 border border-zinc-700 hover:border-transparent flex items-center justify-center transition-all group"
              >
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </a>
              <a 
                href="mailto:pavilliongrand@gmail.com"
                className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 border border-zinc-700 hover:border-transparent flex items-center justify-center transition-all group"
              >
                <Mail className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="/booking" className="text-gray-400 hover:text-amber-500 transition-colors text-sm">Book a Slot</a>
              </li>
              <li>
                <a href="/#about" className="text-gray-400 hover:text-amber-500 transition-colors text-sm">About Us</a>
              </li>
              <li>
                <a href="/#features" className="text-gray-400 hover:text-amber-500 transition-colors text-sm">Features</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <span>Palakkad, Kerala</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <a href="mailto:pavilliongrand@gmail.com" className="hover:text-amber-500 transition-colors">
                  pavilliongrand@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <span>6:00 AM - 12:00 AM Daily</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Grand Pavilion. All rights reserved.
            </p>
            <p className="text-gray-600 text-sm">
              Developed by{" "}
              <a href="https://mehdinamdar.me" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 transition-colors">
                namdar.dev
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
