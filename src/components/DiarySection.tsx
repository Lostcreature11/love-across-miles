import { useState, useEffect, useCallback } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";

interface DiaryEntry {
  id: string;
  date: string;
  member_id: string;
  text: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TypewriterText = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}</span>;
};

type DiaryMode = "calendar" | "write" | "read";

const DiarySection = () => {
  const { roomId, me, members } = useRoom();
  const { notify } = useNotifications();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [myText, setMyText] = useState("");
  const [mode, setMode] = useState<DiaryMode>("calendar");

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      const { data } = await supabase.from("diary_entries").select("*").eq("room_id", roomId);
      if (data) setEntries(data.map((e) => ({ id: e.id, date: e.date, member_id: e.member_id, text: e.text })));
    };
    load();
  }, [roomId]);

  // Realtime: listen for partner diary changes
  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel('diary-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'diary_entries', filter: `room_id=eq.${roomId}` }, (payload) => {
        const newEntry = payload.new as any;
        if (newEntry.member_id !== me.id) {
          const partnerName = members.find(m => m.id === newEntry.member_id)?.name || "Your partner";
          notify("💌 New diary entry", `${partnerName} wrote a diary entry for ${newEntry.date}`);
          setEntries(prev => [...prev.filter(e => e.id !== newEntry.id), { id: newEntry.id, date: newEntry.date, member_id: newEntry.member_id, text: newEntry.text }]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'diary_entries', filter: `room_id=eq.${roomId}` }, (payload) => {
        const updated = payload.new as any;
        if (updated.member_id !== me.id) {
          const partnerName = members.find(m => m.id === updated.member_id)?.name || "Your partner";
          notify("✏️ Diary updated", `${partnerName} updated their entry for ${updated.date}`);
        }
        setEntries(prev => prev.map(e => e.id === updated.id ? { ...e, text: updated.text } : e));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'diary_entries', filter: `room_id=eq.${roomId}` }, (payload) => {
        const old = payload.old as any;
        setEntries(prev => prev.filter(e => e.id !== old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me, members, notify]);

  const today = new Date().toISOString().split("T")[0];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const getEntries = useCallback((date: string) => entries.filter((e) => e.date === date), [entries]);

  const sheMember = members.find((m) => m.pronoun === "she");
  const heMember = members.find((m) => m.pronoun === "he");
  const sheCount = entries.filter((e) => e.member_id === sheMember?.id).length;
  const heCount = entries.filter((e) => e.member_id === heMember?.id).length;

  const openDay = (day: number, targetMode: DiaryMode) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
    const myEntry = entries.find((e) => e.date === date && e.member_id === me?.id);
    setMyText(myEntry?.text || "");
    setBookOpen(false);
    setMode(targetMode);
  };

  const saveEntry = async () => {
    if (!selectedDate || !roomId || !me) return;
    const existing = entries.find((e) => e.date === selectedDate && e.member_id === me.id);
    if (existing) {
      if (myText.trim()) {
        await supabase.from("diary_entries").update({ text: myText.trim() }).eq("id", existing.id);
        setEntries((prev) => prev.map((e) => e.id === existing.id ? { ...e, text: myText.trim() } : e));
        toast({ title: "✨ Entry updated", description: "Your diary entry has been saved" });
      } else {
        await supabase.from("diary_entries").delete().eq("id", existing.id);
        setEntries((prev) => prev.filter((e) => e.id !== existing.id));
        toast({ title: "🗑️ Entry deleted", description: "Your diary entry has been removed" });
      }
    } else if (myText.trim()) {
      const { data } = await supabase.from("diary_entries")
        .insert({ room_id: roomId, member_id: me.id, date: selectedDate, text: myText.trim() })
        .select().single();
      if (data) setEntries((prev) => [...prev, { id: data.id, date: data.date, member_id: data.member_id, text: data.text }]);
      toast({ title: "💌 Entry saved", description: `Your diary entry for ${selectedDate} has been saved` });
    }
    setMode("calendar");
    setSelectedDate(null);
  };

  const deleteEntry = async () => {
    if (!selectedDate || !me) return;
    const existing = entries.find((e) => e.date === selectedDate && e.member_id === me.id);
    if (existing) {
      await supabase.from("diary_entries").delete().eq("id", existing.id);
      setEntries((prev) => prev.filter((e) => e.id !== existing.id));
      toast({ title: "🗑️ Entry deleted", description: "Your diary entry has been removed" });
    }
    setMyText("");
    setMode("calendar");
    setSelectedDate(null);
  };

  const backToCalendar = () => { setMode("calendar"); setSelectedDate(null); };

  const getEntryByMember = (date: string, memberId: string) => entries.find((e) => e.date === date && e.member_id === memberId);

  return (
    <section id="our-diary" className="relative z-10 py-24 px-4 max-w-3xl mx-auto">
      <h2 className="font-display text-4xl md:text-5xl text-center text-cream-accent mb-2">
        Our <span className="italic text-rose-accent">Diary</span>
      </h2>
      <p className="font-italic italic text-center text-muted-foreground mb-8 text-sm">365 Days of Love</p>

      {mode === "calendar" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); } else setCurrentMonth((m) => m - 1); }} className="text-gold-accent text-sm font-body hover:text-cream-accent">← Prev</button>
            <span className="font-display text-lg text-cream-accent">{MONTHS[currentMonth]} {currentYear}</span>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); } else setCurrentMonth((m) => m + 1); }} className="text-gold-accent text-sm font-body hover:text-cream-accent">Next →</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground font-body py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEntries = getEntries(date);
              const isToday = date === today;
              const hasEntries = dayEntries.length > 0;
              return (
                <div key={day} className={`relative aspect-square flex flex-col items-center justify-center rounded text-sm font-body ${isToday ? "ring-1 ring-gold" : ""}`}>
                  <span className="text-foreground text-xs mb-1">{day}</span>
                  <div className="flex gap-0.5 mb-1">
                    {dayEntries.some((e) => e.member_id === sheMember?.id) && <span className="w-1.5 h-1.5 rounded-full bg-rose" />}
                    {dayEntries.some((e) => e.member_id === heMember?.id) && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openDay(day, "write")} className="text-[8px] text-gold-accent hover:text-cream-accent" title="Write">✎</button>
                    {hasEntries && <button onClick={() => openDay(day, "read")} className="text-[8px] text-rose-accent hover:text-cream-accent" title="Read">📖</button>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-6 text-xs font-body text-muted-foreground">
            <span className="text-rose">{sheMember?.name || "Her"}: {sheCount}</span>
            <span>Total: {entries.length}</span>
            <span className="text-gold">{heMember?.name || "Him"}: {heCount}</span>
          </div>
        </>
      )}

      {mode === "write" && selectedDate && (
        <div className="animate-fade-up">
          <button onClick={backToCalendar} className="text-gold-accent text-sm font-body mb-6 hover:text-cream-accent">← Back to Calendar</button>
          <div className="bg-parchment diary-page-lines rounded-lg p-8 max-w-lg mx-auto min-h-[400px]">
            <p className="font-handwriting text-sm mb-1" style={{ color: "#3a2a1a" }}>{selectedDate}</p>
            <p className={`font-handwriting text-sm mb-4 ${me?.pronoun === "she" ? "text-rose" : "text-gold"}`}>
              {me?.name}'s entry
            </p>
            <textarea
              className="w-full bg-transparent font-handwriting text-lg leading-[32px] resize-none outline-none min-h-[250px]"
              style={{ color: me?.pronoun === "she" ? "#3a2a1a" : "#1a1a3a" }}
              placeholder="Write your heart out…"
              value={myText}
              onChange={(e) => setMyText(e.target.value)}
            />
            <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px dashed #c0b090" }}>
              <button onClick={saveEntry} className={`text-sm font-body px-4 py-2 rounded transition-opacity hover:opacity-90 ${me?.pronoun === "she" ? "bg-rose/80 text-background" : "bg-gold/80 text-background"}`}>Save {me?.pronoun === "she" ? "🦋" : "🦢"}</button>
              <button onClick={deleteEntry} className="text-sm font-body px-4 py-2 bg-muted text-foreground rounded hover:opacity-80">Delete</button>
              <button onClick={backToCalendar} className="text-sm font-body px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {mode === "read" && selectedDate && (
        <div className="animate-fade-up">
          <button onClick={backToCalendar} className="text-gold-accent text-sm font-body mb-6 hover:text-cream-accent">← Back to Calendar</button>
          <div className="flex justify-center">
            {!bookOpen ? (
              <button onClick={() => setBookOpen(true)} className="relative w-64 h-80 rounded-lg shadow-2xl flex flex-col items-center justify-center gap-4 transition-transform hover:scale-105" style={{ background: "linear-gradient(135deg, #2a1a0e 0%, #1a0e05 100%)" }}>
                <div className="absolute left-3 top-0 bottom-0 w-2 rounded-full" style={{ background: "#0d0805" }} />
                <div className="text-gold-accent text-4xl">♡</div>
                <span className="text-cream-accent font-display text-sm">{selectedDate}</span>
                <span className="text-gold-accent text-xs font-italic italic animate-blink">tap to open ♡</span>
              </button>
            ) : (
              <div className="animate-book-open w-full">
                <div className="flex flex-col md:flex-row w-full max-w-3xl mx-auto max-h-[70vh] rounded-lg overflow-hidden shadow-2xl">
                  <div className="flex-1 bg-parchment diary-page-lines p-6 overflow-y-auto min-h-[300px] md:min-h-[400px]">
                    <p className="font-handwriting text-sm" style={{ color: "#3a2a1a" }}>{selectedDate}</p>
                    <p className="font-handwriting text-rose text-sm mb-3">{sheMember?.name || "Her"}</p>
                    {(() => {
                      const entry = sheMember ? getEntryByMember(selectedDate, sheMember.id) : null;
                      return entry ? (
                        <p className="font-handwriting text-base leading-8" style={{ color: "#3a2a1a" }}><TypewriterText text={entry.text} /></p>
                      ) : (
                        <p className="font-italic italic text-sm" style={{ color: "#8a7a6a" }}>No entry yet for this day… come back when your heart is full.</p>
                      );
                    })()}
                  </div>
                  <div className="w-full md:w-3 h-3 md:h-auto flex-shrink-0" style={{ background: "#0d0805" }} />
                  <div className="flex-1 bg-parchment diary-page-lines p-6 overflow-y-auto min-h-[300px] md:min-h-[400px]">
                    <p className="font-handwriting text-sm" style={{ color: "#3a2a1a" }}>{selectedDate}</p>
                    <p className="font-handwriting text-gold text-sm mb-3">{heMember?.name || "Him"}</p>
                    {(() => {
                      const entry = heMember ? getEntryByMember(selectedDate, heMember.id) : null;
                      return entry ? (
                        <p className="font-handwriting text-base leading-8" style={{ color: "#1a1a3a" }}><TypewriterText text={entry.text} /></p>
                      ) : (
                        <p className="font-italic italic text-sm" style={{ color: "#8a7a6a" }}>No entry yet for this day… come back when your heart is full.</p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default DiarySection;
