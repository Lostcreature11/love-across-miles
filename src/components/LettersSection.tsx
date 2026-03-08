import { useState, useEffect, useRef, useCallback } from "react";
import mailboxImg from "@/assets/mailbox.png";
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
          {/* To field */}
          <div className="mb-4 flex items-center gap-3 px-1">
            <span className="text-sm uppercase tracking-widest font-display" style={{ color: "#c97070" }}>To:</span>
            <input
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="Their name…"
              className="flex-1 bg-transparent border-b border-[hsl(39_42%_61%/0.3)] pb-1 text-foreground font-handwriting text-lg focus:outline-none focus:border-[hsl(350_42%_68%/0.6)] placeholder:text-muted-foreground/50 placeholder:italic"
            />
          </div>
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
              disabled={sending || message.trim().length < 10 || toName.trim().length === 0}
              className="bg-[#c97070] hover:bg-[#b06060] text-white font-display tracking-wider"
            >
              {sending ? "Sending…" : "Send Letter 💌"}
            </Button>
          </div>
        </div>
      )}

      {view === "inbox" && (
        <div className="animate-fade-up">
          {loading ? (
            <p className="text-center text-gold-accent font-italic italic animate-pulse">Loading… ♡</p>
          ) : (
            <div className="flex flex-col items-center">
              {/* Mailbox with letters stacked inside */}
              <div className="relative mb-10">
                <img src={mailboxImg} alt="Love mailbox" className="w-56 sm:w-64 mx-auto rounded-xl drop-shadow-lg relative z-10" />
                {/* Unread badge */}
                {received.filter(l => !l.opened).length > 0 && (
                  <div className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse shadow-lg" style={{ background: "#c04040" }}>
                    {received.filter(l => !l.opened).length}
                  </div>
                )}
                {/* Letters stacked behind/inside the mailbox */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[5] flex items-end justify-center" style={{ width: "220px" }}>
                  {received.slice(0, 6).map((letter, i) => {
                    const isOpened = letter.opened;
                    const total = Math.min(received.length, 6);
                    const offset = (i - (total - 1) / 2) * 18;
                    const rotation = (i - (total - 1) / 2) * 5;
                    const peekHeight = 20 + i * 6;
                    return (
                      <div
                        key={letter.id}
                        className="absolute cursor-pointer transition-all duration-300 hover:-translate-y-4 hover:z-30 hover-wiggle opacity-0"
                        style={{
                          left: `calc(50% + ${offset}px)`,
                          bottom: `${peekHeight}px`,
                          transform: `translateX(-50%) rotate(${rotation}deg)`,
                          zIndex: 5 + i,
                          animation: `mailboxSpill 0.7s cubic-bezier(.34,1.56,.64,1) ${0.3 + i * 0.12}s forwards`,
                        }}
                        onClick={() => handleOpenLetter(letter)}
                      >
                        <div
                          className="w-20 h-14 rounded-md shadow-md relative overflow-hidden"
                          style={{
                            background: isOpened ? "#fffdf8" : "#f5d5d5",
                            border: `1.5px solid ${isOpened ? "hsl(var(--gold))" : "hsl(var(--rose))"}`,
                          }}
                        >
                          <div className="absolute top-0 left-0 w-full" style={{ height: 0, borderLeft: "40px solid transparent", borderRight: "40px solid transparent", borderTop: `16px solid ${isOpened ? "#e8d8c8" : "#e8b8b8"}` }} />
                          {!isOpened && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center animate-pulse" style={{ background: "#c04040" }}>
                              <span className="text-white text-[8px]">♡</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground text-center mt-1 italic truncate w-20">
                          {letter.from_name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clean chronological list */}
              <div className="w-full space-y-3">
                {letters.length === 0 ? (
                  <p className="text-center text-muted-foreground font-italic italic text-sm py-6">No letters yet… write one to get started ♡</p>
                ) : (
                  letters.map((letter, i) => {
                    const isMine = letter.sender_id === me?.id;
                    const isOpened = isMine || letter.opened;
                    const dateLabel = new Date(letter.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    return (
                      <div
                        key={letter.id}
                        onClick={() => handleOpenLetter(letter)}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01] opacity-0"
                        style={{
                          background: isOpened ? "hsl(var(--card))" : "hsl(var(--rose) / 0.1)",
                          border: `1px solid ${isOpened ? "hsl(var(--border))" : "hsl(var(--rose) / 0.3)"}`,
                          animation: `mailboxSpill 0.5s ease-out ${0.1 + i * 0.06}s forwards`,
                        }}
                      >
                        {/* Envelope icon */}
                        <div className="relative flex-shrink-0 w-10 h-8 rounded-sm overflow-hidden" style={{
                          background: isOpened ? "#fffdf8" : "#f5d5d5",
                          border: `1px solid ${isOpened ? "hsl(var(--gold) / 0.5)" : "hsl(var(--rose) / 0.5)"}`,
                        }}>
                          <div className="absolute top-0 left-0 w-full" style={{ height: 0, borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: `10px solid ${isOpened ? "#e8d8c8" : "#e8b8b8"}` }} />
                          {!isOpened && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]" style={{ color: "#c04040" }}>♡</div>
                          )}
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm text-foreground truncate">
                              {isMine ? `To ${letter.to_name}` : `From ${letter.from_name}`}
                            </span>
                            {isMine && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-display tracking-wider" style={{ background: "hsl(var(--gold) / 0.15)", color: "hsl(var(--gold))" }}>sent</span>
                            )}
                            {!isOpened && (
                              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#c04040" }} />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-italic italic truncate mt-0.5">
                            {letter.message.slice(0, 50)}{letter.message.length > 50 ? "…" : ""}
                          </p>
                        </div>
                        {/* Date */}
                        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 whitespace-nowrap">{dateLabel}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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

const MailboxEnvelope = ({ letter, isSent, onClick }: { letter: LoveLetter; isSent: boolean; onClick: () => void }) => {
  const isOpened = isSent || letter.opened;
  return (
    <button
      onClick={onClick}
      className="group relative w-32 sm:w-36 transition-all hover:scale-105 hover:-translate-y-1"
    >
      {/* Envelope shape */}
      <div
        className="relative w-full h-24 rounded-md shadow-md overflow-hidden"
        style={{
          background: isOpened ? "#fffdf8" : "#f5d5d5",
          border: `1.5px solid ${isOpened ? "#d4a574" : "#c97070"}`,
        }}
      >
        {/* Flap triangle */}
        <div className="absolute top-0 left-0 w-full" style={{ height: 0, borderLeft: "64px solid transparent", borderRight: "64px solid transparent", borderTop: `28px solid ${isOpened ? "#e8d8c8" : "#e8b8b8"}` }} />
        {/* Heart seal */}
        {!isOpened && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm animate-pulse" style={{ background: "#c04040" }}>
            <span className="text-white text-xs">♡</span>
          </div>
        )}
        {isOpened && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-40">💌</span>
        )}
      </div>
      {/* Label */}
      <p className="mt-2 text-xs text-muted-foreground font-italic italic truncate">
        {isSent ? `To ${letter.to_name}` : `From ${letter.from_name}`}
      </p>
      <p className="text-[10px] text-muted-foreground/50">
        {new Date(letter.created_at).toLocaleDateString()}
      </p>
      {/* Unread dot */}
      {!isOpened && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#c04040] rounded-full animate-pulse shadow" />
      )}
    </button>
  );
};

export default LettersSection;
