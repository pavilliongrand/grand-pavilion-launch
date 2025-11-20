import { Calendar, Users, Zap, Trophy, Sun, Target } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const features = [
  {
    icon: Calendar,
    title: "Online Booking",
    description: "Book your slots easily through our upcoming online system",
    color: "bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-800/30 group-hover:from-amber-400/20 group-hover:via-amber-300/10 group-hover:to-amber-400/20",
    iconColor: "text-gray-300 group-hover:text-amber-400",
  },
  {
    icon: Users,
    title: "Experienced Coaches",
    description: "Learn from coaches who love the game and know how to teach it",
    color: "bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-800/30 group-hover:from-white/10 group-hover:via-white/5 group-hover:to-white/10",
    iconColor: "text-gray-300 group-hover:text-white",
  },
  {
    icon: Target,
    title: "Quality Facilities",
    description: "Full-sized football turf and dedicated cricket practice nets",
    color: "bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-800/30 group-hover:from-amber-500/20 group-hover:via-amber-400/10 group-hover:to-amber-500/20",
    iconColor: "text-gray-300 group-hover:text-amber-500",
  },
  {
    icon: Zap,
    title: "Night Matches",
    description: "LED floodlights so you can play even after sunset",
    color: "bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-800/30 group-hover:from-yellow-400/20 group-hover:via-yellow-300/10 group-hover:to-yellow-400/20",
    iconColor: "text-gray-300 group-hover:text-yellow-400",
  },
  {
    icon: Sun,
    title: "Kids Coaching",
    description: "Special training batches and camps for children of all skill levels",
    color: "bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-800/30 group-hover:from-white/15 group-hover:via-gray-100/5 group-hover:to-white/15",
    iconColor: "text-gray-300 group-hover:text-white",
  },
  {
    icon: Trophy,
    title: "Host Tournaments",
    description: "Perfect venue for your matches, tournaments, and events",
    color: "bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-800/30 group-hover:from-amber-600/25 group-hover:via-amber-500/10 group-hover:to-amber-600/25",
    iconColor: "text-gray-300 group-hover:text-amber-600",
  },
];

const Features = () => {
  const headerAnimation = useScrollAnimation();
  const gridAnimation = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-900/10 to-black">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div 
          ref={headerAnimation.ref}
          className={`text-center mb-12 sm:mb-16 lg:mb-20 space-y-4 sm:space-y-6 transition-all duration-700 ${headerAnimation.className}`}
        >
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground px-4 tracking-tight">
              What We Offer
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-600/50 via-amber-500 to-amber-600/50 mx-auto rounded-full shadow-lg shadow-amber-500/30" />
          </div>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
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
              className="group relative bg-gradient-to-br from-gray-900/40 via-black/60 to-gray-900/40 backdrop-blur-lg border border-gray-700/20 rounded-xl p-4 sm:p-6 lg:p-8 transition-all duration-700 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-2 hover:backdrop-blur-xl"
              style={{ 
                animationDelay: `${index * 0.15}s`,
              }}
            >
              {/* Premium gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/3 via-transparent to-white/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {/* Elegant glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br from-amber-400/10 via-transparent to-amber-600/10 blur-2xl" />
              
              <div className="relative space-y-4 sm:space-y-5 lg:space-y-6">
                {/* Icon Container */}
                <div className="relative">
                  <div className={`inline-flex p-3 sm:p-4 rounded-xl ${feature.color} transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl`}>
                    <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 ${feature.iconColor} transition-all duration-500 drop-shadow-sm`} />
                  </div>
                  {/* Enhanced glow effect */}
                  <div className={`absolute inset-0 rounded-xl ${feature.color} opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500 animate-pulse`} />
                  <div className={`absolute inset-0 rounded-xl ${feature.color} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-700`} />
                </div>

                {/* Content */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm lg:text-base">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div className="h-0.5 sm:h-1 w-12 sm:w-16 rounded-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 group-hover:from-amber-500 group-hover:via-amber-400 group-hover:to-amber-500 transition-all duration-500 group-hover:w-16 sm:group-hover:w-24 shadow-sm group-hover:shadow-amber-400/20" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
