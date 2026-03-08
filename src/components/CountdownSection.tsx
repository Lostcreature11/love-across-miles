import { useState, useEffect, useRef } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";

const LOVE_NOTES = [
  `"Love is the emblem of eternity; it confounds all notion of time; effaces all memory of a beginning, all fear of an end."\n— Anne Louise Germaine de Staël, Corinne`,
  `"He stepped down, trying not to look long at her, as if she were the sun, yet he saw her, like the sun, even without looking."\n— Leo Tolstoy, Anna Karenina`,
  `"Whatever our souls are made out of, his and mine are the same."\n— Emily Brontë, Wuthering Heights`,
  `"The minute I heard my first love story, I started looking for you."\n— Jalaluddin Rumi`,
  `"He was my North, my South, my East and West, my working week and my Sunday rest."\n— W.H. Auden, Stop All the Clocks`,
  `"I want to do with you what spring does with the cherry trees."\n— Pablo Neruda, Twenty Love Poems`,
  `"I choose him over and over again, and he chooses me."\n— Veronica Roth, Allegiant`,
  `"Each time you happen to me all over again."\n— Edith Wharton, The Age of Innocence`,
  `"You could have had anything else in the world, and you asked for me."\n— Cassandra Clare, City of Glass`,
  `"For the two of us, home isn't a place. It is a person. And we are finally home."\n— Stephanie Perkins, Anna and the French Kiss`,
  `"I loved her against reason, against promise, against peace, against hope, against happiness, against all discouragement that could be."\n— Charles Dickens, Great Expectations`,
  `"Who, being loved, is poor?"\n— Oscar Wilde, A Woman of No Importance`,
];

const CountdownSection = () => {
  const { roomId, me, members } = useRoom();
  const { notify } = useNotifications();
  const [meetingDate, setMeetingDate] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [now, setNow] = useState(Date.now());
  const [openedNotes, setOpenedNotes] = useState<number[]>([]);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs for realtime callback to avoid stale closures
  const meetingDateRef = useRef(meetingDate);
  const openedNotesRef = useRef(openedNotes);
  meetingDateRef.current = meetingDate;
  openedNotesRef.current = openedNotes;

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        const { data, error } = await supabase.from("rooms").select("countdown_date, opened_notes").eq("id", roomId).single();
        if (error) throw error;
        if (data) {
          if (data.countdown_date) { setMeetingDate(data.countdown_date); setDateInput(data.countdown_date); }
          if (data.opened_notes) setOpenedNotes(data.opened_notes as number[]);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load countdown data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]);

  // Realtime: listen for room changes — deps are only [roomId, me]
  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel('room-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const updated = payload.new as any;
        if (updated.countdown_date && updated.countdown_date !== meetingDateRef.current) {
          const partnerName = members.find(m => m.id !== me.id)?.name || "Your partner";
          notify("📅 Countdown updated", `${partnerName} set the meeting date to ${updated.countdown_date}`);
          setMeetingDate(updated.countdown_date);
          setDateInput(updated.countdown_date);
        }
        if (updated.opened_notes) {
          const newNotes = (updated.opened_notes as number[]).filter(n => !openedNotesRef.current.includes(n));
          if (newNotes.length > 0) {
            const partnerName = members.find(m => m.id !== me.id)?.name || "Your partner";
            notify("💌 Love note opened", `${partnerName} opened love note #${newNotes[newNotes.length - 1] + 1}`);
          }
          setOpenedNotes(updated.opened_notes as number[]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me]);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const saveDate = async () => {
    if (!dateInput || !roomId) return;
    try {
      const { error } = await supabase.from("rooms").update({ countdown_date: dateInput }).eq("id", roomId);
      if (error) throw error;
      setMeetingDate(dateInput);
      toast({ title: "📅 Date saved", description: `Meeting date set to ${dateInput}` });
    } catch {
      toast({ title: "Error", description: "Failed to save date", variant: "destructive" });
    }
  };

  const target = meetingDate ? new Date(meetingDate + "T00:00:00").getTime() : 0;
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const isNoteUnlocked = (index: number) => {
    if (!meetingDate) return false;
    const daysUntil = Math.ceil((new Date(meetingDate + "T00:00:00").getTime() - Date.now()) / 86400000);
    const totalNotes = LOVE_NOTES.length;
    return (totalNotes - daysUntil) > index;
  };

  const openNote = async (index: number) => {
    if (!isNoteUnlocked(index) || !roomId) return;
    if (!openedNotes.includes(index)) {
      const updated = [...openedNotes, index];
      setOpenedNotes(updated);
      try {
        const { error } = await supabase.from("rooms").update({ opened_notes: updated }).eq("id", roomId);
        if (error) throw error;
        toast({ title: "💌 Note opened", description: `Love note #${index + 1} revealed` });
      } catch {
        toast({ title: "Error", description: "Failed to save note state", variant: "destructive" });
      }
    }
    setActiveNote(index);
  };

  if (loading) {
    return (
      <section className="relative z-10 py-24 px-4 max-w-3xl mx-auto text-center">
        <p className="text-gold-accent font-italic italic animate-blink">Loading… ♡</p>
      </section>
    );
  }

  return (
    <section id="countdown" className="relative z-10 py-24 px-4 max-w-3xl mx-auto text-center">
      <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-6">Until We Meet</p>
      <h2 className="font-display text-4xl md:text-5xl text-cream-accent mb-10">
        The <span className="italic text-rose-accent">Countdown</span>
      </h2>

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
