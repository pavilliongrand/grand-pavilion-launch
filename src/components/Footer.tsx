import { Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-6 sm:py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-3">
          {/* Email */}
          <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200">
            <Mail className="w-4 h-4" />
            <a 
              href="mailto:pavilliongrand@gmail.com"
              className="text-sm sm:text-base font-medium hover:underline"
            >
              pavilliongrand@gmail.com
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base text-center px-4">
            © 2025 Grand Pavilion • All Rights Reserved | Managed by{" "}
            <a
              href="https://namdar-dev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 underline decoration-primary/30 hover:decoration-primary"
            >
              namdar.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
