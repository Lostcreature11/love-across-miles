import { useState, useEffect, useRef, useCallback } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface HeartbeatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  pattern: number[];
  created_at: string;
}

const MAX_TAPS = 10;
const MAX_DURATION = 8000;

const HeartbeatSection = () => {
  const { roomId, me, partner } = useRoom();
  const [taps, setTaps] = useState<number[]>([]);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [receiveData, setReceiveData] = useState<{ name: string; pattern: number[] } | null>(null);
  const [playingBack, setPlayingBack] = useState(false);
  const [pulseAnim, setPulseAnim] = useState(false);
  const [activeBar, setActiveBar] = useState(-1);
  const startTimeRef = useRef(0);
  const lastTapRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const meRef = useRef(me);
  meRef.current = me;

  // Realtime listener
  useEffect(() => {
    if (!roomId || !me) return;
    const channel = supabase
      .channel(`heartbeat-${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "heartbeat_messages",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const hb = payload.new as HeartbeatMessage;
        if (hb.sender_id !== meRef.current?.id) {
          const senderName = partner?.name || "Your love";
          setReceiveData({ name: senderName, pattern: hb.pattern });
          setShowReceive(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, me, partner]);

  const startRecording = () => {
    setTaps([]);
    setRecording(true);
    startTimeRef.current = Date.now();
    lastTapRef.current = 0;
    // Auto-stop after MAX_DURATION
    timerRef.current = window.setTimeout(() => {
      setRecording(false);
    }, MAX_DURATION);
  };

  const handleTap = () => {
    if (!recording) return;
    const now = Date.now();
    if (lastTapRef.current > 0) {
      const interval = now - lastTapRef.current;
      setTaps(prev => [...prev, interval]);
    }
    lastTapRef.current = now;
    setPulseAnim(true);
    setTimeout(() => setPulseAnim(false), 200);

    if (taps.length + 1 >= MAX_TAPS - 1) {
      setRecording(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!roomId || !me || taps.length < 2) return;
    setSending(true);
    try {
      const { error } = await supabase.from("heartbeat_messages").insert({
        room_id: roomId,
        sender_id: me.id,
        pattern: taps,
      });
      if (error) throw error;
      toast({ title: "💓 Heartbeat sent", description: "Your heartbeat is on its way… ♡" });
      setTaps([]);
      setRecording(false);
    } catch {
      toast({ title: "Error", description: "Failed to send heartbeat", variant: "destructive" });
    }
    setSending(false);
  };

  const playback = useCallback(async (pattern: number[]) => {
    setPlayingBack(true);
    setActiveBar(-1);
    for (let i = 0; i < pattern.length; i++) {
      await new Promise(r => setTimeout(r, pattern[i]));
      setPulseAnim(true);
      setActiveBar(i);
      // Vibration API
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      await new Promise(r => setTimeout(r, 200));
      setPulseAnim(false);
    }
    setPlayingBack(false);
    setActiveBar(-1);
  }, []);

  // Auto-play on receive
  useEffect(() => {
    if (showReceive && receiveData) {
      playback(receiveData.pattern);
    }
  }, [showReceive, receiveData, playback]);

  const barsToShow = showReceive ? receiveData?.pattern || [] : taps;

  return (
    <section className="min-h-screen px-4 py-8 max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10">
      {!showReceive ? (
        <>
          <p className="text-gold-accent uppercase tracking-[0.3em] text-xs font-body mb-2">Heartbeat</p>
          <h2 className="font-display text-4xl md:text-5xl text-cream-accent mb-2 text-center">
            Send Your <span className="italic text-rose-accent">Heartbeat</span>
          </h2>
          <p className="font-italic italic text-muted-foreground text-sm mb-10 text-center">
            Tap the heart in your rhythm ♡
          </p>

          {/* Heart */}
          <button
            onClick={recording ? handleTap : startRecording}
            className="relative mb-8 focus:outline-none"
            style={{ width: "200px", height: "200px" }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--rose) / 0.15) 0%, transparent 70%)",
              }}
            />
            <div
              className="w-full h-full flex items-center justify-center transition-transform"
              style={{
                transform: pulseAnim ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.15s ease-out",
              }}
            >
              <span className="text-8xl" style={{ filter: "drop-shadow(0 0 30px hsl(var(--rose) / 0.5))" }}>
                ❤️
              </span>
            </div>
          </button>

          {!recording && taps.length === 0 && (
            <p className="text-muted-foreground text-xs font-body animate-blink">Tap the heart to start ♡</p>
          )}
          {recording && (
            <p className="text-rose-accent text-xs font-body animate-blink">Recording… tap in rhythm ♡</p>
          )}

          {/* Waveform bars */}
          {barsToShow.length > 0 && (
            <div className="flex items-end justify-center gap-1.5 mt-6 h-16">
              {barsToShow.map((interval, i) => {
                const maxInterval = Math.max(...barsToShow);
                const height = Math.max(8, (interval / maxInterval) * 60);
                return (
                  <div
                    key={i}
                    className="w-2 rounded-full transition-all"
                    style={{
                      height: `${height}px`,
                      background: "hsl(var(--rose))",
                      opacity: 0.6 + (i / barsToShow.length) * 0.4,
                      animation: `charmBounce 0.3s ease-out ${i * 0.05}s both`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Send button */}
          {taps.length >= 2 && !recording && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="mt-8 px-8 py-3 rounded-full font-display text-sm tracking-widest uppercase transition-all disabled:opacity-50"
              style={{
                background: "hsl(var(--rose) / 0.2)",
                border: "1px solid hsl(var(--rose) / 0.4)",
                color: "hsl(var(--rose))",
              }}
            >
              {sending ? "Sending…" : "Send my heartbeat 💓"}
            </button>
          )}

          {taps.length > 0 && !recording && (
            <button
              onClick={startRecording}
              className="mt-3 text-muted-foreground text-xs font-body hover:text-foreground"
            >
              Try again ↻
            </button>
          )}
        </>
      ) : (
        /* Receiving overlay */
        <div className="text-center animate-fade-up">
          <div
            className="mb-8 flex items-center justify-center"
            style={{
              width: "200px",
              height: "200px",
              margin: "0 auto",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, hsl(var(--rose) / 0.1) 0%, transparent 70%)",
              }}
            />
            <span
              className="text-8xl relative z-10 transition-transform"
              style={{
                transform: pulseAnim ? "scale(1.25)" : "scale(1)",
                transition: "transform 0.15s ease-out",
                filter: "drop-shadow(0 0 30px hsl(var(--rose) / 0.5))",
              }}
            >
              ❤️
            </span>
          </div>

          <p className="font-display text-xl text-cream-accent mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>
            {receiveData?.name}
          </p>
          <p className="font-italic italic text-rose-accent text-sm mb-6">
            is sending you their heartbeat ♡
          </p>

          {/* Waveform */}
          <div className="flex items-end justify-center gap-1.5 h-16 mb-8">
            {(receiveData?.pattern || []).map((interval, i) => {
              const maxInterval = Math.max(...(receiveData?.pattern || [1]));
              const height = Math.max(8, (interval / maxInterval) * 60);
              return (
                <div
                  key={i}
                  className="w-2 rounded-full transition-all"
                  style={{
                    height: `${height}px`,
                    background: activeBar >= i ? "hsl(var(--rose))" : "hsl(var(--rose) / 0.3)",
                    transition: "background 0.2s",
                  }}
                />
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => receiveData && playback(receiveData.pattern)}
              disabled={playingBack}
              className="text-gold-accent text-xs font-body hover:text-cream-accent disabled:opacity-50"
            >
              Feel it again 🔁
            </button>
            <button
              onClick={() => { setShowReceive(false); setReceiveData(null); }}
              className="text-rose-accent text-xs font-body hover:text-cream-accent"
            >
              I felt it ♡
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeartbeatSection;
