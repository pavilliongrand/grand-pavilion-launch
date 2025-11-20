// No icons needed - they're in LocationMap section

const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800 py-6 sm:py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
          {/* Copyright */}
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base text-center px-4">
            © 2025 Grand Pavilion Sports Turf | All Rights Reserved | Managed by{" "}
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
