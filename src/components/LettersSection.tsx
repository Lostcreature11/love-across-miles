import { useState, useEffect, useRef, useCallback } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import LetterOpeningFlow from "@/components/LetterOpeningFlow";

interface LoveLetter {
  id: string;
  room_id: string;
  sender_id: string;
  to_name: string;
  from_name: string;
  message: string;
  opened: boolean;
  created_at: string;
}

const LettersSection = () => {
  const { roomId, me, partner } = useRoom();
  const { notify } = useNotifications();
  const [view, setView] = useState<"compose" | "inbox">("inbox");
  const [toName, setToName] = useState(partner?.name || "");
  const [message, setMessage] = useState("");
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);
  const [showSentPreview, setShowSentPreview] = useState<LoveLetter | null>(null);
  const meRef = useRef(me);
  meRef.current = me;

  const fetchLetters = useCallback(async () => {
    if (!roomId) return;
    try {
      const { data, error } = await supabase
        .from("love_letters")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLetters((data as LoveLetter[]) || []);
    } catch {
      toast({ title: "Error", description: "Failed to load letters", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  // Realtime
  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel("love-letters-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "love_letters", filter: `room_id=eq.${roomId}` }, (payload) => {
        const letter = payload.new as LoveLetter;
        setLetters((prev) => [letter, ...prev]);
        if (letter.sender_id !== meRef.current?.id) {
          notify("💌 A letter arrived", `${letter.from_name} sent you a love letter`);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "love_letters", filter: `room_id=eq.${roomId}` }, (payload) => {
        const updated = payload.new as LoveLetter;
        setLetters((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me]);

  const handleSend = async () => {
    if (!roomId || !me || toName.trim().length === 0 || message.trim().length < 10) return;
    setSending(true);
    try {
      const { error } = await supabase.from("love_letters").insert({
        room_id: roomId,
        sender_id: me.id,
        to_name: toName.trim(),
        from_name: me.name,
        message: message.trim(),
      });
      if (error) throw error;
      toast({ title: "💌 Your letter is on its way…" });
      setMessage("");
      setToName(partner?.name || "");
      setView("inbox");
    } catch {
      toast({ title: "Error", description: "Failed to send letter", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleOpenLetter = async (letter: LoveLetter) => {
    if (letter.sender_id === me?.id) {
      setShowSentPreview(letter);
      return;
    }
    setSelectedLetter(letter);
    if (!letter.opened) {
      await supabase.from("love_letters").update({ opened: true }).eq("id", letter.id);
    }
  };

  const received = letters.filter((l) => l.sender_id !== me?.id);
  const sent = letters.filter((l) => l.sender_id === me?.id);

  return (
    <section className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Tab toggle */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setView("inbox")}
          className={`font-display text-sm tracking-widest uppercase px-6 py-2 rounded-full transition-all ${
            view === "inbox" ? "bg-[hsl(350_42%_68%/0.2)] text-rose-accent border border-[hsl(350_42%_68%/0.4)]" : "text-muted-foreground hover:text-cream-accent"
          }`}
        >
          📬 Inbox
        </button>
        <button
          onClick={() => setView("compose")}
          className={`font-display text-sm tracking-widest uppercase px-6 py-2 rounded-full transition-all ${
            view === "compose" ? "bg-[hsl(350_42%_68%/0.2)] text-rose-accent border border-[hsl(350_42%_68%/0.4)]" : "text-muted-foreground hover:text-cream-accent"
          }`}
        >
          ✍️ Compose
        </button>
      </div>

      {view === "compose" && (
        <div className="animate-fade-up">
          <h2 className="font-cursive text-3xl text-rose-accent text-center mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
            Write a Love Letter
          </h2>
          <div className="relative rounded-lg overflow-hidden border border-[hsl(39_42%_61%/0.3)]" style={{ background: "#fffdf8" }}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write from your heart… every word travels straight to them."
              className="min-h-[280px] w-full border-none bg-transparent px-8 py-6 text-base leading-8 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:italic"
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "1.2rem",
                color: "#3d2020",
                backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, rgba(180,160,130,0.25) 31px, rgba(180,160,130,0.25) 32px)",
                backgroundPosition: "0 20px",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-muted-foreground font-italic italic">{message.length} characters</span>
            <Button
              onClick={handleSend}
              disabled={sending || message.trim().length < 10}
              className="bg-[#c97070] hover:bg-[#b06060] text-white font-display tracking-wider"
            >
              {sending ? "Sending…" : "Send Letter 💌"}
            </Button>
          </div>
          {!partner && (
            <p className="text-center text-muted-foreground text-xs mt-4 font-italic italic">
              Your partner needs to join the room before you can send a letter ♡
            </p>
          )}
        </div>
      )}

      {view === "inbox" && (
        <div className="animate-fade-up space-y-8">
          {loading ? (
            <p className="text-center text-gold-accent font-italic italic animate-pulse">Loading… ♡</p>
          ) : (
            <>
              {/* Received */}
              <div>
                <h3 className="font-display text-lg text-gold-accent mb-4 tracking-wider">💌 Received</h3>
                {received.length === 0 ? (
                  <p className="text-center text-muted-foreground font-italic italic text-sm py-8">No letters yet… maybe send one first? ♡</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {received.map((letter) => (
                      <EnvelopeCard key={letter.id} letter={letter} isSent={false} onClick={() => handleOpenLetter(letter)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sent */}
              <div>
                <h3 className="font-display text-lg text-gold-accent mb-4 tracking-wider">✉️ Sent</h3>
                {sent.length === 0 ? (
                  <p className="text-center text-muted-foreground font-italic italic text-sm py-8">You haven't sent any letters yet ✦</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {sent.map((letter) => (
                      <EnvelopeCard key={letter.id} letter={letter} isSent={true} onClick={() => handleOpenLetter(letter)} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Full animated opening flow */}
      {selectedLetter && (
        <LetterOpeningFlow letter={selectedLetter} onClose={() => setSelectedLetter(null)} />
      )}

      {/* Sent letter preview */}
      {showSentPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowSentPreview(null)}>
          <div className="relative max-w-lg w-full mx-4 p-8 rounded-lg" style={{ background: "#fffdf8" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowSentPreview(null)} className="absolute top-3 right-3 text-[#3d2020]/50 hover:text-[#3d2020] text-sm">✕ Close</button>
            <p className="text-xs mb-1" style={{ color: "#c97070", fontFamily: "'Dancing Script', cursive" }}>To: {showSentPreview.to_name}</p>
            <p className="text-xs mb-4" style={{ color: "#c97070", fontFamily: "'Dancing Script', cursive" }}>From: {showSentPreview.from_name}</p>
            <div className="h-px w-full mb-4" style={{ background: "linear-gradient(90deg, transparent, #d4a574, transparent)" }} />
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, color: "#3d2020", lineHeight: 1.8 }}>
              {showSentPreview.message.split("\n").map((p, i) => <p key={i} className="mb-2">{p}</p>)}
            </div>
            <p className="text-right mt-6" style={{ fontFamily: "'Dancing Script', cursive", color: "#c97070" }}>
              — {showSentPreview.from_name} ♡
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

const EnvelopeCard = ({ letter, isSent, onClick }: { letter: LoveLetter; isSent: boolean; onClick: () => void }) => {
  const isOpened = isSent || letter.opened;
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:scale-105"
      style={{
        background: isOpened ? "hsl(39 42% 61% / 0.05)" : "hsl(350 42% 68% / 0.08)",
        borderColor: isOpened ? "hsl(39 42% 61% / 0.2)" : "hsl(350 42% 68% / 0.3)",
      }}
    >
      <span className={`text-4xl ${!isOpened ? "animate-pulse" : ""}`}>
        {isOpened ? "💌" : "✉️"}
      </span>
      <span className="text-xs text-muted-foreground font-italic italic truncate max-w-full">
        {isSent ? `To ${letter.to_name}` : `From ${letter.from_name}`}
      </span>
      <span className="text-[10px] text-muted-foreground/60">
        {new Date(letter.created_at).toLocaleDateString()}
      </span>
      {!isOpened && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#c97070] rounded-full animate-pulse" />
      )}
    </button>
  );
};

export default LettersSection;
