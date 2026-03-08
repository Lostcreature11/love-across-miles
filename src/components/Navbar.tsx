import { useRoom } from "@/contexts/RoomContext";

const tabs = [
  { id: "why-you", label: "Why You", emoji: "⭐" },
  { id: "our-diary", label: "Diary", emoji: "📖" },
  { id: "countdown", label: "Countdown", emoji: "⏳" },
];

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  const { leaveRoom } = useRoom();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-3 px-3 bg-background/90 backdrop-blur-md border-b border-border">
      <button
        onClick={() => onTabChange("prologue")}
        className="text-gold-accent text-xs font-body hover:text-cream-accent transition-colors"
        title="Home"
      >
        ♡
      </button>

      <div className="flex gap-2 md:gap-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`font-body text-xs md:text-sm tracking-widest uppercase px-3 md:px-5 py-2 rounded-full transition-all ${
              activeTab === t.id
                ? "bg-gold/20 text-gold-accent border border-gold/40"
                : "text-muted-foreground hover:text-cream-accent hover:bg-muted/20"
            }`}
          >
            <span className="mr-1">{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={leaveRoom}
        className="text-muted-foreground text-xs font-body hover:text-destructive transition-colors"
        title="Leave Room"
      >
        Leave ✕
      </button>
    </nav>
  );
};

export default Navbar;
