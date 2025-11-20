import { Calendar, Users, Zap, Trophy, Sun, Target } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Online Booking",
    description: "Book your slots easily through our upcoming online system",
    color: "bg-blue-500/10 group-hover:bg-blue-500",
    iconColor: "text-blue-500 group-hover:text-white",
  },
  {
    icon: Users,
    title: "Experienced Coaches",
    description: "Learn from coaches who love the game and know how to teach it",
    color: "bg-green-500/10 group-hover:bg-green-500",
    iconColor: "text-green-500 group-hover:text-white",
  },
  {
    icon: Target,
    title: "Quality Facilities",
    description: "Full-sized football turf and dedicated cricket practice nets",
    color: "bg-orange-500/10 group-hover:bg-orange-500",
    iconColor: "text-orange-500 group-hover:text-white",
  },
  {
    icon: Zap,
    title: "Night Matches",
    description: "LED floodlights so you can play even after sunset",
    color: "bg-yellow-500/10 group-hover:bg-yellow-500",
    iconColor: "text-yellow-500 group-hover:text-white",
  },
  {
    icon: Sun,
    title: "Kids Coaching",
    description: "Special training batches and camps for children of all skill levels",
    color: "bg-purple-500/10 group-hover:bg-purple-500",
    iconColor: "text-purple-500 group-hover:text-white",
  },
  {
    icon: Trophy,
    title: "Host Tournaments",
    description: "Perfect venue for your matches, tournaments, and events",
    color: "bg-red-500/10 group-hover:bg-red-500",
    iconColor: "text-red-500 group-hover:text-white",
  },
];

const Features = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground px-4">
            What We Offer
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Everything you need to train, play, and improve your game
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-card border-2 border-border hover:border-transparent transition-all duration-300 hover:shadow-2xl sm:hover:scale-105 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hover Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative p-6 sm:p-7 space-y-4">
                {/* Icon with Color */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${feature.color} flex items-center justify-center transition-all duration-300 sm:group-hover:scale-110`}>
                  <feature.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${feature.iconColor} transition-colors duration-300`} />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
