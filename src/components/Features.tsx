import { Calendar, Users, Zap, Trophy, Sun, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Online Booking",
    description: "Seamless booking system launching soon for hassle-free reservations",
  },
  {
    icon: Users,
    title: "Professional Coaches",
    description: "Expert trainers with proven track records in cricket and football",
  },
  {
    icon: Target,
    title: "Dedicated Facilities",
    description: "Cricket nets and full-sized football turf designed for excellence",
  },
  {
    icon: Zap,
    title: "LED Night Lighting",
    description: "Premium lighting for uninterrupted evening training sessions",
  },
  {
    icon: Sun,
    title: "Training Camps",
    description: "Specialized coaching batches for kids and skill development programs",
  },
  {
    icon: Trophy,
    title: "Tournament Ready",
    description: "Host your competitions with our dedicated tournament facilities",
  },
];

const Features = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground px-4">
            What We Offer
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            State-of-the-art facilities and professional coaching for athletes of all levels
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group border-2 hover:border-primary transition-all duration-300 hover:shadow-xl sm:hover:scale-105 animate-fade-in-up bg-card/50 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                {/* Icon */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary sm:group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
