import { Calendar, Users, Zap, Trophy, Sun, Target } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const features = [
  {
    icon: Calendar,
    title: "Online Booking",
    description: "Book your slots easily through our upcoming online system",
  },
  {
    icon: Users,
    title: "Experienced Coaches",
    description: "Learn from coaches who love the game and know how to teach it",
  },
  {
    icon: Target,
    title: "Quality Facilities",
    description: "Full-sized football turf and dedicated cricket practice nets",
  },
  {
    icon: Zap,
    title: "Night Matches",
    description: "LED floodlights so you can play even after sunset",
  },
  {
    icon: Sun,
    title: "Kids Coaching",
    description: "Special training batches and camps for children of all skill levels",
  },
  {
    icon: Trophy,
    title: "Host Tournaments",
    description: "Perfect venue for your matches, tournaments, and events",
  },
];

const Features = () => {
  const headerAnimation = useScrollAnimation();
  const gridAnimation = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div 
          ref={headerAnimation.ref}
          className={`text-center mb-12 sm:mb-16 lg:mb-20 space-y-4 sm:space-y-6 transition-all duration-700 ${headerAnimation.className}`}
        >
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 px-4 tracking-tight">
              What We Offer
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#A3E635]/50 via-[#84cc16] to-[#A3E635]/50 mx-auto rounded-full shadow-sm" />
          </div>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 leading-relaxed">
            Everything you need to train, play, and improve your game
          </p>
        </div>

        {/* Features Grid */}
        <div 
          ref={gridAnimation.ref}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 transition-all duration-700 ${gridAnimation.className}`}
        >
          {features.map((feature, index) => (
            <article
              key={index}
              className="group relative bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 transition-all duration-500 hover:border-[#84cc16]/40 hover:shadow-2xl hover:shadow-[#84cc16]/10"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Subtle hover gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#84cc16]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative space-y-5">
                {/* Clean Icon Container */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-50 group-hover:bg-gradient-to-br group-hover:from-[#84cc16] group-hover:to-[#65a30d] transition-all duration-500 shadow-sm group-hover:shadow-md">
                  <feature.icon className="w-6 h-6 text-[#65a30d] group-hover:text-white transition-colors duration-500" />
                </div>

                {/* Content */}
                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#65a30d] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm sm:text-base font-medium">
                    {feature.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
