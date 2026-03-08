import { useState } from "react";
import Starfield from "@/components/Starfield";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyYouSection from "@/components/WhyYouSection";
import DiarySection from "@/components/DiarySection";
import CountdownSection from "@/components/CountdownSection";
import LettersSection from "@/components/LettersSection";
import SetupFlow from "@/components/SetupFlow";
import { useRoom } from "@/contexts/RoomContext";
import { useEffect } from "react";

const IndexContent = () => {
  const { isReady, roomCode } = useRoom();
  const [activeTab, setActiveTab] = useState("prologue");

  // Auto-fill code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !isReady) {
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

  const renderTab = () => {
    switch (activeTab) {
      case "prologue":
        return <HeroSection onExplore={() => setActiveTab("why-you")} />;
      case "why-you":
        return <WhyYouSection />;
      case "our-diary":
        return <DiarySection />;
      case "countdown":
        return <CountdownSection />;
      case "letters":
        return <LettersSection />;
      default:
        return <HeroSection onExplore={() => setActiveTab("why-you")} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <Starfield />
      <CustomCursor />
      <div className="grain-overlay" />
      {activeTab !== "prologue" && <Navbar activeTab={activeTab} onTabChange={setActiveTab} />}
      
      <div className={`${activeTab !== "prologue" ? "pt-16" : ""} min-h-screen`}>
        <div className="animate-fade-up" key={activeTab}>
          {renderTab()}
        </div>
      </div>

      <div className="py-6 text-center z-10 relative border-t border-border/30">
        <p className="font-italic italic text-muted-foreground text-xs">
          Room code: <span className="text-gold-accent">{roomCode}</span> · Made with love, across the distance ♡
        </p>
      </div>
    </div>
  );
};

const Index = () => <IndexContent />;

export default Index;
