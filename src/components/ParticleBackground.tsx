import { useEffect, useRef } from "react";

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number;
      y: number;
      baseY: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 1.5 + 0.5;
        // Make 30% of particles brighter
        const isBright = Math.random() < 0.3;
        this.opacity = isBright
          ? Math.random() * 0.5 + 0.5  // Brighter: 0.5-1.0
          : Math.random() * 0.4 + 0.2;  // Normal: 0.2-0.6
      }

      update(time: number) {
        // Wave motion
        this.y = this.baseY + Math.sin(time * 0.001 + this.x * 0.01) * 30;
        this.x += this.vx;

        // Wrap around edges
        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      resizeCanvas();
      particles = [];

      // Create denser particle grid - reduced spacing to 10
      const cols = Math.floor(window.innerWidth / 10);
      const rows = Math.floor(window.innerHeight / 10);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i * window.innerWidth) / cols;
          const y = (j * window.innerHeight) / rows;
          particles.push(new Particle(x, y));
        }
      }

      // Add additional random particles for extra density
      const extraParticles = 400;
      for (let i = 0; i < extraParticles; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        particles.push(new Particle(x, y));
      }

      // Add concentrated particles around the edges
      const edgeDepth = 150;
      const edgeParticleCount = 500;

      for (let i = 0; i < edgeParticleCount; i++) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;

        switch(edge) {
          case 0: // Top edge
            x = Math.random() * window.innerWidth;
            y = Math.random() * edgeDepth;
            break;
          case 1: // Right edge
            x = window.innerWidth - Math.random() * edgeDepth;
            y = Math.random() * window.innerHeight;
            break;
          case 2: // Bottom edge
            x = Math.random() * window.innerWidth;
            y = window.innerHeight - Math.random() * edgeDepth;
            break;
          case 3: // Left edge
            x = Math.random() * edgeDepth;
            y = Math.random() * window.innerHeight;
            break;
        }

        particles.push(new Particle(x, y));
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update(time);
        particle.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate(0);

    window.addEventListener("resize", () => {
      init();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ opacity: 0.4 }}
      />
      {/* Edge vignette effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.8) 100%)',
          boxShadow: 'inset 0 0 200px rgba(0,0,0,0.9)'
        }}
      />
    </>
  );
};

export default ParticleBackground;
