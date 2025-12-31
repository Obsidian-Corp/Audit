import { useEffect, useRef } from "react";

const InfrastructureDiagram = () => {
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
      label: string;
      type: "gateway" | "function" | "database" | "ontology";
      connections: number[];
      pulsePhase: number;
    }

    const nodes: Node[] = [
      // API Gateway (top center)
      { x: width / 2, y: 80, label: "API Gateway", type: "gateway", connections: [1, 2, 3], pulsePhase: 0 },

      // Edge Functions (middle row)
      { x: width / 4, y: 220, label: "Auth Service", type: "function", connections: [4], pulsePhase: 0.3 },
      { x: width / 2, y: 220, label: "Query Engine", type: "function", connections: [5], pulsePhase: 0.6 },
      { x: (width * 3) / 4, y: 220, label: "Transform", type: "function", connections: [4, 5], pulsePhase: 0.9 },

      // Database Clusters (bottom row)
      { x: width / 3, y: 380, label: "Postgres Cluster", type: "database", connections: [], pulsePhase: 1.2 },
      { x: (width * 2) / 3, y: 380, label: "Ontology Engine", type: "ontology", connections: [], pulsePhase: 1.5 },
    ];

    interface Packet {
      from: number;
      to: number;
      progress: number;
      speed: number;
    }

    const packets: Packet[] = [];
    const maxPackets = 15;

    const createPacket = () => {
      if (packets.length >= maxPackets) return;

      const fromIdx = Math.floor(Math.random() * nodes.length);
      const connections = nodes[fromIdx].connections;

      if (connections.length > 0) {
        const toIdx = connections[Math.floor(Math.random() * connections.length)];
        packets.push({
          from: fromIdx,
          to: toIdx,
          progress: 0,
          speed: 0.01 + Math.random() * 0.02,
        });
      }
    };

    // Initialize packets
    for (let i = 0; i < maxPackets / 3; i++) {
      createPacket();
    }

    const getNodeColor = (type: Node["type"]) => {
      switch (type) {
        case "gateway": return "hsl(214, 100%, 50%)";
        case "function": return "hsl(174, 62%, 55%)";
        case "database": return "hsl(194, 100%, 50%)";
        case "ontology": return "hsl(214, 100%, 70%)";
      }
    };

    const drawNode = (node: Node, pulse: number) => {
      const nodeSize = node.type === "gateway" ? 50 : node.type === "ontology" ? 45 : 40;
      const color = getNodeColor(node.type);

      // Outer glow
      const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeSize * 1.5);
      glowGradient.addColorStop(0, color.replace(")", ", 0.3)").replace("hsl(", "hsla("));
      glowGradient.addColorStop(1, color.replace(")", ", 0)").replace("hsl(", "hsla("));
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main node
      ctx.fillStyle = color.replace(")", ", 0.2)").replace("hsl(", "hsla(");
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      if (node.type === "database") {
        // Cylinder shape for database
        ctx.ellipse(node.x, node.y - 10, nodeSize * 0.6, nodeSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(node.x - nodeSize * 0.6, node.y - 10, nodeSize * 1.2, 20);
        ctx.beginPath();
        ctx.moveTo(node.x - nodeSize * 0.6, node.y - 10);
        ctx.lineTo(node.x - nodeSize * 0.6, node.y + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(node.x + nodeSize * 0.6, node.y - 10);
        ctx.lineTo(node.x + nodeSize * 0.6, node.y + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(node.x, node.y + 10, nodeSize * 0.6, nodeSize * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Rectangle for services
        const rectSize = nodeSize * 0.8;
        ctx.roundRect(node.x - rectSize, node.y - rectSize, rectSize * 2, rectSize * 2, 8);
        ctx.fill();
        ctx.stroke();
      }

      // Pulse effect
      if (pulse > 0.5) {
        ctx.strokeStyle = color.replace(")", ", 0.5)").replace("hsl(", "hsla(");
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize * pulse * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = "hsl(0, 0%, 100%)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + nodeSize + 20);
    };

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.016;
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Draw connections
      ctx.lineWidth = 1.5;
      nodes.forEach((node, i) => {
        node.connections.forEach((connIdx) => {
          const conn = nodes[connIdx];
          const gradient = ctx.createLinearGradient(node.x, node.y, conn.x, conn.y);
          const color1 = getNodeColor(node.type);
          const color2 = getNodeColor(conn.type);
          gradient.addColorStop(0, color1.replace(")", ", 0.2)").replace("hsl(", "hsla("));
          gradient.addColorStop(1, color2.replace(")", ", 0.2)").replace("hsl(", "hsla("));

          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(conn.x, conn.y);
          ctx.stroke();
        });
      });

      // Update and draw packets
      packets.forEach((packet, idx) => {
        packet.progress += packet.speed;

        if (packet.progress >= 1) {
          packets.splice(idx, 1);
          if (Math.random() < 0.8) createPacket();
          return;
        }

        const from = nodes[packet.from];
        const to = nodes[packet.to];
        const x = from.x + (to.x - from.x) * packet.progress;
        const y = from.y + (to.y - from.y) * packet.progress;

        const color = getNodeColor(from.type);
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw nodes with pulse
      nodes.forEach((node) => {
        node.pulsePhase += 0.02;
        const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;
        drawNode(node, pulse);
      });

      // Draw latency indicators
      ctx.fillStyle = "hsl(214, 100%, 50%, 0.8)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";

      // API Gateway to Functions
      ctx.fillText("12ms", width / 2, 150);

      // Functions to Databases
      ctx.fillText("8ms", width / 2.5, 300);
      ctx.fillText("6ms", (width * 2.3) / 3, 300);

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
            Distributed Infrastructure
          </h2>
          <p className="text-xl text-muted-foreground font-mono">
            Globally distributed, auto-scaling architecture
          </p>
        </div>

        <div className="relative h-[500px] rounded-lg border border-border-interactive overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full bg-black" />

          {/* Geographic indicators */}
          <div className="absolute top-4 left-4 font-mono text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>US-EAST-1 | ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>EU-WEST-1 | ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>AP-SOUTH-1 | ACTIVE</span>
            </div>
          </div>

          {/* Performance metrics */}
          <div className="absolute bottom-4 right-4 bg-surface/80 backdrop-blur border border-border rounded p-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground mb-1">REQUESTS/SEC</div>
                <div className="text-data-primary text-lg">125.4K</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">AVG LATENCY</div>
                <div className="text-data-secondary text-lg">47ms</div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical specs */}
        <div className="mt-12 grid grid-cols-4 gap-8 text-center font-mono text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-2">AUTO-SCALING</div>
            <div className="text-primary">Kubernetes</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">LOAD BALANCING</div>
            <div className="text-data-secondary">Global</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">REPLICATION</div>
            <div className="text-data-tertiary">Multi-Region</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">FAILOVER</div>
            <div className="text-success">Automatic</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfrastructureDiagram;
