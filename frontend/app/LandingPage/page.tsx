import { Navbar } from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import ProcessSection from "../components/ProcessSection";
import TestimonialsSection from "../components/TestimonialsSection";
import FAQSection from "../components/FAQSection";
import { CTASection } from "../components/CTASection";
import { Footer } from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col gap-16 pb-12">
      <Navbar />
      <main className="flex flex-col gap-16">
        <HeroSection />
        <FeaturesSection />
        <ProcessSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

