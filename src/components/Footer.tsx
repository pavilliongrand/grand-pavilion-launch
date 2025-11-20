const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8 px-4">
      <div className="container mx-auto text-center">
        <p className="text-muted-foreground text-sm md:text-base">
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
    </footer>
  );
};

export default Footer;
