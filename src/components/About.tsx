import { Trophy, Users, Clock, Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const stats = [
  {
    icon: Trophy,
    value: "2",
    label: "Premium Turfs",
    description: "Cricket & Football"
  },
  {
    icon: Users,
    value: "500+",
    label: "Active Players",
    description: "Monthly bookings"
  },
  {
    icon: Clock,
    value: "6AM-12AM",
    label: "Operating Hours",
    description: "7 days a week"
  },
  {
    icon: Star,
    value: "4.9",
    label: "Rating",
    description: "Google Reviews"
  }
];

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
          {/* Title */}
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Palakkad's Premier Sports Facility
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              State-of-the-art turfs designed for champions, built for the community
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white border border-gray-100 shadow-sm rounded-xl p-5 sm:p-6 lg:p-8 hover:border-[#84cc16] hover:shadow-md transition-all duration-300 hover:scale-105"
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  {/* Icon */}
                  <div className="mb-3 sm:mb-4">
                    <div className="inline-flex p-2.5 sm:p-3 rounded-lg bg-[#A3E635]/20 group-hover:bg-[#A3E635]/30 transition-colors">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#65a30d]" />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                    {stat.value}
                  </div>

                  {/* Label */}
                  <div className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
                    {stat.label}
                  </div>

                  {/* Description */}
                  <div className="text-xs sm:text-sm text-gray-500">
                    {stat.description}
                  </div>

                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 rounded-xl bg-[#84cc16]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
