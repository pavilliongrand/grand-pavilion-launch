import { Instagram, Mail, MapPin, Phone, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#F5F7FA] border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#84cc16] to-[#65a30d] bg-clip-text text-transparent mb-4">
              Grand Pavilion
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Premium sports turf facility offering world-class cricket and football pitches. 
              Experience professional-grade playing surfaces in the heart of Palakkad.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com/grand.pavillion" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white hover:bg-[#A3E635] border border-gray-200 hover:border-transparent flex items-center justify-center transition-all group shadow-sm"
              >
                <Instagram className="w-5 h-5 text-gray-500 group-hover:text-[#1A2E05] transition-colors" />
              </a>
              <a 
                href="mailto:pavilliongrand@gmail.com"
                className="w-10 h-10 rounded-lg bg-white hover:bg-[#A3E635] border border-gray-200 hover:border-transparent flex items-center justify-center transition-all group shadow-sm"
              >
                <Mail className="w-5 h-5 text-gray-500 group-hover:text-[#1A2E05] transition-colors" />
              </a>
              <a 
                href="tel:+919562766676"
                className="w-10 h-10 rounded-lg bg-white hover:bg-[#A3E635] border border-gray-200 hover:border-transparent flex items-center justify-center transition-all group shadow-sm"
              >
                <Phone className="w-5 h-5 text-gray-500 group-hover:text-[#1A2E05] transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4 uppercase text-sm tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/booking" className="text-gray-600 hover:text-[#65a30d] transition-colors text-sm">Book a Slot</Link>
              </li>
              <li>
                <a href="/#features" className="text-gray-600 hover:text-[#65a30d] transition-colors text-sm">Features</a>
              </li>
              <li>
                <a href="/#services" className="text-gray-600 hover:text-[#65a30d] transition-colors text-sm">Services</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4 uppercase text-sm tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#84cc16]" />
                <span>Palakkad, Kerala</span>
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#84cc16]" />
                <a href="tel:+919562766676" className="hover:text-[#65a30d] transition-colors">
                  +91 9562766676
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#84cc16]" />
                <a href="mailto:pavilliongrand@gmail.com" className="hover:text-[#65a30d] transition-colors">
                  pavilliongrand@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Grand Pavilion. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Developed by{" "}
              <a href="https://mehdinamdar.me" target="_blank" rel="noopener noreferrer" className="text-[#84cc16] hover:text-[#65a30d] font-medium transition-colors">
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
