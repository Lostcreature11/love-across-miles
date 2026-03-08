import Starfield from "@/components/Starfield";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyYouSection from "@/components/WhyYouSection";
import DiarySection from "@/components/DiarySection";
import CountdownSection from "@/components/CountdownSection";
import GoldDivider from "@/components/GoldDivider";

const Index = () => (
  <div className="relative min-h-screen bg-background overflow-x-hidden">
    <Starfield />
    <CustomCursor />
    <div className="grain-overlay" />
    <Navbar />
    <HeroSection />
    <GoldDivider />
    <WhyYouSection />
    <GoldDivider />
    <DiarySection />
    <GoldDivider />
    <CountdownSection />
    <div className="py-12 text-center z-10 relative">
      <p className="font-italic italic text-muted-foreground text-xs">Made with love, across the distance ♡</p>
    </div>
  </div>
);

export default Index;
