import { useState, useEffect } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";

interface Reason {
  id: string;
  text: string;
  member_id: string;
}

const WhyYouSection = () => {
  const { roomId, me, members } = useRoom();
  const { notify } = useNotifications();
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      const { data } = await supabase.from("star_reasons").select("*").eq("room_id", roomId).order("created_at");
      if (data) setReasons(data.map((r) => ({ id: r.id, text: r.text, member_id: r.member_id })));
    };
    load();
  }, [roomId]);

  // Realtime: listen for partner reason changes
  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel('reasons-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'star_reasons', filter: `room_id=eq.${roomId}` }, (payload) => {
        const newReason = payload.new as any;
        if (newReason.member_id !== me.id) {
          const partnerName = members.find(m => m.id === newReason.member_id)?.name || "Your partner";
          notify("⭐ New reason added", `${partnerName} added: "${newReason.text}"`);
          setReasons(prev => [...prev, { id: newReason.id, text: newReason.text, member_id: newReason.member_id }]);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'star_reasons', filter: `room_id=eq.${roomId}` }, (payload) => {
        const old = payload.old as any;
        setReasons(prev => prev.filter(r => r.id !== old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me, members, notify]);

  const getMember = (id: string) => members.find((m) => m.id === id);

  const addReason = async () => {
    if (!input.trim() || !roomId || !me) return;
    const { data } = await supabase.from("star_reasons").insert({ room_id: roomId, member_id: me.id, text: input.trim() }).select().single();
    if (data) {
      setReasons((prev) => [...prev, { id: data.id, text: data.text, member_id: data.member_id }]);
      toast({ title: "💫 Reason added", description: "Your reason has been saved" });
    }
    setInput("");
  };

  const deleteReason = async (id: string) => {
    await supabase.from("star_reasons").delete().eq("id", id);
    setReasons((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "✕ Reason removed", description: "Your reason has been deleted" });
  };

  return (
    <section id="why-you" className="relative z-10 py-24 px-4 max-w-2xl mx-auto">
      <h2 className="font-display text-4xl md:text-5xl text-center text-cream-accent mb-2">
        Why I <span className="italic text-rose-accent">Chose</span> You
      </h2>
      <p className="font-italic italic text-center text-muted-foreground mb-8 text-sm">
        Write reasons freely — anyone can add, only you can delete yours
      </p>

      <div className="space-y-3 mb-6">
        {reasons.map((r) => {
          const member = getMember(r.member_id);
          const isMine = me?.id === r.member_id;
          return (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 backdrop-blur-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" className={`mt-1 flex-shrink-0 ${member?.pronoun === "she" ? "text-rose" : "text-gold"}`} fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="flex-1">
                <span className={`text-xs font-body ${member?.pronoun === "she" ? "text-rose" : "text-gold"}`}>
                  {member?.name || "Unknown"}
                </span>
                <p className="text-foreground font-italic text-sm">{r.text}</p>
              </div>
              {isMine && (
                <button onClick={() => deleteReason(r.id)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-input rounded px-3 py-2 text-sm text-foreground font-italic"
          placeholder="Write a reason…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addReason()}
        />
        <button onClick={addReason} className="px-4 py-2 bg-gold text-background rounded text-sm font-body hover:opacity-90 transition-opacity">
          Add 💫
        </button>
      </div>
    </section>
  );
};

export default WhyYouSection;
