import { useState } from "react";
import { useRoom } from "@/contexts/RoomContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const tabs = [
  { id: "why-you", label: "Why You", emoji: "⭐" },
  { id: "our-diary", label: "Diary", emoji: "📖" },
  { id: "countdown", label: "Countdown", emoji: "⏳" },
  { id: "letters", label: "Letters", emoji: "💌" },
  { id: "goodnight", label: "Goodnight", emoji: "🌙" },
  { id: "red-string", label: "Red String", emoji: "🔴" },
  { id: "heartbeat", label: "Heartbeat", emoji: "🫀" },
  { id: "wishes", label: "Wishes", emoji: "💫" },
];

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  const { leaveRoom } = useRoom();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-3 px-3 bg-background/90 backdrop-blur-md border-b border-border">
        <button
          onClick={() => onTabChange("prologue")}
          className="text-gold-accent text-xs font-body hover:text-cream-accent transition-colors"
          title="Home"
        >
          ♡
        </button>

        <div className="flex gap-1 md:gap-3 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`font-body text-[10px] md:text-xs tracking-widest uppercase px-2 md:px-4 py-1.5 md:py-2 rounded-full transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === t.id
                  ? "bg-gold/20 text-gold-accent border border-gold/40"
                  : "text-muted-foreground hover:text-cream-accent hover:bg-muted/20"
              }`}
            >
              <span className="mr-0.5 md:mr-1">{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowLeaveDialog(true)}
          className="text-muted-foreground text-xs font-body hover:text-destructive transition-colors"
          title="Leave Room"
        >
          Leave ✕
        </button>
      </nav>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need the room code to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={leaveRoom}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Navbar;
