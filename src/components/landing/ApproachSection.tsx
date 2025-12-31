/**
 * ==================================================================
 * APPROACH SECTION - PALANTIR STYLE
 * ==================================================================
 * How We Build - The Obsidian Way
 * ==================================================================
 */

import { Lightbulb, Layers, Rocket, Handshake } from 'lucide-react';

const principles = [
  {
    icon: Lightbulb,
    title: 'Domain-First Engineering',
    description:
      "We start with operational problems, develop deep domain understanding, and engineer appropriate solutions. Our teams include practitioners from the fields we serve."
  },
  {
    icon: Layers,
    title: 'Integration as Architecture',
    description:
      'Our products share a common technical foundation. Data flows between Obsidian systems without transformation. The whole exceeds the sum of parts.'
  },
  {
    icon: Rocket,
    title: 'Deployment Reality',
    description:
      "We engineer for actual institutional conditions—legacy integration, security requirements, and the organizational complexity vendors typically ignore."
  },
  {
    icon: Handshake,
    title: 'Partnership, Not Licensing',
    description:
      "Obsidian engagements include implementation partnership, practitioner training, and ongoing collaboration. Success is measured by outcomes."
  }
];

export function ApproachSection() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-black to-zinc-950 overflow-hidden">
      {/* Subtle corner accents */}
      <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-primary/10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-primary/10" />

      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4 text-white">
            How We Build
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {principles.map((principle, i) => {
            const Icon = principle.icon;
            return (
              <div
                key={i}
                className="group relative p-6 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-300"
              >
                {/* Icon */}
                <div className="mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary mb-3">
                  {principle.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {principle.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ApproachSection;
