import { useRoom } from "@/contexts/RoomContext";

const HeroSection = () => {
  const { me, partner } = useRoom();

  return (
    <section id="prologue" className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 z-10">
      <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-6 animate-fade-up">
        A love story, told across the distance
      </p>
      <h1 className="font-display text-6xl md:text-8xl font-bold text-cream-accent animate-fade-up-delay-1">
        {me?.name || "You"} & <span className="italic text-rose-accent">{partner?.name || "Me"}</span>
      </h1>
      <p className="font-italic italic text-lg md:text-xl text-muted-foreground mt-6 max-w-lg animate-fade-up-delay-2">
        "Distance means so little when someone means so much."
      </p>
      <div className="flex items-center gap-4 mt-16 animate-fade-up-delay-3">
        <span className="w-12 h-px bg-gold" />
        <span className="text-gold-accent text-xs uppercase tracking-widest font-body animate-blink">scroll to begin</span>
        <span className="w-12 h-px bg-gold" />
      </div>
    </section>
  );
};

export default HeroSection;
