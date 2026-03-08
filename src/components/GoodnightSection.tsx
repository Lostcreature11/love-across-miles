import { useState, useEffect, useRef } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { playChime } from "@/lib/sounds";

interface GoodnightRitual {
  id: string;
  room_id: string;
  sender_id: string;
  message: string | null;
  created_at: string;
}

const HEART_COUNT = 25;

const FloatingHeart = ({ delay, x }: { delay: number; x: number }) => (
  <div
    className="absolute text-rose-accent pointer-events-none"
    style={{
      left: `${x}%`,
      bottom: "-20px",
      fontSize: `${Math.random() * 16 + 12}px`,
      opacity: 0,
      animation: `floatUp ${3 + Math.random() * 2}s ease-out ${delay}s forwards`,
    }}
  >
    {Math.random() > 0.5 ? "♡" : "✦"}
  </div>
);

const GoodnightSection = () => {
  const { roomId, me, partner } = useRoom();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [lastReceived, setLastReceived] = useState<GoodnightRitual | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ name: string; message: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const meRef = useRef(me);
  meRef.current = me;

  // Load last received goodnight
  useEffect(() => {
    if (!roomId || !me) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("goodnight_rituals")
          .select("*")
          .eq("room_id", roomId)
          .neq("sender_id", me.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (data && data.length > 0) setLastReceived(data[0] as GoodnightRitual);
      } catch {}
      setLoading(false);
    };
    load();
  }, [roomId, me]);

  // Realtime listener
  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel(`goodnight-${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "goodnight_rituals",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const ritual = payload.new as GoodnightRitual;
        if (ritual.sender_id !== meRef.current?.id) {
          const senderName = partner?.name || "Your love";
          setOverlayData({ name: senderName, message: ritual.message });
          setShowOverlay(true);
          setLastReceived(ritual);
          setTimeout(() => setShowOverlay(false), 6000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me, partner]);

  const handleSend = async () => {
    if (!roomId || !me) return;
    setSending(true);
    try {
      const { error } = await supabase.from("goodnight_rituals").insert({
        room_id: roomId,
        sender_id: me.id,
        message: message.trim() || null,
      });
      if (error) throw error;
      toast({ title: "🌙 Goodnight sent", description: "Sweet dreams are on their way…" });
      setMessage("");
    } catch {
      toast({ title: "Error", description: "Failed to send goodnight", variant: "destructive" });
    }
    setSending(false);
  };

  if (loading) {
    return (
      <section className="relative z-10 py-24 px-4 max-w-2xl mx-auto text-center">
        <p className="text-gold-accent font-italic italic animate-blink">Loading… ♡</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen px-4 py-8 max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10">
      {/* Moon */}
      <div className="relative mb-10">
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, hsl(var(--gold) / 0.3) 0%, transparent 70%)",
            boxShadow: "0 0 80px 30px hsl(var(--gold) / 0.1)",
          }}
        >
          <span className="text-7xl" style={{ filter: "drop-shadow(0 0 20px hsl(var(--gold) / 0.5))" }}>🌙</span>
        </div>
      </div>

      <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-2">Goodnight Ritual</p>
      <h2 className="font-display text-4xl md:text-5xl text-cream-accent mb-2">
        Sweet <span className="italic text-rose-accent">Dreams</span>
      </h2>
      <p className="font-italic italic text-muted-foreground text-sm mb-10">
        Send a goodnight kiss across the distance ♡
      </p>

      {/* Optional message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a little note… (optional)"
        className="w-full max-w-sm bg-input border border-border rounded-lg px-4 py-3 text-foreground font-italic italic text-sm resize-none mb-6 text-center focus:outline-none focus:border-gold/50"
        rows={2}
        maxLength={200}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending}
        className="px-8 py-3 rounded-full font-display text-sm tracking-widest uppercase transition-all disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, hsl(var(--rose) / 0.3), hsl(var(--gold) / 0.3))",
          border: "1px solid hsl(var(--gold) / 0.4)",
          color: "hsl(var(--cream))",
          boxShadow: "0 0 30px hsl(var(--rose) / 0.15)",
          animation: "softPulse 3s ease-in-out infinite",
        }}
      >
        {sending ? "Sending…" : "Send Goodnight 🌙♡"}
      </button>

      {/* Last received */}
      {lastReceived && (
        <div className="mt-12 p-5 rounded-lg text-center max-w-sm w-full" style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Last goodnight received</p>
          <p className="font-italic italic text-cream-accent text-sm">
            {lastReceived.message || "A silent goodnight kiss 🌙"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            {new Date(lastReceived.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}

      {/* Overlay animation when receiving a goodnight */}
      {showOverlay && overlayData && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          onClick={() => setShowOverlay(false)}
          style={{ animation: "overlayFadeIn 0.5s ease-out forwards" }}
        >
          <div className="absolute inset-0" style={{ background: "rgba(5, 5, 10, 0.92)" }} />
          
          {/* Floating hearts */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: HEART_COUNT }, (_, i) => (
              <FloatingHeart key={i} delay={Math.random() * 2} x={Math.random() * 100} />
            ))}
          </div>

          <div className="relative z-10 text-center animate-fade-up">
            <span className="text-6xl mb-6 block" style={{ filter: "drop-shadow(0 0 30px hsl(var(--gold) / 0.6))" }}>🌙</span>
            <p className="font-display text-2xl text-cream-accent mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
              {overlayData.name}
            </p>
            <p className="font-italic italic text-rose-accent text-sm mb-4">
              is sending you goodnight… ♡
            </p>
            {overlayData.message && (
              <p className="font-italic italic text-cream-accent/80 text-sm max-w-xs mx-auto">
                "{overlayData.message}"
              </p>
            )}
            <p className="text-muted-foreground text-[10px] mt-8 animate-blink">tap anywhere to close</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default GoodnightSection;
