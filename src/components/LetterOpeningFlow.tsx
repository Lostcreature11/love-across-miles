import { useState, useEffect } from "react";

interface LoveLetter {
  id: string;
  sender_id: string;
  to_name: string;
  from_name: string;
  message: string;
  created_at: string;
}

interface Props {
  letter: LoveLetter;
  onClose: () => void;
}

const LetterOpeningFlow = ({ letter, onClose }: Props) => {
  const [stage, setStage] = useState(1);
  const [hearts, setHearts] = useState<{ id: number; x: number; emoji: string; delay: number }[]>([]);

  // Stage 1 auto-advance after 2s
  useEffect(() => {
    if (stage === 1) {
      const t = setTimeout(() => setStage(2), 2000);
      return () => clearTimeout(t);
    }
  }, [stage]);

  // Stage 3 auto-advance after 1.8s
  useEffect(() => {
    if (stage === 3) {
      const t = setTimeout(() => setStage(4), 1800);
      return () => clearTimeout(t);
    }
  }, [stage]);

  // Stage 4 — burst hearts
  useEffect(() => {
    if (stage === 4) {
      const emojis = ["💕", "🌸", "💗", "🌹", "✨", "💖", "🌺"];
      setHearts(
        Array.from({ length: 14 }, (_, i) => ({
          id: i,
          x: Math.random() * 90 + 5,
          emoji: emojis[i % emojis.length],
          delay: Math.random() * 0.8,
        }))
      );
    }
  }, [stage]);

  const dateStr = new Date(letter.created_at).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(20,10,10,0.85)", backdropFilter: "blur(8px)" }}>
      {/* Stage 1 — Mailbox */}
      {stage === 1 && (
        <div className="flex flex-col items-center gap-6 animate-fade-up cursor-pointer" onClick={() => setStage(2)}>
          {/* CSS Mailbox */}
          <div className="relative w-40 h-48">
            {/* Post */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-24 rounded-sm" style={{ background: "#d4a574" }} />
            {/* Body */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-36 h-24 rounded-lg" style={{ background: "#e8a0a0", border: "2px solid #d4a574" }}>
              {/* Gold trim */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1" style={{ background: "#d4a574" }} />
              {/* Slot */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full" style={{ background: "#3d2020" }} />
            </div>
            {/* Lid */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-10 rounded-t-[50%]" style={{ background: "#d4878f", border: "2px solid #d4a574", borderBottom: "none" }} />
            {/* Flag */}
            <div className="absolute top-2 -right-2 w-3 h-8">
              <div className="w-1 h-8 rounded-full mx-auto" style={{ background: "#d4a574" }} />
              <div className="absolute top-0 right-0 w-4 h-3 rounded-sm" style={{ background: "#c04040" }} />
            </div>
            {/* Envelope peeking */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-8 rounded-sm" style={{
              background: "#fffdf8",
              border: "1px solid #d4a574",
              animation: "envelopeBounce 1.2s ease-in-out infinite",
            }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0" style={{
                borderLeft: "28px solid transparent",
                borderRight: "28px solid transparent",
                borderTop: "14px solid #e8c0c0",
              }} />
            </div>
            {/* Roses */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 text-lg">
              🌹🌸🌹
            </div>
          </div>
          <p className="text-xl" style={{ fontFamily: "'Dancing Script', cursive", color: "#fde8e8" }}>
            You have a letter from {letter.from_name} ✦
          </p>
          <p className="text-xs text-muted-foreground/50">Tap to continue</p>
        </div>
      )}

      {/* Stage 2 — Envelope pickup */}
      {stage === 2 && (
        <div className="flex flex-col items-center gap-8" style={{ animation: "envelopeFlyUp 0.8s cubic-bezier(.34,1.56,.64,1) forwards" }}>
          {/* Envelope */}
          <div className="relative w-72 h-48 rounded-lg shadow-2xl" style={{ background: "#f5d5d5", border: "2px solid #d4a574" }}>
            {/* Flap */}
            <div className="absolute -top-[1px] left-0 w-full overflow-hidden" style={{ height: "60px" }}>
              <div className="w-0 h-0 mx-auto" style={{
                borderLeft: "144px solid transparent",
                borderRight: "144px solid transparent",
                borderTop: "60px solid #e8b8b8",
              }} />
            </div>
            {/* Bow */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl z-10">🎀</div>
            {/* Stamps */}
            <div className="absolute top-2 right-3 flex gap-2 text-xl">
              <span className="border border-[#c04040]/30 rounded px-1 text-sm" style={{ background: "#fffdf8" }}>💕</span>
              <span className="border border-[#c04040]/30 rounded px-1 text-sm" style={{ background: "#fffdf8" }}>🔑</span>
            </div>
            {/* Wax seal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#c04040" }}>
              <span className="text-white text-lg">♡</span>
            </div>
            {/* Heart watermarks */}
            <span className="absolute bottom-3 left-4 text-[#e8c0c0]/40 text-2xl">♡</span>
            <span className="absolute top-14 left-8 text-[#e8c0c0]/30 text-lg">♡</span>
            <span className="absolute bottom-4 right-6 text-[#e8c0c0]/30 text-xl">♡</span>
          </div>
          <button
            onClick={() => setStage(3)}
            className="px-8 py-3 rounded-full text-white shadow-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #c97070, #c04040)", fontFamily: "'Dancing Script', cursive", fontSize: "1.3rem" }}
          >
            Open your letter 💌
          </button>
        </div>
      )}

      {/* Stage 3 — Opening animation */}
      {stage === 3 && (
        <div className="relative flex flex-col items-center">
          {/* Envelope body */}
          <div className="relative w-72 h-48 rounded-lg shadow-2xl" style={{ background: "#f5d5d5", border: "2px solid #d4a574" }}>
            {/* Flap opening */}
            <div className="absolute -top-[1px] left-0 w-full origin-top" style={{
              height: "60px",
              animation: "flapOpen 1.2s ease-out forwards",
              transformStyle: "preserve-3d",
            }}>
              <div className="w-0 h-0 mx-auto" style={{
                borderLeft: "144px solid transparent",
                borderRight: "144px solid transparent",
                borderTop: "60px solid #e8b8b8",
              }} />
            </div>
            {/* Wax seal popping */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10" style={{
              background: "#c04040",
              animation: "sealPop 0.6s cubic-bezier(.34,1.56,.64,1) 0.4s both",
            }}>
              <span className="text-white text-lg">♡</span>
            </div>
          </div>
          {/* Letter rising */}
          <div className="absolute -top-4 w-64 h-40 rounded shadow-xl" style={{
            background: "#fffdf8",
            animation: "letterRise 1s ease-out 0.6s both",
          }} />
        </div>
      )}

      {/* Stage 4 — The letter */}
      {stage === 4 && (
        <div className="relative w-full max-w-lg mx-4 animate-fade-up">
          <button
            onClick={onClose}
            className="absolute -top-8 right-0 text-sm z-10 hover:opacity-80 transition-opacity"
            style={{ color: "#fde8e8" }}
          >
            ✕ Close
          </button>

          {/* Stamp-edge letter */}
          <div className="relative p-8 sm:p-10 rounded" style={{
            background: "#fffdf8",
            maskImage: `
              radial-gradient(circle 6px at 6px 0, transparent 5.5px, #000 6px),
              radial-gradient(circle 6px at 6px 0, transparent 5.5px, #000 6px),
              radial-gradient(circle 6px at 0 6px, transparent 5.5px, #000 6px),
              radial-gradient(circle 6px at 0 6px, transparent 5.5px, #000 6px)
            `,
            maskSize: "12px 100%, 12px 100%, 100% 12px, 100% 12px",
            maskPosition: "left top, right top, top left, bottom left",
            maskRepeat: "repeat-y, repeat-y, repeat-x, repeat-x",
            maskComposite: "intersect",
            WebkitMaskImage: `
              radial-gradient(circle 6px at 6px 0, transparent 5.5px, #000 6px),
              radial-gradient(circle 6px at 6px 0, transparent 5.5px, #000 6px),
              radial-gradient(circle 6px at 0 6px, transparent 5.5px, #000 6px),
              radial-gradient(circle 6px at 0 6px, transparent 5.5px, #000 6px)
            `,
            WebkitMaskSize: "12px 100%, 12px 100%, 100% 12px, 100% 12px",
            WebkitMaskPosition: "left top, right top, top left, bottom left",
            WebkitMaskRepeat: "repeat-y, repeat-y, repeat-x, repeat-x",
            WebkitMaskComposite: "source-in",
          }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "#3d2020" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#c97070" }}>To: </span>{letter.to_name}
                </p>
                <p className="text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "#3d2020" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#c97070" }}>From: </span>{letter.from_name}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-14 rounded border-2 flex items-center justify-center" style={{ borderColor: "#c04040", background: "#fffdf8" }}>
                  <span className="text-xl">💕</span>
                </div>
                <div className="w-12 h-14 rounded border-2 flex items-center justify-center" style={{ borderColor: "#c04040", background: "#fffdf8" }}>
                  <span className="text-xl">🔑</span>
                </div>
              </div>
            </div>

            {/* Gold divider */}
            <div className="h-[2px] w-full mb-6" style={{ background: "linear-gradient(90deg, transparent, #d4a574, transparent)" }} />

            {/* Salutation */}
            <p className="text-2xl mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#c97070" }}>
              My Dearest {letter.to_name},
            </p>

            {/* Body */}
            <div className="mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, color: "#3d2020", lineHeight: 2, fontSize: "1.05rem" }}>
              {letter.message.split("\n").map((paragraph, i) => (
                <p key={i} className="mb-2">{paragraph}</p>
              ))}
            </div>

            {/* Signature */}
            <div className="text-right mb-6">
              <p className="text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#3d2020" }}>With all my love,</p>
              <p className="text-2xl mt-1" style={{ fontFamily: "'Dancing Script', cursive", color: "#c97070" }}>
                {letter.from_name} ♡
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs" style={{ color: "#c97070" }}>
              <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.1rem" }}>{dateStr}</span>
              <span>🌸 🌹 🌺</span>
              <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center rotate-12" style={{ borderColor: "#c04040" }}>
                <span className="text-[8px] text-center leading-tight" style={{ color: "#c04040" }}>LOVE<br />POST</span>
              </div>
            </div>
          </div>

          {/* Floating hearts */}
          {hearts.map((h) => (
            <span
              key={h.id}
              className="absolute text-2xl pointer-events-none"
              style={{
                left: `${h.x}%`,
                bottom: 0,
                animation: `floatUp 3s ease-out ${h.delay}s both`,
              }}
            >
              {h.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes envelopeBounce {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -6px); }
        }
        @keyframes envelopeFlyUp {
          0% { opacity: 0; transform: translateY(100vh); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes flapOpen {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-170deg); }
        }
        @keyframes sealPop {
          0% { transform: translate(-50%, -50%) scale(0); }
          100% { transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes letterRise {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(-160px); opacity: 1; }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-400px) scale(0.5); }
        }
      `}</style>
    </div>
  );
};

export default LetterOpeningFlow;
