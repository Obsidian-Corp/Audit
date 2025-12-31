import { useEffect, useRef } from "react";

const IsometricArchitecture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Isometric projection helpers
    const isoX = (x: number, y: number) => (x - y) * Math.cos(Math.PI / 6);
    const isoY = (x: number, y: number, z: number) => (x + y) * Math.sin(Math.PI / 6) - z;

    let scrollOffset = 0;
    const handleScroll = () => {
      const rect = canvas.getBoundingClientRect();
      const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight));
      scrollOffset = scrollProgress;
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // Grid background
    const drawGrid = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
      ctx.strokeStyle = "hsl(214, 30%, 15%)";
      ctx.lineWidth = 0.5;

      const gridSize = 40;
      const rows = 15;
      const cols = 15;

      for (let i = -rows; i <= rows; i++) {
        ctx.beginPath();
        const x1 = isoX(i * gridSize, -cols * gridSize);
        const y1 = isoY(i * gridSize, -cols * gridSize, 0);
        const x2 = isoX(i * gridSize, cols * gridSize);
        const y2 = isoY(i * gridSize, cols * gridSize, 0);
        ctx.moveTo(offsetX + x1, offsetY + y1);
        ctx.lineTo(offsetX + x2, offsetY + y2);
        ctx.stroke();
      }

      for (let j = -cols; j <= cols; j++) {
        ctx.beginPath();
        const x1 = isoX(-rows * gridSize, j * gridSize);
        const y1 = isoY(-rows * gridSize, j * gridSize, 0);
        const x2 = isoX(rows * gridSize, j * gridSize);
        const y2 = isoY(rows * gridSize, j * gridSize, 0);
        ctx.moveTo(offsetX + x1, offsetY + y1);
        ctx.lineTo(offsetX + x2, offsetY + y2);
        ctx.stroke();
      }
    };

    // Draw isometric box
    const drawBox = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string,
      offsetX: number,
      offsetY: number
    ) => {
      const points = [
        [x, y, z],
        [x + w, y, z],
        [x + w, y + h, z],
        [x, y + h, z],
        [x, y, z + d],
        [x + w, y, z + d],
        [x + w, y + h, z + d],
        [x, y + h, z + d],
      ];

      const isoPoints = points.map(([px, py, pz]) => [
        offsetX + isoX(px, py),
        offsetY + isoY(px, py, pz),
      ]);

      // Top face
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(isoPoints[4][0], isoPoints[4][1]);
      ctx.lineTo(isoPoints[5][0], isoPoints[5][1]);
      ctx.lineTo(isoPoints[6][0], isoPoints[6][1]);
      ctx.lineTo(isoPoints[7][0], isoPoints[7][1]);
      ctx.closePath();
      ctx.fill();

      // Right face
      ctx.fillStyle = color.replace("50%", "40%");
      ctx.beginPath();
      ctx.moveTo(isoPoints[5][0], isoPoints[5][1]);
      ctx.lineTo(isoPoints[1][0], isoPoints[1][1]);
      ctx.lineTo(isoPoints[2][0], isoPoints[2][1]);
      ctx.lineTo(isoPoints[6][0], isoPoints[6][1]);
      ctx.closePath();
      ctx.fill();

      // Left face
      ctx.fillStyle = color.replace("50%", "30%");
      ctx.beginPath();
      ctx.moveTo(isoPoints[4][0], isoPoints[4][1]);
      ctx.lineTo(isoPoints[0][0], isoPoints[0][1]);
      ctx.lineTo(isoPoints[3][0], isoPoints[3][1]);
      ctx.lineTo(isoPoints[7][0], isoPoints[7][1]);
      ctx.closePath();
      ctx.fill();

      // Wireframe edges
      ctx.strokeStyle = "hsl(214, 100%, 70%)";
      ctx.lineWidth = 1.5;
      [
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 1], [1, 2], [2, 3], [3, 0],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ].forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(isoPoints[a][0], isoPoints[a][1]);
        ctx.lineTo(isoPoints[b][0], isoPoints[b][1]);
        ctx.stroke();
      });
    };

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 + 100;

      // Draw grid
      drawGrid(ctx, centerX, centerY);

      // Layer 1: Data Layer (bottom)
      const layer1Z = 0 - scrollOffset * 50;
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * 80 + Math.sin(time + i) * 5;
        const y = 0;
        const pulse = Math.sin(time * 2 + i) * 0.2 + 0.8;
        drawBox(ctx, x, y, layer1Z, 60, 60, 40, `hsl(194, 100%, ${35 * pulse}%)`, centerX, centerY);
      }

      // Connection lines to layer 2
      ctx.strokeStyle = "hsl(214, 100%, 50%, 0.3)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const x1 = (i - 2) * 80;
        const y1 = 30;
        const z1 = layer1Z + 40;
        const x2 = (i - 2) * 90;
        const y2 = 30;
        const z2 = layer1Z + 140;

        ctx.beginPath();
        ctx.moveTo(centerX + isoX(x1, y1), centerY + isoY(x1, y1, z1));
        ctx.lineTo(centerX + isoX(x2, y2), centerY + isoY(x2, y2, z2));
        ctx.stroke();
      }

      // Layer 2: Ontology Layer (middle) - Network mesh
      const layer2Z = 100 - scrollOffset * 50;
      const meshSize = 200;
      const meshRes = 4;

      ctx.strokeStyle = "hsl(174, 62%, 55%)";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < meshRes; i++) {
        for (let j = 0; j < meshRes; j++) {
          const x = (i - meshRes / 2) * (meshSize / meshRes);
          const y = (j - meshRes / 2) * (meshSize / meshRes);
          const z = layer2Z + Math.sin(time + i + j) * 10;

          if (i < meshRes - 1) {
            ctx.beginPath();
            const x2 = ((i + 1) - meshRes / 2) * (meshSize / meshRes);
            const z2 = layer2Z + Math.sin(time + i + 1 + j) * 10;
            ctx.moveTo(centerX + isoX(x, y), centerY + isoY(x, y, z));
            ctx.lineTo(centerX + isoX(x2, y), centerY + isoY(x2, y, z2));
            ctx.stroke();
          }

          if (j < meshRes - 1) {
            ctx.beginPath();
            const y2 = ((j + 1) - meshRes / 2) * (meshSize / meshRes);
            const z2 = layer2Z + Math.sin(time + i + j + 1) * 10;
            ctx.moveTo(centerX + isoX(x, y), centerY + isoY(x, y, z));
            ctx.lineTo(centerX + isoX(x, y2), centerY + isoY(x, y2, z2));
            ctx.stroke();
          }
        }
      }

      // Layer 3: Application Layer (top) - API nodes
      const layer3Z = 200 - scrollOffset * 50;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + time * 0.5;
        const radius = 120;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const pulse = Math.sin(time * 3 + i) * 0.3 + 0.7;

        drawBox(ctx, x, y, layer3Z, 40, 40, 30, `hsl(214, 100%, ${40 * pulse}%)`, centerX, centerY);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section className="relative py-48 px-8 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-6xl font-light tracking-tight mb-6">
            Platform Architecture
          </h2>
          <p className="text-xl text-muted-foreground font-mono">
            Three-layer ontology infrastructure
          </p>
        </div>

        <div className="relative h-[700px] rounded-lg border border-border-interactive overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full bg-black" />

          {/* Labels */}
          <div className="absolute left-8 top-1/4 font-mono text-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-data-primary" />
              <span className="text-muted-foreground">DATA LAYER</span>
            </div>
            <div className="text-xs text-muted-foreground/60 ml-6">Storage | Ingestion | Transform</div>
          </div>

          <div className="absolute left-8 top-1/2 font-mono text-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-data-secondary" />
              <span className="text-muted-foreground">ONTOLOGY LAYER</span>
            </div>
            <div className="text-xs text-muted-foreground/60 ml-6">Relationships | Schema | Graph</div>
          </div>

          <div className="absolute left-8 top-3/4 font-mono text-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-primary" />
              <span className="text-muted-foreground">APPLICATION LAYER</span>
            </div>
            <div className="text-xs text-muted-foreground/60 ml-6">API | SDK | GraphQL</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IsometricArchitecture;
