/**
 * ==================================================================
 * TRUST SECTION - PALANTIR STYLE
 * ==================================================================
 * Built for Institutions That Can't Afford Failure
 * ==================================================================
 */

import { Shield, Lock, Globe, FileCheck, Clock } from 'lucide-react';

const trustPoints = [
  {
    icon: Shield,
    text: 'Security architecture reviewed against institutional requirements'
  },
  {
    icon: Globe,
    text: 'Deployment flexibility—cloud, on-premise, air-gapped as needed'
  },
  {
    icon: Lock,
    text: 'Data sovereignty controls for jurisdictional compliance'
  },
  {
    icon: FileCheck,
    text: 'Audit trails that satisfy the most demanding examination'
  },
  {
    icon: Clock,
    text: 'Reliability engineering for mission-critical operation'
  }
];

export function TrustSection() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-zinc-950 to-black overflow-hidden">
      {/* Subtle corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-primary/10" />

      <div className="relative max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-white">
          Built for Institutions That Can't Afford Failure
        </h2>

        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-3xl">
          The organizations we serve operate in environments where software
          failure has consequences beyond inconvenience. Audit opinions
          affect market confidence. Compliance failures trigger regulatory
          action. Operational breakdowns disrupt critical services.
        </p>

        <div className="text-sm text-muted-foreground uppercase tracking-wider mb-6">
          Obsidian products are engineered to this standard:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trustPoints.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg border border-white/5 bg-white/[0.02]"
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <point.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-white/80 text-sm leading-relaxed">{point.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
