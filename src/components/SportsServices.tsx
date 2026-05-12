import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
    {
        sport: "Cricket",
        duration: "2-Hour Sessions",
        price: "₹640",
        features: [
            "Professional Pitch Matting",
            "High-Quality Nets",
            "Night Match Lighting",
            "Tournament Hosting"
        ],
        image: "/cricket-icon.svg" // Placeholder or use Lucide
    },
    {
        sport: "Football",
        duration: "1-Hour Sessions",
        price: "₹450",
        features: [
            "FIFA Quality Turf",
            "5s and 7s Configuration",
            "Shadowless Floodlights",
            "Team Jersey Kits"
        ],
        image: "/football-icon.svg"
    }
];

const SportsServices = () => {
    return (
        <section className="py-20 sm:py-32 bg-white text-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-gray-900 tracking-tight">
                        Our <span className="text-[#84cc16]">Facilities</span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light">
                        World-class infrastructure designed for the modern athlete.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="group relative bg-[#F5F7FA] rounded-2xl p-8 sm:p-10 border border-gray-100 hover:border-[#84cc16]/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-sm hover:shadow-md"
                        >
                            {/* Decorative Background Circle */}
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl group-hover:bg-[#A3E635]/20 transition-colors duration-500" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h3 className="text-3xl font-bold font-heading text-gray-900 mb-2">
                                            {service.sport}
                                        </h3>
                                        <span className="inline-block px-3 py-1 bg-white border border-gray-200 shadow-sm rounded-full text-xs font-medium text-[#65a30d] tracking-wider uppercase">
                                            {service.duration}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 mb-1">Starts from</p>
                                        <p className="text-3xl font-bold text-[#65a30d] font-mono">{service.price}</p>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-10">
                                    {service.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center text-gray-700">
                                            <div className="mr-3 p-1 rounded-full bg-[#A3E635]/20 text-[#65a30d]">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className="w-full bg-white text-gray-900 hover:bg-[#A3E635] hover:text-[#1A2E05] font-bold h-12 border border-gray-200 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#A3E635]/20"
                                >
                                    Book {service.sport} Slot
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SportsServices;
