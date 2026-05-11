import Hero from "@/components/Hero";
import About from "@/components/About";
import SportsServices from "@/components/SportsServices";
import Pricing from "@/components/Pricing";
import BookingWidget from "@/components/BookingWidget";
import LocationMap from "@/components/LocationMap";
import Footer from "@/components/Footer";

const App = () => {
  return (
    <main className="min-h-screen bg-background font-sans">
      <Hero />
      <About />
      <SportsServices />
      <Pricing />
      <BookingWidget />
      <LocationMap />
      <Footer />
    </main>
  );
};

export default App;
