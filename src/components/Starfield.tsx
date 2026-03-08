import { useEffect, useRef } from "react";

const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.005 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }));

    interface ShootingStar {
      x: number; y: number; len: number; speed: number; angle: number; life: number; maxLife: number;
    }
    const shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        len: Math.random() * 80 + 40,
        speed: Math.random() * 4 + 3,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    };

    let spawnTimer = 0;
    let frame: number;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Twinkling stars
      stars.forEach((s) => {
        const opacity = 0.2 + 0.8 * ((Math.sin(t * s.speed + s.phase) + 1) / 2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${opacity})`;
        ctx.fill();
      });

      // Shooting stars
      spawnTimer++;
      if (spawnTimer > 120 + Math.random() * 200) {
        spawnShootingStar();
        spawnTimer = 0;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.life++;

        const progress = ss.life / ss.maxLife;
        const opacity = progress < 0.5 ? progress * 2 : 2 * (1 - progress);
        const tailX = ss.x - Math.cos(ss.angle) * ss.len;
        const tailY = ss.y - Math.sin(ss.angle) * ss.len;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(201, 169, 110, 0)`);
        grad.addColorStop(1, `rgba(212, 132, 142, ${opacity * 0.8})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 237, 224, ${opacity})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

export default Starfield;
