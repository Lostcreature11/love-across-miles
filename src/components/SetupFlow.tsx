import { useState, useEffect } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";

const SetupFlow = () => {
  const { createRoom, joinRoom, loading, roomId, partner, isReady } = useRoom();
  const pendingCode = localStorage.getItem("pending_room_code") || "";
  const [step, setStep] = useState<"choice" | "create" | "join">(pendingCode ? "join" : "choice");
  const [name, setName] = useState("");
  const [pronoun, setPronoun] = useState<"she" | "he" | null>(null);
  const [code, setCode] = useState(pendingCode);
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gold-accent font-italic italic animate-blink">Loading your love story…</p>
      </div>
    );
  }

  // If room is created and waiting for partner, show waiting screen
  if (generatedCode && roomId && !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
          <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-4">Your space is ready</p>
          <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 border border-gold/30">
            <p className="font-display text-4xl text-gold-accent tracking-[0.3em]">{generatedCode}</p>
          </div>
          <p className="text-muted-foreground text-xs font-body">Or share this link:</p>
          <div className="bg-input rounded-lg p-3 text-xs text-foreground break-all font-body">
            {window.location.origin}?code={generatedCode}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
            <p className="text-gold-accent font-italic italic text-sm animate-blink">
              Waiting for your love to join… ♡
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If partner joined, the parent (Index) will show the main app via isReady

  const handleCreate = async () => {
    if (!name.trim() || !pronoun) return;
    setSubmitting(true);
    try {
      const c = await createRoom(name.trim(), pronoun);
      setGeneratedCode(c);
    } catch { setError("Something went wrong"); }
    setSubmitting(false);
  };

  const handleJoin = async () => {
    if (!name.trim() || !pronoun || !code.trim()) return;
    setSubmitting(true);
    setError("");
    const ok = await joinRoom(code.trim(), name.trim(), pronoun);
    if (!ok) setError("Invalid code or room is full");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md text-center">
        <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-4">A love story, told across the distance</p>
        <h1 className="font-display text-5xl md:text-6xl text-cream-accent mb-2">
          You & <span className="italic text-rose-accent">Me</span>
        </h1>
        <p className="font-italic italic text-muted-foreground text-sm mb-12">
          "Distance means so little when someone means so much."
        </p>

        {step === "choice" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("create")}
              className="w-full py-3 bg-gold/20 border border-gold/40 rounded-lg text-gold-accent font-body hover:bg-gold/30 transition-colors"
            >
              Create Our Space ✨🌙
            </button>
            <button
              onClick={() => setStep("join")}
              className="w-full py-3 bg-rose/20 border border-rose/40 rounded-lg text-rose-accent font-body hover:bg-rose/30 transition-colors"
            >
              Join My Love 💋🦋
            </button>
          </div>
        )}

        {step === "create" && (
          <div className="space-y-4">
            <input
              className="w-full bg-input rounded-lg px-4 py-3 text-foreground font-body text-center"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPronoun("she")}
                className={`px-5 py-2 rounded-lg text-sm font-body transition-all ${pronoun === "she" ? "bg-rose text-background" : "bg-input text-foreground hover:bg-rose/30"}`}
              >
                She / Her 🦋💫
              </button>
              <button
                onClick={() => setPronoun("he")}
                className={`px-5 py-2 rounded-lg text-sm font-body transition-all ${pronoun === "he" ? "bg-gold text-background" : "bg-input text-foreground hover:bg-gold/30"}`}
              >
                He / Him 👑✨
              </button>
            </div>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || !pronoun || submitting}
              className="w-full py-3 bg-gold text-background rounded-lg font-body hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create 🦢✨"}
            </button>
            <button onClick={() => setStep("choice")} className="text-muted-foreground text-xs hover:text-foreground">← Back</button>
          </div>
        )}

        {step === "join" && (
          <div className="space-y-4">
            <input
              className="w-full bg-input rounded-lg px-4 py-3 text-foreground font-body text-center tracking-[0.2em] uppercase"
              placeholder="Enter room code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <input
              className="w-full bg-input rounded-lg px-4 py-3 text-foreground font-body text-center"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPronoun("she")}
                className={`px-5 py-2 rounded-lg text-sm font-body transition-all ${pronoun === "she" ? "bg-rose text-background" : "bg-input text-foreground hover:bg-rose/30"}`}
              >
                She / Her 🦋💫
              </button>
              <button
                onClick={() => setPronoun("he")}
                className={`px-5 py-2 rounded-lg text-sm font-body transition-all ${pronoun === "he" ? "bg-gold text-background" : "bg-input text-foreground hover:bg-gold/30"}`}
              >
                He / Him 👑✨
              </button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={!name.trim() || !pronoun || !code.trim() || submitting}
              className="w-full py-3 bg-rose text-background rounded-lg font-body hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Joining…" : "Join 💍🌚"}
            </button>
            <button onClick={() => setStep("choice")} className="text-muted-foreground text-xs hover:text-foreground">← Back</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupFlow;
