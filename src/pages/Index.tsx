import Hero from "@/components/Hero";
import Features from "@/components/Features";
import LocationMap from "@/components/LocationMap";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <LocationMap />
      <Footer />
    </main>
  );
};

export default Index;
