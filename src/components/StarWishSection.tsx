import { useState } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const StarWishSection = () => {
  const { roomId, me } = useRoom();
  const [wish, setWish] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!roomId || !me || !wish.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("star_wishes").insert({
        room_id: roomId,
        sender_id: me.id,
        wish: wish.trim(),
      });
      if (error) throw error;
      setWish("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      toast({ title: "Error", description: "Failed to send wish", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <section className="min-h-screen px-4 py-8 max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10">
      <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-2">Shooting Star</p>
      <h2 className="font-display text-4xl md:text-5xl text-cream-accent mb-2 text-center">
        Make a <span className="italic text-rose-accent">Wish</span>
      </h2>
      <p className="font-italic italic text-muted-foreground text-sm mb-12 text-center">
        It will find them, carried by a star ✦
      </p>

      <div className="w-full max-w-sm">
        <input
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder="Make a wish… it will find them ✨"
          className="w-full bg-transparent border-b border-gold/30 pb-3 text-foreground font-italic italic text-center text-lg focus:outline-none focus:border-gold/60 placeholder:text-muted-foreground/40 placeholder:italic"
          maxLength={140}
        />
        <p className="text-right text-[10px] text-muted-foreground mt-1">{wish.length}/140</p>
      </div>

      <button
        onClick={handleSend}
        disabled={sending || !wish.trim()}
        className="mt-8 px-8 py-3 rounded-full font-display text-sm tracking-widest uppercase transition-all disabled:opacity-50"
        style={{
          background: "hsl(var(--gold) / 0.15)",
          border: "1px solid hsl(var(--gold) / 0.3)",
          color: "hsl(var(--gold))",
        }}
      >
        {sending ? "Releasing…" : "Release ✦"}
      </button>

      {/* Sent confirmation */}
      {sent && (
        <p className="mt-6 font-italic italic text-gold-accent text-sm animate-fade-up">
          Your wish is traveling to them… ✨
        </p>
      )}
    </section>
  );
};

export default StarWishSection;
