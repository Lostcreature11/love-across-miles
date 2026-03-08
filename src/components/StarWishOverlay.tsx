import { useState, useEffect, useRef, useCallback } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { playTwinkle } from "@/lib/sounds";

interface WishEvent {
  wish: string;
  id: string;
}

const StarWishOverlay = () => {
  const { roomId, me } = useRoom();
  const [queue, setQueue] = useState<WishEvent[]>([]);
  const [active, setActive] = useState<WishEvent | null>(null);
  const [starPhase, setStarPhase] = useState<"idle" | "shooting" | "text" | "fading">("idle");
  const processingRef = useRef(false);
  const meRef = useRef(me);
  meRef.current = me;

  // Realtime listener for wishes
  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel(`star-wishes-${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "star_wishes",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const wish = payload.new as any;
        if (wish.sender_id !== meRef.current?.id) {
          setQueue(prev => [...prev, { wish: wish.wish, id: wish.id }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me]);

  // Process queue
  const processNext = useCallback(async () => {
    if (processingRef.current || queue.length === 0) return;
    processingRef.current = true;
    const next = queue[0];
    setActive(next);
    setQueue(prev => prev.slice(1));

    // Shooting star phase
    playTwinkle();
    setStarPhase("shooting");
    await new Promise(r => setTimeout(r, 1500));
    
    // Text phase
    setStarPhase("text");
    await new Promise(r => setTimeout(r, 3000));
    
    // Fading phase
    setStarPhase("fading");
    await new Promise(r => setTimeout(r, 800));

    setStarPhase("idle");
    setActive(null);
    processingRef.current = false;
  }, [queue]);

  useEffect(() => {
    if (queue.length > 0 && !processingRef.current) {
      processNext();
    }
  }, [queue, processNext]);

  if (!active || starPhase === "idle") return null;

  // Random start position
  const startX = 10 + Math.random() * 30;

  return (
    <div className="fixed inset-0 z-[95] pointer-events-none overflow-hidden">
      {/* Shooting star */}
      {(starPhase === "shooting" || starPhase === "text") && (
        <div
          className="absolute"
          style={{
            left: `${startX}%`,
            top: "10%",
            width: "120px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, hsl(var(--gold)), hsl(var(--cream)))",
            borderRadius: "2px",
            boxShadow: "0 0 15px 5px hsl(var(--gold) / 0.4), 0 0 40px 10px hsl(var(--gold) / 0.2)",
            animation: starPhase === "shooting" ? "shootingStar 1.5s ease-out forwards" : "none",
            opacity: starPhase === "text" ? 0 : undefined,
            transform: starPhase === "text" ? "translateX(300px) translateY(150px)" : undefined,
          }}
        />
      )}

      {/* Wish text */}
      {(starPhase === "text" || starPhase === "fading") && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: starPhase === "fading" ? 0 : 1,
            transition: "opacity 0.8s ease-out",
          }}
        >
          <p
            className="font-italic italic text-cream-accent text-lg md:text-xl max-w-md text-center px-6"
            style={{
              textShadow: "0 0 20px hsl(var(--gold) / 0.4)",
              animation: starPhase === "text" ? "wishFadeIn 0.8s ease-out forwards" : undefined,
            }}
          >
            "{active.wish}"
          </p>
        </div>
      )}
    </div>
  );
};

export default StarWishOverlay;
