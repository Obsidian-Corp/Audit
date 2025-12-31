import { useEffect, useRef, useState } from "react";

const ScaleMetrics = () => {
  const [visibleMetrics, setVisibleMetrics] = useState<boolean[]>([false, false, false, false]);
  const sectionRef = useRef<HTMLDivElement>(null);

  const metrics = [
    { value: "10B+", label: "relationships tracked", unit: "" },
    { value: "99.99", label: "uptime SLA", unit: "%" },
    { value: "<100", label: "query latency", unit: "ms" },
    { value: "PB", label: "scale data processing", unit: "" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            metrics.forEach((_, idx) => {
              setTimeout(() => {
                setVisibleMetrics((prev) => {
                  const newState = [...prev];
                  newState[idx] = true;
                  return newState;
                });
              }, idx * 300);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-48 px-8 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-32">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`transition-all duration-1000 ${
                visibleMetrics[idx]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-20"
              }`}
            >
              <div className="flex items-baseline gap-8">
                <div
                  className="font-mono font-light tracking-tighter text-primary"
                  style={{ fontSize: "clamp(80px, 12vw, 160px)" }}
                >
                  {metric.value}
                  {metric.unit && (
                    <span className="text-muted-foreground text-6xl ml-2">{metric.unit}</span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div
                  className="h-px bg-primary transition-all duration-1000 delay-300"
                  style={{ width: visibleMetrics[idx] ? "120px" : "0px" }}
                />
                <span className="text-2xl text-muted-foreground font-light tracking-wide uppercase">
                  {metric.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(hsl(214, 30%, 15%) 1px, transparent 1px),
              linear-gradient(90deg, hsl(214, 30%, 15%) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }} />
        </div>
      </div>
    </section>
  );
};

export default ScaleMetrics;
