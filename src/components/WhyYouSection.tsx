import { useState, useEffect } from "react";

interface Reason {
  id: string;
  text: string;
  author: "her" | "him";
}

const STORAGE_KEY = "whyyou_reasons";
const IDENTITY_KEY = "whyyou_identity";
const NAMES_KEY = "whyyou_names";

const WhyYouSection = () => {
  const [reasons, setReasons] = useState<Reason[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [identity, setIdentity] = useState<"her" | "him" | null>(() =>
    (localStorage.getItem(IDENTITY_KEY) as "her" | "him") || null
  );
  const [names, setNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NAMES_KEY) || '{"her":"Her","him":"Him"}'); } catch { return { her: "Her", him: "Him" }; }
  });
  const [input, setInput] = useState("");

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(reasons)); }, [reasons]);
  useEffect(() => { if (identity) localStorage.setItem(IDENTITY_KEY, identity); }, [identity]);
  useEffect(() => { localStorage.setItem(NAMES_KEY, JSON.stringify(names)); }, [names]);

  const addReason = () => {
    if (!input.trim() || !identity) return;
    setReasons((prev) => [...prev, { id: Date.now().toString(), text: input.trim(), author: identity }]);
    setInput("");
  };

  const deleteReason = (id: string) => setReasons((prev) => prev.filter((r) => r.id !== id));

  return (
    <section id="why-you" className="relative z-10 py-24 px-4 max-w-2xl mx-auto">
      <h2 className="font-display text-4xl md:text-5xl text-center text-cream-accent mb-2">
        Why I <span className="italic text-rose-accent">Chose</span> You
      </h2>
      <p className="font-italic italic text-center text-muted-foreground mb-8 text-sm">
        Both of you can write reasons freely — anyone can add, only you can edit yours
      </p>

      {/* Identity bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8 p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
        <input
          className="bg-input rounded px-3 py-1.5 text-sm text-foreground w-28 font-body"
          placeholder="Her name"
          value={names.her}
          onChange={(e) => setNames((n: typeof names) => ({ ...n, her: e.target.value }))}
        />
        <input
          className="bg-input rounded px-3 py-1.5 text-sm text-foreground w-28 font-body"
          placeholder="His name"
          value={names.him}
          onChange={(e) => setNames((n: typeof names) => ({ ...n, him: e.target.value }))}
        />
        <button
          onClick={() => setIdentity("her")}
          className={`px-3 py-1.5 rounded text-sm font-body transition-all ${identity === "her" ? "bg-rose text-background" : "bg-input text-foreground hover:bg-rose/30"}`}
        >
          I am Her 🌸
        </button>
        <button
          onClick={() => setIdentity("him")}
          className={`px-3 py-1.5 rounded text-sm font-body transition-all ${identity === "him" ? "bg-gold text-background" : "bg-input text-foreground hover:bg-gold/30"}`}
        >
          I am Him ✦
        </button>
      </div>

      {/* Reasons list */}
      <div className="space-y-3 mb-6">
        {reasons.map((r) => (
          <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 backdrop-blur-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" className={`mt-1 flex-shrink-0 ${r.author === "her" ? "text-rose" : "text-gold"}`} fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div className="flex-1">
              <span className={`text-xs font-body ${r.author === "her" ? "text-rose" : "text-gold"}`}>
                {r.author === "her" ? names.her : names.him}
              </span>
              <p className="text-foreground font-italic text-sm">{r.text}</p>
            </div>
            {identity === r.author && (
              <button onClick={() => deleteReason(r.id)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Add input */}
      {identity && (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-input rounded px-3 py-2 text-sm text-foreground font-italic"
            placeholder="Write a reason…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addReason()}
          />
          <button onClick={addReason} className="px-4 py-2 bg-gold text-background rounded text-sm font-body hover:opacity-90 transition-opacity">
            Add ✦
          </button>
        </div>
      )}
    </section>
  );
};

export default WhyYouSection;
