import Starfield from "@/components/Starfield";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyYouSection from "@/components/WhyYouSection";
import DiarySection from "@/components/DiarySection";
import CountdownSection from "@/components/CountdownSection";
import GoldDivider from "@/components/GoldDivider";
import SetupFlow from "@/components/SetupFlow";
import { useRoom } from "@/contexts/RoomContext";
import { useEffect } from "react";

const IndexContent = () => {
  const { isReady, roomCode, joinRoom } = useRoom();

  // Auto-fill code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !isReady) {
      // Store for the setup flow to use
      localStorage.setItem("pending_room_code", code.toUpperCase());
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="relative min-h-screen bg-background overflow-x-hidden">
        <Starfield />
        <CustomCursor />
        <div className="grain-overlay" />
        <SetupFlow />
      </div>
    );
  }

  return (
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
        <p className="font-italic italic text-muted-foreground text-xs">
          Room code: <span className="text-gold-accent">{roomCode}</span> · Made with love, across the distance ♡
        </p>
      </div>
    </div>
  );
};

const Index = () => <IndexContent />;

export default Index;
