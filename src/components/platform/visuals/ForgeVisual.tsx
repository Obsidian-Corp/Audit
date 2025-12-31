/**
 * ==================================================================
 * FORGE VISUAL - Platform Stack Visualization
 * ==================================================================
 * Shows layered platform architecture
 * ==================================================================
 */

import { useEffect, useState } from 'react';
import { Layers, Database, Puzzle, Code2 } from 'lucide-react';

const layers = [
  {
    icon: Database,
    label: 'Infrastructure',
    sublabel: 'Compute • Storage • Network',
    color: 'border-zinc-600',
    bgColor: 'bg-zinc-900',
  },
  {
    icon: Layers,
    label: 'Ontology Layer',
    sublabel: 'Entities • Relationships • Schema',
    color: 'border-blue-600',
    bgColor: 'bg-blue-950',
  },
  {
    icon: Puzzle,
    label: 'Component Library',
    sublabel: 'UI • Workflows • Integrations',
    color: 'border-purple-600',
    bgColor: 'bg-purple-950',
  },
  {
    icon: Code2,
    label: 'Your Application',
    sublabel: 'Custom Logic • Business Rules',
    color: 'border-primary',
    bgColor: 'bg-primary/10',
  },
];

export function ForgeVisual() {
  const [activeLayer, setActiveLayer] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer((l) => {
        if (l >= layers.length) return -1;
        return l + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Stacked layers */}
      <div className="space-y-3">
        {layers.map((layer, i) => {
          const Icon = layer.icon;
          const isVisible = i <= activeLayer;
          const isActive = i === activeLayer;

          return (
            <div
              key={i}
              className={`relative transition-all duration-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  layer.color
                } ${layer.bgColor} ${
                  isActive ? 'scale-[1.02] shadow-lg' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {layer.label}
                    </div>
                    <div className="text-xs text-white/50">{layer.sublabel}</div>
                  </div>
                  {i === layers.length - 1 && isVisible && (
                    <span className="text-xs font-mono text-primary px-2 py-1 rounded border border-primary/30 bg-primary/10">
                      YOU BUILD
                    </span>
                  )}
                </div>
              </div>

              {/* Connection indicator */}
              {i < layers.length - 1 && isVisible && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-2 bg-white/20" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Build time indicator */}
      {activeLayer >= layers.length && (
        <div className="mt-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-mono text-primary">
              Deploy in weeks, not years
            </span>
          </div>
        </div>
      )}

      {/* Platform label */}
      <div className="mt-6 text-center">
        <span className="text-xs font-mono text-muted-foreground">
          {activeLayer < 0 && 'Building platform stack...'}
          {activeLayer >= 0 &&
            activeLayer < layers.length &&
            `Layer ${activeLayer + 1}/${layers.length}: ${layers[activeLayer]?.label}`}
          {activeLayer >= layers.length && 'Full stack ready'}
        </span>
      </div>
    </div>
  );
}

export default ForgeVisual;
