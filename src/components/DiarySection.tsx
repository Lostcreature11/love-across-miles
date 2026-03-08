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

type DiaryMode = "calendar" | "write" | "read";

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
  const [mode, setMode] = useState<DiaryMode>("calendar");

  useEffect(() => { localStorage.setItem(DIARY_KEY, JSON.stringify(entries)); }, [entries]);
  useEffect(() => { if (identity) localStorage.setItem(DIARY_IDENTITY, identity); }, [identity]);
  useEffect(() => { localStorage.setItem(DIARY_NAMES, JSON.stringify(names)); }, [names]);

  const today = new Date().toISOString().split("T")[0];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const getEntries = useCallback((date: string) => entries.filter((e) => e.date === date), [entries]);

  const herCount = entries.filter((e) => e.author === "her").length;
  const himCount = entries.filter((e) => e.author === "him").length;

  const openDay = (day: number, targetMode: DiaryMode) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
    const dayEntries = getEntries(date);
    setHerText(dayEntries.find((e) => e.author === "her")?.text || "");
    setHimText(dayEntries.find((e) => e.author === "him")?.text || "");
    setBookOpen(false);
    setMode(targetMode);
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

  const backToCalendar = () => {
    setMode("calendar");
    setSelectedDate(null);
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

      {/* MODE: Calendar */}
      {mode === "calendar" && (
        <>
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
              const hasEntries = dayEntries.length > 0;
              return (
                <div
                  key={day}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded text-sm font-body ${isToday ? "ring-1 ring-gold" : ""}`}
                >
                  <span className="text-foreground text-xs mb-1">{day}</span>
                  <div className="flex gap-0.5 mb-1">
                    {dayEntries.some((e) => e.author === "her") && <span className="w-1.5 h-1.5 rounded-full bg-rose" />}
                    {dayEntries.some((e) => e.author === "him") && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  </div>
                  <div className="flex gap-1">
                    {identity && (
                      <button
                        onClick={() => openDay(day, "write")}
                        className="text-[8px] text-gold-accent hover:text-cream-accent transition-colors"
                        title="Write"
                      >
                        ✎
                      </button>
                    )}
                    {hasEntries && (
                      <button
                        onClick={() => openDay(day, "read")}
                        className="text-[8px] text-rose-accent hover:text-cream-accent transition-colors"
                        title="Read"
                      >
                        📖
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-xs font-body text-muted-foreground">
            <span className="text-rose">{names.her}: {herCount}</span>
            <span>Total: {entries.length}</span>
            <span className="text-gold">{names.him}: {himCount}</span>
          </div>
        </>
      )}

      {/* MODE: Write */}
      {mode === "write" && selectedDate && identity && (
        <div className="animate-fade-up">
          <button onClick={backToCalendar} className="text-gold-accent text-sm font-body mb-6 hover:text-cream-accent">← Back to Calendar</button>
          
          <div className="bg-parchment diary-page-lines rounded-lg p-8 max-w-lg mx-auto min-h-[400px]">
            <p className="font-handwriting text-sm mb-1" style={{ color: "#3a2a1a" }}>{selectedDate}</p>
            <p className={`font-handwriting text-sm mb-4 ${identity === "her" ? "text-rose" : "text-gold"}`}>
              {identity === "her" ? names.her : names.him}'s entry
            </p>
            
            <textarea
              className="w-full bg-transparent font-handwriting text-lg leading-[32px] resize-none outline-none min-h-[250px]"
              style={{ color: identity === "her" ? "#3a2a1a" : "#1a1a3a" }}
              placeholder="Write your heart out…"
              value={identity === "her" ? herText : himText}
              onChange={(e) => identity === "her" ? setHerText(e.target.value) : setHimText(e.target.value)}
            />
            
            <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px dashed #c0b090" }}>
              <button onClick={() => { saveEntry(); backToCalendar(); }} className={`text-sm font-body px-4 py-2 rounded transition-opacity hover:opacity-90 ${identity === "her" ? "bg-rose/80 text-background" : "bg-gold/80 text-background"}`}>
                Save ✦
              </button>
              <button onClick={() => { deleteEntry(); backToCalendar(); }} className="text-sm font-body px-4 py-2 bg-muted text-foreground rounded hover:opacity-80">
                Delete
              </button>
              <button onClick={backToCalendar} className="text-sm font-body px-4 py-2 text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE: Read — diary book modal */}
      {mode === "read" && selectedDate && (
        <div className="animate-fade-up">
          <button onClick={backToCalendar} className="text-gold-accent text-sm font-body mb-6 hover:text-cream-accent">← Back to Calendar</button>
          
          <div className="flex justify-center">
            {!bookOpen ? (
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
              <div className="animate-book-open w-full">
                <div className="flex flex-col md:flex-row w-full max-w-3xl mx-auto max-h-[70vh] rounded-lg overflow-hidden shadow-2xl">
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
