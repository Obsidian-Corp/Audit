import { useEffect, useState } from "react";

const LiveCodeEditor = () => {
  const [typedCode, setTypedCode] = useState("");
  const [outputVisible, setOutputVisible] = useState(false);

  const fullCode = `// Create an object in the ontology
const user = await ontology.objects.create({
  type: "User",
  properties: {
    name: "Alice Chen",
    role: "Data Scientist",
    department: "Analytics"
  }
});

// Create relationships
await ontology.relationships.create({
  from: user.id,
  to: project.id,
  type: "WORKS_ON",
  properties: { since: "2024-01-15" }
});

// Query the graph
const results = await ontology.query(\`
  MATCH (u:User)-[:WORKS_ON]->(p:Project)
  WHERE p.status = "active"
  RETURN u, p, relationships
\`);`;

  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 50;

    const typeInterval = setInterval(() => {
      if (currentIndex < fullCode.length) {
        setTypedCode(fullCode.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setOutputVisible(true), 500);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, []);

  const outputData = {
    nodes: [
      { id: "u1", type: "User", name: "Alice Chen" },
      { id: "p1", type: "Project", name: "DataViz Platform" },
      { id: "p2", type: "Project", name: "ML Pipeline" },
    ],
    relationships: [
      { from: "u1", to: "p1", type: "WORKS_ON" },
      { from: "u1", to: "p2", type: "WORKS_ON" },
    ],
  };

  return (
    <section className="relative py-48 px-8 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-6xl font-light tracking-tight mb-6">
            Developer Platform
          </h2>
          <p className="text-xl text-muted-foreground font-mono">
            Type-safe API with real-time graph visualization
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Code Editor */}
          <div className="bg-surface border border-border-interactive rounded-lg overflow-hidden">
            <div className="bg-surface-elevated px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full" />
                <div className="w-3 h-3 bg-warning rounded-full" />
                <div className="w-3 h-3 bg-success rounded-full" />
              </div>
              <div className="text-xs font-mono text-muted-foreground">ontology-client.ts</div>
            </div>

            <div className="p-6 font-mono text-sm h-[600px] overflow-auto">
              <pre className="text-data-primary leading-relaxed">
                <code>{typedCode}</code>
                <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
              </pre>
            </div>

            <div className="bg-surface-elevated px-4 py-2 border-t border-border flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-muted-foreground">TypeScript 5.3</span>
              </div>
              <div className="text-muted-foreground">|</div>
              <div className="text-muted-foreground">Line {typedCode.split("\n").length}</div>
            </div>
          </div>

          {/* Output Visualization */}
          <div className="bg-surface border border-border-interactive rounded-lg overflow-hidden">
            <div className="bg-surface-elevated px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="text-xs font-mono text-muted-foreground">Graph Visualization</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${outputVisible ? "bg-success animate-pulse" : "bg-muted"}`} />
                <span className="text-xs text-muted-foreground">{outputVisible ? "LIVE" : "WAITING"}</span>
              </div>
            </div>

            <div className="p-6 h-[600px] flex items-center justify-center relative">
              {outputVisible ? (
                <div className="relative w-full h-full">
                  {/* Network visualization */}
                  <svg className="w-full h-full">
                    {/* Relationships */}
                    <line
                      x1="50%"
                      y1="30%"
                      x2="30%"
                      y2="70%"
                      stroke="hsl(214, 100%, 50%)"
                      strokeWidth="2"
                      className="animate-fade-in"
                      style={{ animationDelay: "0.3s" }}
                    />
                    <line
                      x1="50%"
                      y1="30%"
                      x2="70%"
                      y2="70%"
                      stroke="hsl(214, 100%, 50%)"
                      strokeWidth="2"
                      className="animate-fade-in"
                      style={{ animationDelay: "0.5s" }}
                    />

                    {/* User node */}
                    <g className="animate-scale-in">
                      <circle cx="50%" cy="30%" r="40" fill="hsl(194, 100%, 50%)" opacity="0.2" />
                      <circle cx="50%" cy="30%" r="30" fill="hsl(194, 100%, 50%)" />
                    </g>

                    {/* Project nodes */}
                    <g className="animate-scale-in" style={{ animationDelay: "0.3s" }}>
                      <circle cx="30%" cy="70%" r="35" fill="hsl(174, 62%, 55%)" opacity="0.2" />
                      <circle cx="30%" cy="70%" r="25" fill="hsl(174, 62%, 55%)" />
                    </g>
                    <g className="animate-scale-in" style={{ animationDelay: "0.5s" }}>
                      <circle cx="70%" cy="70%" r="35" fill="hsl(174, 62%, 55%)" opacity="0.2" />
                      <circle cx="70%" cy="70%" r="25" fill="hsl(174, 62%, 55%)" />
                    </g>
                  </svg>

                  {/* Labels */}
                  <div className="absolute top-[25%] left-1/2 -translate-x-1/2 text-center animate-fade-in">
                    <div className="font-mono text-xs text-data-primary mb-1">User</div>
                    <div className="text-xs text-muted-foreground">Alice Chen</div>
                  </div>
                  <div className="absolute top-[68%] left-[26%] text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
                    <div className="font-mono text-xs text-data-secondary mb-1">Project</div>
                    <div className="text-xs text-muted-foreground">DataViz</div>
                  </div>
                  <div className="absolute top-[68%] right-[26%] text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
                    <div className="font-mono text-xs text-data-secondary mb-1">Project</div>
                    <div className="text-xs text-muted-foreground">ML Pipeline</div>
                  </div>

                  {/* JSON output */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur border border-border rounded p-4 font-mono text-xs animate-fade-in" style={{ animationDelay: "0.7s" }}>
                    <div className="text-success mb-2">Query executed successfully</div>
                    <div className="text-muted-foreground">
                      <div>Nodes: {outputData.nodes.length}</div>
                      <div>Relationships: {outputData.relationships.length}</div>
                      <div className="text-data-primary mt-1">Latency: 47ms</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground font-mono text-sm">
                  <div className="mb-4">Waiting for query execution...</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SDK badges */}
        <div className="mt-12 flex items-center justify-center gap-6 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-data-primary rounded-full" />
            <span>TypeScript SDK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-data-secondary rounded-full" />
            <span>Python SDK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-data-tertiary rounded-full" />
            <span>GraphQL API</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>REST API</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveCodeEditor;
