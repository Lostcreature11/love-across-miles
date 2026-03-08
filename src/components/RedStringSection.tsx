import { useState, useEffect, useRef } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Charm {
  id: string;
  room_id: string;
  added_by: string;
  label: string;
  emoji: string;
  created_at: string;
}

const RedStringSection = () => {
  const { roomId, me, partner } = useRoom();
  const [charms, setCharms] = useState<Charm[]>([]);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [hoveredCharm, setHoveredCharm] = useState<string | null>(null);
  const meRef = useRef(me);
  meRef.current = me;

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("red_string_charms")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        setCharms((data as Charm[]) || []);
      } catch {
        toast({ title: "Error", description: "Failed to load charms", variant: "destructive" });
      }
      setLoading(false);
    };
    load();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel(`red-string-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "red_string_charms", filter: `room_id=eq.${roomId}` }, (payload) => {
        const charm = payload.new as Charm;
        setCharms(prev => {
          if (prev.some(c => c.id === charm.id)) return prev;
          return [...prev, charm];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "red_string_charms", filter: `room_id=eq.${roomId}` }, (payload) => {
        const old = payload.old as any;
        setCharms(prev => prev.filter(c => c.id !== old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me]);

  const handleAdd = async () => {
    if (!roomId || !me || !label.trim()) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("red_string_charms").insert({
        room_id: roomId,
        added_by: me.id,
        label: label.trim(),
        emoji: emoji || "✨",
      });
      if (error) throw error;
      toast({ title: "✨ Charm added", description: "A new memory on your string of fate" });
      setLabel("");
      setEmoji("✨");
    } catch {
      toast({ title: "Error", description: "Failed to add charm", variant: "destructive" });
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <section className="relative z-10 py-24 px-4 max-w-2xl mx-auto text-center">
        <p className="text-gold-accent font-italic italic animate-blink">Loading… ♡</p>
      </section>
    );
  }

  const stringPath = "M 40 100 Q 200 60, 360 100 Q 520 140, 680 100 Q 840 60, 960 100";

  return (
    <section className="min-h-screen px-4 py-8 max-w-2xl mx-auto flex flex-col items-center relative z-10">
      <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-2">The Red Thread</p>
      <h2 className="font-display text-4xl md:text-5xl text-cream-accent mb-2 text-center">
        Red <span className="italic text-rose-accent">String</span> of Fate
      </h2>
      <p className="font-italic italic text-muted-foreground text-sm mb-10 text-center">
        An invisible thread connects those who are destined to meet ♡
      </p>

      {/* SVG String with charms */}
      <div className="w-full overflow-x-auto mb-10">
        <svg viewBox="0 0 1000 200" className="w-full min-w-[600px]" style={{ height: "200px" }}>
          {/* Glow filter */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* The red string */}
          <path
            d={stringPath}
            fill="none"
            stroke="#8b1a1a"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
            style={{ animation: "stringWave 4s ease-in-out infinite" }}
          />

          {/* Left name tag */}
          <g>
            <rect x="0" y="80" width="80" height="36" rx="18" fill="hsl(350, 42%, 68%)" fillOpacity="0.25" stroke="hsl(350, 42%, 68%)" strokeWidth="1" strokeOpacity="0.5" />
            <text x="40" y="103" textAnchor="middle" fill="hsl(30, 50%, 93%)" fontSize="12" fontFamily="'Playfair Display', serif">
              {me?.name || "You"}
            </text>
          </g>

          {/* Right name tag */}
          <g>
            <rect x="920" y="80" width="80" height="36" rx="18" fill="hsl(39, 42%, 61%)" fillOpacity="0.25" stroke="hsl(39, 42%, 61%)" strokeWidth="1" strokeOpacity="0.5" />
            <text x="960" y="103" textAnchor="middle" fill="hsl(30, 50%, 93%)" fontSize="12" fontFamily="'Playfair Display', serif">
              {partner?.name || "Them"}
            </text>
          </g>

          {/* Charms along the string */}
          {charms.map((charm, i) => {
            const total = charms.length;
            const t = total === 1 ? 0.5 : (i + 1) / (total + 1);
            // Approximate position along the cubic bezier path
            const x = 40 + t * 920;
            const y = 100 + Math.sin(t * Math.PI * 3) * 20;
            const addedByName = charm.added_by === me?.id ? me?.name : partner?.name || "?";

            return (
              <g
                key={charm.id}
                onMouseEnter={() => setHoveredCharm(charm.id)}
                onMouseLeave={() => setHoveredCharm(null)}
                onClick={() => setHoveredCharm(hoveredCharm === charm.id ? null : charm.id)}
                className="cursor-pointer"
                style={{ animation: `charmBounce 0.5s ease-out ${i * 0.08}s both` }}
              >
                <circle cx={x} cy={y} r="18" fill="hsl(39, 42%, 61%)" fillOpacity="0.2" stroke="hsl(39, 42%, 61%)" strokeWidth="1" strokeOpacity="0.6" />
                <text x={x} y={y + 5} textAnchor="middle" fontSize="16">{charm.emoji}</text>

                {/* Tooltip */}
                {hoveredCharm === charm.id && (
                  <g>
                    <rect x={x - 70} y={y - 55} width="140" height="40" rx="8" fill="hsl(240, 25%, 10%)" stroke="hsl(39, 42%, 61%)" strokeWidth="0.5" strokeOpacity="0.5" />
                    <text x={x} y={y - 37} textAnchor="middle" fill="hsl(30, 50%, 93%)" fontSize="10" fontFamily="'Cormorant Garamond', serif">
                      {charm.label.length > 22 ? charm.label.slice(0, 22) + "…" : charm.label}
                    </text>
                    <text x={x} y={y - 23} textAnchor="middle" fill="hsl(39, 30%, 65%)" fontSize="8" fontFamily="'DM Sans', sans-serif">
                      — {addedByName}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Add charm form */}
      <div className="w-full max-w-sm space-y-3">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-body">Add a charm</p>
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 bg-input border border-border rounded-lg px-2 py-2.5 text-center text-lg focus:outline-none focus:border-gold/50"
            maxLength={4}
            placeholder="✨"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-gold/50"
            placeholder="A memory, a milestone…"
            maxLength={60}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !label.trim()}
          className="w-full py-2.5 rounded-lg font-body text-sm uppercase tracking-wider transition-all disabled:opacity-50"
          style={{
            background: "hsl(var(--rose) / 0.2)",
            border: "1px solid hsl(var(--rose) / 0.4)",
            color: "hsl(var(--rose))",
          }}
        >
          {adding ? "Adding…" : "Add Charm ✦"}
        </button>
      </div>

      {/* Charm count */}
      {charms.length > 0 && (
        <p className="mt-6 text-[10px] text-muted-foreground font-italic italic">
          {charms.length} {charms.length === 1 ? "memory" : "memories"} on your string of fate ♡
        </p>
      )}
    </section>
  );
};

export default RedStringSection;
