import { useEffect, useState } from "react";

const DataLineagePipeline = () => {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      title: "Raw Data",
      code: `{
  "user_id": "usr_a47bc2",
  "timestamp": 1735734000,
  "action": "create_order",
  "metadata": {...}
}`,
      color: "hsl(194, 100%, 50%)",
    },
    {
      title: "Transformation",
      code: `transform({
  normalize: true,
  enrich: ["geo", "device"],
  schema: "v2.1.0"
})`,
      color: "hsl(174, 62%, 55%)",
    },
    {
      title: "Enrichment",
      code: `enrich({
  user: getUserProfile(),
  context: getSessionData(),
  relations: linkEntities()
})`,
      color: "hsl(214, 100%, 60%)",
    },
    {
      title: "Ontology",
      code: `mapToOntology({
  type: "Order",
  relationships: [
    "CREATED_BY -> User",
    "CONTAINS -> LineItem"
  ]
})`,
      color: "hsl(214, 100%, 50%)",
    },
    {
      title: "Analytics",
      code: `query {
  orders(userId: $id) {
    totalValue
    items { product }
    timeline
  }
}`,
      color: "hsl(214, 100%, 70%)",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <section className="relative py-48 px-8 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-6xl font-light tracking-tight mb-6">
            Real-Time Data Lineage
          </h2>
          <p className="text-xl text-muted-foreground font-mono">
            End-to-end transformation pipeline
          </p>
        </div>

        <div className="relative">
          {/* Pipeline stages */}
          <div className="flex justify-between items-start mb-16">
            {stages.map((stage, idx) => (
              <div key={idx} className="flex-1 relative">
                {/* Connection line */}
                {idx < stages.length - 1 && (
                  <div className="absolute left-1/2 top-8 w-full h-0.5 bg-border-interactive" style={{ zIndex: 0 }}>
                    <div
                      className="h-full transition-all duration-1000 ease-linear"
                      style={{
                        width: activeStage > idx ? "100%" : "0%",
                        background: `linear-gradient(to right, ${stage.color}, ${stages[idx + 1].color})`,
                        boxShadow: `0 0 10px ${stage.color}`,
                      }}
                    />
                  </div>
                )}

                {/* Stage node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      activeStage >= idx
                        ? "border-primary shadow-blue"
                        : "border-border"
                    }`}
                    style={{
                      backgroundColor: activeStage >= idx ? stage.color : "transparent",
                      boxShadow: activeStage === idx ? `0 0 30px ${stage.color}` : undefined,
                    }}
                  >
                    <span className={`font-mono text-sm ${activeStage >= idx ? "text-black" : "text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="mt-4 text-center">
                    <div className={`font-mono text-sm mb-1 ${activeStage >= idx ? "text-foreground" : "text-muted-foreground"}`}>
                      {stage.title}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {activeStage === idx ? "PROCESSING" : activeStage > idx ? "COMPLETE" : "PENDING"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Code display */}
          <div className="bg-surface border border-border-interactive rounded-lg p-8 font-mono text-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full" />
                <div className="w-3 h-3 bg-warning rounded-full" />
                <div className="w-3 h-3 bg-success rounded-full" />
              </div>
              <div className="text-xs text-muted-foreground">
                TRANSACTION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </div>
            </div>

            <div className="bg-black rounded p-6 relative overflow-hidden">
              {/* Animated gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, ${stages[activeStage].color}15, transparent)`,
                  animation: "shimmer 2s linear infinite",
                }}
              />

              <pre className="text-data-primary leading-relaxed">
                <code>{stages[activeStage].code}</code>
              </pre>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <div className="text-xs text-muted-foreground mb-1">LATENCY</div>
                <div className="text-data-primary">&lt;100ms</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">THROUGHPUT</div>
                <div className="text-data-secondary">10K/sec</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">STAGE</div>
                <div className="text-primary">{activeStage + 1}/{stages.length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">STATUS</div>
                <div className="text-success">ACTIVE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataLineagePipeline;
