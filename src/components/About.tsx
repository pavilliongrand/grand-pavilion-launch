import { useScrollAnimation } from "@/hooks/use-scroll-animation";


export const About = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="about" className="relative py-12 sm:py-16 lg:py-20 bg-[#F5F7FA] overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84cc16]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A3E635]/5 rounded-full blur-[120px]" />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Palakkad's Premier Sports Facility
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              State-of-the-art turfs designed for champions, built for the community
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
