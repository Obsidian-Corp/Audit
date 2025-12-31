/**
 * ==================================================================
 * PROBLEM SECTION - PALANTIR STYLE
 * ==================================================================
 * Complexity Is the Problem. Coherence Is the Solution.
 * ==================================================================
 */

import { AlertTriangle, Layers, Link2, TrendingUp } from 'lucide-react';

const painPoints = [
  {
    icon: AlertTriangle,
    label: 'Data scattered across dozens of systems',
  },
  {
    icon: Layers,
    label: 'Expertise siloed across teams',
  },
  {
    icon: Link2,
    label: 'Integration promises that delivered more silos',
  },
];

const outcomes = [
  {
    icon: TrendingUp,
    label: 'Unified semantic model',
  },
  {
    icon: Layers,
    label: 'Connected workflows',
  },
  {
    icon: Link2,
    label: 'Institutional memory that persists',
  },
];

export function ProblemSection() {
  return (
    <section className="relative py-24 px-4 bg-black overflow-hidden">
      {/* Subtle geometric accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-primary/10" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-primary/10" />

      <div className="relative max-w-6xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-white">
            Complexity Is the Problem.{' '}
            <span className="text-primary">Coherence Is the Solution.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Modern institutions operate in information environments beyond human capacity
            to synthesize. We build infrastructure that creates shared understanding.
          </p>
        </div>

        {/* Visual Problem → Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* The Problem */}
          <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="text-xs font-mono text-red-400 uppercase tracking-wider mb-6">
              The Reality Today
            </div>
            <div className="space-y-4">
              {painPoints.map((point, i) => {
                const Icon = point.icon;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                    </div>
                    <span className="text-white/80">{point.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* The Solution */}
          <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
            <div className="text-xs font-mono text-primary uppercase tracking-wider mb-6">
              With Obsidian
            </div>
            <div className="space-y-4">
              {outcomes.map((point, i) => {
                const Icon = point.icon;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-white/80">{point.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-12 text-center">
          <p className="text-primary font-medium text-lg">
            Infrastructure for institutional coherence.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
