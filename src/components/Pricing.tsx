import { Info } from "lucide-react";

const pricingData = [
    { period: "Morning (6 AM - 12 PM)", cricket: "₹800", football: "₹500" },
    { period: "Afternoon (12 PM - 5 PM)", cricket: "₹640*", football: "₹450*" },
    { period: "Evening (5 PM - 9 PM)", cricket: "₹1,040", football: "₹600" },
    { period: "Night (9 PM - 11 PM)", cricket: "₹1,200", football: "₹700" },
];

const Pricing = () => {
    return (
        <section className="py-20 sm:py-32 bg-cream text-charcoal">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-forest tracking-tight">
                        Transparent <span className="text-gold">Pricing</span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Simple, affordable rates with no hidden charges.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-forest text-white">
                                    <th className="p-6 font-heading font-bold text-lg tracking-wide border-b border-white/10">Time Slot</th>
                                    <th className="p-6 font-heading font-bold text-lg tracking-wide border-b border-white/10">Cricket (2 Hrs)</th>
                                    <th className="p-6 font-heading font-bold text-lg tracking-wide border-b border-white/10">Football (1 Hr)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pricingData.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-6 font-medium text-gray-800">{row.period}</td>
                                        <td className="p-6 font-mono font-bold text-forest">{row.cricket}</td>
                                        <td className="p-6 font-mono font-bold text-forest">{row.football}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-start gap-3 text-sm text-gray-500">
                        <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p>* Special weekday discount applied for afternoon slots.</p>
                            <p>• Bulk booking discount of 10% available for 2+ slots.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
