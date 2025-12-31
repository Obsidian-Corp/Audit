import { useEffect, useRef } from "react";

const DataIntelligenceNetwork = () => {
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

    interface Node {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      type: "source" | "object" | "relationship" | "insight";
      connections: number[];
      pulse: number;
    }

    interface Packet {
      from: number;
      to: number;
      progress: number;
      speed: number;
    }

    const nodes: Node[] = [];
    const nodeCount = 40;
    const connectionRadius = 200;

    // Create nodes with different types
    for (let i = 0; i < nodeCount; i++) {
      const type =
        i < 8 ? "source" :
        i < 20 ? "object" :
        i < 32 ? "relationship" :
        "insight";

      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 300 - 150,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        type,
        connections: [],
        pulse: Math.random() * Math.PI * 2,
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i !== j) {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dz = node.z - other.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < connectionRadius && node.connections.length < 4) {
            node.connections.push(j);
          }
        }
      });
    });

    // Data packets flowing through network
    const packets: Packet[] = [];
    const maxPackets = 20;

    const createPacket = () => {
      const fromNode = Math.floor(Math.random() * nodes.length);
      const connections = nodes[fromNode].connections;
      if (connections.length > 0) {
        const toNode = connections[Math.floor(Math.random() * connections.length)];
        packets.push({
          from: fromNode,
          to: toNode,
          progress: 0,
          speed: 0.01 + Math.random() * 0.02,
        });
      }
    };

    // Initialize packets
    for (let i = 0; i < maxPackets / 2; i++) {
      createPacket();
    }

    const getNodeColor = (type: Node["type"]) => {
      switch (type) {
        case "source": return "hsl(194, 100%, 50%)"; // Cyan
        case "object": return "hsl(214, 100%, 70%)"; // Light blue
        case "relationship": return "hsl(174, 62%, 55%)"; // Teal
        case "insight": return "hsl(214, 100%, 50%)"; // Electric blue
      }
    };

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      // Update and draw connections
      ctx.lineWidth = 1;
      nodes.forEach((node, i) => {
        node.connections.forEach((connIdx) => {
          const conn = nodes[connIdx];

          // 3D perspective calculation
          const scale1 = 300 / (300 + node.z);
          const scale2 = 300 / (300 + conn.z);
          const x1 = node.x * scale1 + width * (1 - scale1) / 2;
          const y1 = node.y * scale1 + height * (1 - scale1) / 2;
          const x2 = conn.x * scale2 + width * (1 - scale2) / 2;
          const y2 = conn.y * scale2 + height * (1 - scale2) / 2;

          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, getNodeColor(node.type).replace(")", ", 0.15)").replace("hsl(", "hsla("));
          gradient.addColorStop(1, getNodeColor(conn.type).replace(")", ", 0.15)").replace("hsl(", "hsla("));

          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
      });

      // Update and draw packets
      packets.forEach((packet, idx) => {
        packet.progress += packet.speed;

        if (packet.progress >= 1) {
          packets.splice(idx, 1);
          if (Math.random() < 0.7) createPacket();
          return;
        }

        const from = nodes[packet.from];
        const to = nodes[packet.to];

        const scale1 = 300 / (300 + from.z);
        const scale2 = 300 / (300 + to.z);
        const x1 = from.x * scale1 + width * (1 - scale1) / 2;
        const y1 = from.y * scale1 + height * (1 - scale1) / 2;
        const x2 = to.x * scale2 + width * (1 - scale2) / 2;
        const y2 = to.y * scale2 + height * (1 - scale2) / 2;

        const x = x1 + (x2 - x1) * packet.progress;
        const y = y1 + (y2 - y1) * packet.progress;
        const z = from.z + (to.z - from.z) * packet.progress;
        const scale = 300 / (300 + z);

        ctx.shadowBlur = 15;
        ctx.shadowColor = getNodeColor(from.type);
        ctx.fillStyle = getNodeColor(from.type);
        ctx.beginPath();
        ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update and draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;
        node.pulse += 0.05;

        // Bounce off edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        if (node.z < -150 || node.z > 150) node.vz *= -1;

        const scale = 300 / (300 + node.z);
        const x = node.x * scale + width * (1 - scale) / 2;
        const y = node.y * scale + height * (1 - scale) / 2;
        const size = (4 + Math.sin(node.pulse) * 1.5) * scale;

        const color = getNodeColor(node.type);

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        gradient.addColorStop(0, color.replace(")", ", 0.3)").replace("hsl(", "hsla("));
        gradient.addColorStop(1, color.replace(")", ", 0)").replace("hsl(", "hsla("));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core node
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section className="relative py-48 px-8 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-6xl font-light tracking-tight mb-6">
            Data Intelligence Layer
          </h2>
          <p className="text-xl text-muted-foreground font-mono">
            Real-time ontology processing at scale
          </p>
        </div>

        <div className="relative h-[600px] rounded-lg border border-border-interactive overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ background: "radial-gradient(circle at center, hsl(214, 100%, 8%), hsl(0, 0%, 0%))" }}
          />

          {/* Technical overlay */}
          <div className="absolute top-4 left-4 font-mono text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-data-primary rounded-full animate-pulse" />
              <span>SOURCES: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-data-tertiary rounded-full animate-pulse" />
              <span>OBJECTS: MAPPED</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-data-secondary rounded-full animate-pulse" />
              <span>RELATIONSHIPS: INDEXED</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 font-mono text-xs text-muted-foreground">
            <div>LATENCY: &lt;50ms</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataIntelligenceNetwork;
