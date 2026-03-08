import { useState, useEffect, useCallback } from "react";

const DIARY_KEY = "diary_entries";
const DIARY_IDENTITY = "diary_identity";
const DIARY_NAMES = "diary_names";

interface DiaryEntry {
  date: string;
  author: "her" | "him";
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

const DiarySection = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(DIARY_KEY) || "[]"); } catch { return []; }
  });
  const [identity, setIdentity] = useState<"her" | "him" | null>(() =>
    (localStorage.getItem(DIARY_IDENTITY) as "her" | "him") || null
  );
  const [names, setNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DIARY_NAMES) || '{"her":"Her","him":"Him"}'); } catch { return { her: "Her", him: "Him" }; }
  });
  const [showSetup, setShowSetup] = useState(!identity);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [herText, setHerText] = useState("");
  const [himText, setHimText] = useState("");

  useEffect(() => { localStorage.setItem(DIARY_KEY, JSON.stringify(entries)); }, [entries]);
  useEffect(() => { if (identity) localStorage.setItem(DIARY_IDENTITY, identity); }, [identity]);
  useEffect(() => { localStorage.setItem(DIARY_NAMES, JSON.stringify(names)); }, [names]);

  const today = new Date().toISOString().split("T")[0];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const getEntries = useCallback((date: string) => entries.filter((e) => e.date === date), [entries]);

  const herCount = entries.filter((e) => e.author === "her").length;
  const himCount = entries.filter((e) => e.author === "him").length;

  const openDay = (day: number) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
    const dayEntries = getEntries(date);
    setHerText(dayEntries.find((e) => e.author === "her")?.text || "");
    setHimText(dayEntries.find((e) => e.author === "him")?.text || "");
    setBookOpen(false);
  };

  const saveEntry = () => {
    if (!selectedDate || !identity) return;
    const text = identity === "her" ? herText : himText;
    setEntries((prev) => {
      const filtered = prev.filter((e) => !(e.date === selectedDate && e.author === identity));
      if (text.trim()) filtered.push({ date: selectedDate, author: identity, text: text.trim() });
      return filtered;
    });
  };

  const deleteEntry = () => {
    if (!selectedDate || !identity) return;
    setEntries((prev) => prev.filter((e) => !(e.date === selectedDate && e.author === identity)));
    if (identity === "her") setHerText("");
    else setHimText("");
  };

  const confirmIdentity = (id: "her" | "him") => {
    setIdentity(id);
    setShowSetup(false);
  };

  return (
    <section id="our-diary" className="relative z-10 py-24 px-4 max-w-3xl mx-auto">
      <h2 className="font-display text-4xl md:text-5xl text-center text-cream-accent mb-2">
        Our <span className="italic text-rose-accent">Diary</span>
      </h2>
      <p className="font-italic italic text-center text-muted-foreground mb-8 text-sm">365 Days of Love</p>

      {/* Identity setup */}
      {showSetup ? (
        <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 mb-8 text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-3">
            <input className="bg-input rounded px-3 py-1.5 text-sm text-foreground w-32" placeholder="Her name" value={names.her} onChange={(e) => setNames((n: typeof names) => ({ ...n, her: e.target.value }))} />
            <input className="bg-input rounded px-3 py-1.5 text-sm text-foreground w-32" placeholder="His name" value={names.him} onChange={(e) => setNames((n: typeof names) => ({ ...n, him: e.target.value }))} />
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={() => confirmIdentity("her")} className="px-4 py-2 bg-rose text-background rounded text-sm font-body">I am Her 🌸</button>
            <button onClick={() => confirmIdentity("him")} className="px-4 py-2 bg-gold text-background rounded text-sm font-body">I am Him ✦</button>
          </div>
        </div>
      ) : (
        <div className="text-center mb-6">
          <span className="text-muted-foreground text-xs">
            Logged as {identity === "her" ? `${names.her} 🌸` : `${names.him} ✦`}
          </span>
          <button onClick={() => setShowSetup(true)} className="ml-2 text-gold-accent text-xs underline">Change</button>
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); } else setCurrentMonth((m) => m - 1); }} className="text-gold-accent text-sm font-body hover:text-cream-accent">← Prev</button>
        <span className="font-display text-lg text-cream-accent">{MONTHS[currentMonth]} {currentYear}</span>
        <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); } else setCurrentMonth((m) => m + 1); }} className="text-gold-accent text-sm font-body hover:text-cream-accent">Next →</button>
      </div>

      {/* Calendar grid */}
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
          return (
            <button
              key={day}
              onClick={() => openDay(day)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded text-sm font-body transition-all hover:bg-muted/50 ${isToday ? "ring-1 ring-gold" : ""}`}
            >
              <span className="text-foreground">{day}</span>
              <div className="flex gap-0.5 mt-0.5">
                {dayEntries.some((e) => e.author === "her") && <span className="w-1.5 h-1.5 rounded-full bg-rose" />}
                {dayEntries.some((e) => e.author === "him") && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 text-xs font-body text-muted-foreground">
        <span className="text-rose">{names.her}: {herCount}</span>
        <span>Total: {entries.length}</span>
        <span className="text-gold">{names.him}: {himCount}</span>
      </div>

      {/* Diary Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            {!bookOpen ? (
              /* Closed diary */
              <button
                onClick={() => setBookOpen(true)}
                className="relative w-64 h-80 rounded-lg shadow-2xl flex flex-col items-center justify-center gap-4 transition-transform hover:scale-105"
                style={{ background: "linear-gradient(135deg, #2a1a0e 0%, #1a0e05 100%)" }}
              >
                <div className="absolute left-3 top-0 bottom-0 w-2 rounded-full" style={{ background: "#0d0805" }} />
                <div className="text-gold-accent text-4xl">♡</div>
                <span className="text-cream-accent font-display text-sm">{selectedDate}</span>
                <span className="text-gold-accent text-xs font-italic italic animate-blink">tap to open ♡</span>
              </button>
            ) : (
              /* Open book */
              <div className="animate-book-open">
                <div className="flex flex-col md:flex-row w-[90vw] max-w-3xl max-h-[80vh] rounded-lg overflow-hidden shadow-2xl">
                  {/* Close button */}
                  <button onClick={() => setSelectedDate(null)} className="absolute -top-8 right-0 text-gold-accent text-sm font-body hover:text-cream-accent z-20">Close ✕</button>

                  {/* Her page */}
                  <div className="flex-1 bg-parchment diary-page-lines p-6 overflow-y-auto min-h-[300px] md:min-h-[400px]">
                    <p className="font-handwriting text-sm" style={{ color: "#3a2a1a" }}>{selectedDate}</p>
                    <p className="font-handwriting text-rose text-sm mb-3">{names.her}</p>
                    {herText ? (
                      <p className="font-handwriting text-base leading-8" style={{ color: "#3a2a1a" }}>
                        <TypewriterText text={herText} />
                      </p>
                    ) : (
                      <p className="font-italic italic text-sm" style={{ color: "#8a7a6a" }}>No entry yet for this day… come back when your heart is full.</p>
                    )}
                    {identity === "her" && (
                      <div className="mt-4 space-y-2">
                        <textarea
                          className="w-full bg-transparent font-handwriting text-base leading-8 resize-none outline-none border-b border-dashed"
                          style={{ color: "#3a2a1a", borderColor: "#c0b090" }}
                          rows={4}
                          placeholder="Write your heart out…"
                          value={herText}
                          onChange={(e) => setHerText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEntry} className="text-xs font-body px-3 py-1 bg-rose/80 text-background rounded">Save</button>
                          <button onClick={deleteEntry} className="text-xs font-body px-3 py-1 bg-muted text-foreground rounded">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Spine */}
                  <div className="w-full md:w-3 h-3 md:h-auto flex-shrink-0" style={{ background: "#0d0805" }} />

                  {/* His page */}
                  <div className="flex-1 bg-parchment diary-page-lines p-6 overflow-y-auto min-h-[300px] md:min-h-[400px]">
                    <p className="font-handwriting text-sm" style={{ color: "#3a2a1a" }}>{selectedDate}</p>
                    <p className="font-handwriting text-gold text-sm mb-3">{names.him}</p>
                    {himText ? (
                      <p className="font-handwriting text-base leading-8" style={{ color: "#1a1a3a" }}>
                        <TypewriterText text={himText} />
                      </p>
                    ) : (
                      <p className="font-italic italic text-sm" style={{ color: "#8a7a6a" }}>No entry yet for this day… come back when your heart is full.</p>
                    )}
                    {identity === "him" && (
                      <div className="mt-4 space-y-2">
                        <textarea
                          className="w-full bg-transparent font-handwriting text-base leading-8 resize-none outline-none border-b border-dashed"
                          style={{ color: "#1a1a3a", borderColor: "#c0b090" }}
                          rows={4}
                          placeholder="Write your heart out…"
                          value={himText}
                          onChange={(e) => setHimText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEntry} className="text-xs font-body px-3 py-1 bg-gold/80 text-background rounded">Save</button>
                          <button onClick={deleteEntry} className="text-xs font-body px-3 py-1 bg-muted text-foreground rounded">Delete</button>
                        </div>
                      </div>
                    )}
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
