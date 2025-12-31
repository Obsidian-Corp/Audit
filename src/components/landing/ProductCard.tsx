/**
 * ==================================================================
 * PRODUCT CARD - PALANTIR STYLE
 * ==================================================================
 * Information-dense, gravitas over hype, specificity over abstraction
 * ==================================================================
 */

import { type LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProductCapability } from '@/data/products';

interface ProductCardProps {
  name: string;
  tagline: string;
  positioning: string;
  shortNarrative: string;
  capabilities: ProductCapability[];
  href: string;
  icon: LucideIcon;
  hardTruth?: string;
}

export function ProductCard({
  name,
  tagline,
  positioning,
  shortNarrative,
  capabilities,
  href,
  icon: Icon,
  hardTruth
}: ProductCardProps) {
  return (
    <div className="group relative flex flex-col h-full p-6 md:p-8 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {positioning}
          </span>
        </div>
        <h3 className="text-xl md:text-2xl font-medium tracking-tight text-white mb-2">
          {name}
        </h3>
        <p className="text-sm text-primary/80">{tagline}</p>
      </div>

      {/* Narrative */}
      <p className="text-sm md:text-base leading-relaxed text-muted-foreground mb-6">
        {shortNarrative}
      </p>

      {/* Capabilities */}
      <div className="flex-1 mb-6">
        <ul className="space-y-3">
          {capabilities.slice(0, 4).map((capability, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="text-primary/50 mt-0.5 font-light">—</span>
              <span className="text-white/70">{capability.title}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Hard Truth (if present) */}
      {hardTruth && (
        <div className="text-xs text-muted-foreground/70 italic mb-6 border-l-2 border-primary/30 pl-4 py-2">
          {hardTruth}
        </div>
      )}

      {/* CTA */}
      <Link
        to={href}
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
      >
        Explore {name.replace('Obsidian ', '')}
        <ArrowRight className="ml-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default ProductCard;
