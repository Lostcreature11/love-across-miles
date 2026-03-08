import { useState, useEffect } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";

const LOVE_NOTES = [
  "Good morning, love. Even before the sun rises, you're the first thing on my mind. I hope today treats you as gently as you treat my heart. ☀️",
  "Your voice is my favourite sound in this entire world. Even through a screen, it wraps around me like a blanket. I could listen to you forever. 🎧",
  "You make me feel safe — not just physically, but emotionally. With you, I never have to pretend. You're my softest place to land. 🤍",
  "I am so proud of you. Of everything you've done, everything you're becoming. Watching you grow is one of my greatest joys. 🌱",
  "Late at night, when the world goes quiet, my thoughts always drift to you. I wonder if you're sleeping, if you're dreaming of us too. 🌙",
  "It's the little things — the way you laugh, how you say my name, the random texts that make my whole day. You have no idea how much those moments mean to me. 💛",
  "One week closer. Seven fewer days between us and the moment I finally get to hold you. Every second brings us nearer. ⏳",
  "You are enough. More than enough. On your hard days, please remember that you are loved beyond measure — just as you are. 🫶",
  "I think about our future constantly — our first morning together, cooking breakfast, falling asleep side by side. It's going to be so beautiful. 🏡",
  "No reason. No occasion. I just wanted you to know: I love you. Deeply. Endlessly. Just because. 💌",
  "If I had to choose again — a thousand times, a million lifetimes — I would still choose you. Every single time. Always you. ♾️",
  "We're almost there. I can almost feel you. Hold on just a little longer, my love. The wait is almost over. 🤞✨",
];

const CountdownSection = () => {
  const { roomId } = useRoom();
  const [meetingDate, setMeetingDate] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [now, setNow] = useState(Date.now());
  const [openedNotes, setOpenedNotes] = useState<number[]>([]);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      const { data } = await supabase.from("rooms").select("countdown_date, opened_notes").eq("id", roomId).single();
      if (data) {
        if (data.countdown_date) { setMeetingDate(data.countdown_date); setDateInput(data.countdown_date); }
        if (data.opened_notes) setOpenedNotes(data.opened_notes as number[]);
      }
    };
    load();
  }, [roomId]);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const saveDate = async () => {
    if (!dateInput || !roomId) return;
    await supabase.from("rooms").update({ countdown_date: dateInput }).eq("id", roomId);
    setMeetingDate(dateInput);
  };

  const target = meetingDate ? new Date(meetingDate + "T00:00:00").getTime() : 0;
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const isNoteUnlocked = (index: number) => {
    if (!meetingDate) return false;
    const unlockDate = new Date(target - (12 - index) * 86400000);
    return Date.now() >= unlockDate.getTime();
  };

  const openNote = async (index: number) => {
    if (!isNoteUnlocked(index) || !roomId) return;
    if (!openedNotes.includes(index)) {
      const updated = [...openedNotes, index];
      setOpenedNotes(updated);
      await supabase.from("rooms").update({ opened_notes: updated }).eq("id", roomId);
    }
    setActiveNote(index);
  };

  return (
    <section id="countdown" className="relative z-10 py-24 px-4 max-w-3xl mx-auto text-center">
      <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-6">Until We Meet</p>
      <h2 className="font-display text-4xl md:text-5xl text-cream-accent mb-10">
        The <span className="italic text-rose-accent">Countdown</span>
      </h2>

      {/* Date input row */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
        <span className="text-muted-foreground text-xs font-body uppercase tracking-widest">Set your meeting date:</span>
        <input
          type="date"
          className="bg-input border border-border rounded px-4 py-2.5 text-sm text-foreground font-body"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
        />
        <button
          onClick={saveDate}
          className="px-6 py-2.5 bg-gold text-background rounded text-sm font-body uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Save ✦
        </button>
      </div>

      {/* Countdown display - always visible */}
      <div className="flex justify-center gap-8 md:gap-16 mb-6">
        {[
          { val: meetingDate ? days : null, label: "Days" },
          { val: meetingDate ? hours : null, label: "Hours" },
          { val: meetingDate ? minutes : null, label: "Minutes" },
          { val: meetingDate ? seconds : null, label: "Seconds" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="font-display text-5xl md:text-7xl text-gold-accent leading-none mb-2">
              {item.val !== null ? String(item.val).padStart(2, "0") : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground font-body uppercase tracking-[0.25em]">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="font-italic italic text-muted-foreground text-sm mb-16">
        {meetingDate
          ? `${days} days until I'm finally in your arms ♡`
          : "Set a date above to begin the countdown ♡"}
      </p>

      {/* Love Notes */}
      <h3 className="font-italic italic text-lg text-cream-accent mb-8">Love notes — open one each day ♡</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
        {LOVE_NOTES.map((_, i) => {
          const unlocked = isNoteUnlocked(i);
          const opened = openedNotes.includes(i);
          return (
            <button
              key={i}
              onClick={() => openNote(i)}
              className={`relative aspect-square rounded border flex flex-col items-center justify-center transition-all ${
                opened
                  ? "border-rose/60 bg-rose/10"
                  : unlocked
                  ? "border-gold/60 bg-gold/5 hover:bg-gold/15 hover:border-gold"
                  : "border-border/40 bg-muted/10 cursor-not-allowed opacity-50"
              }`}
            >
              <span className="font-display text-lg text-gold-accent">{i + 1}</span>
              <span className="text-[10px] mt-0.5">
                {opened ? <span className="text-rose-accent">♡</span> : unlocked ? <span className="text-gold-accent">✦</span> : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Note modal */}
      {activeNote !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setActiveNote(null)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative z-10 animate-envelope bg-card border border-gold/30 rounded-lg p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-4">💌</div>
            <p className="font-italic italic text-foreground leading-relaxed text-sm">{LOVE_NOTES[activeNote]}</p>
            <button onClick={() => setActiveNote(null)} className="mt-6 text-gold-accent text-xs font-body hover:text-cream-accent">Close ✕</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CountdownSection;
