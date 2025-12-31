/**
 * ==================================================================
 * PRODUCT PAGE TEMPLATE - PALANTIR STYLE
 * ==================================================================
 * Consistent structure for all product sub-pages
 * With visual storytelling and reduced text density
 * ==================================================================
 */

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Product } from '@/data/products';
import type { LucideIcon } from 'lucide-react';
import obsidianLogo from '@/assets/obsidian-logo.svg';
import { Navigation } from '@/components/layout/Navigation';
import { OntologyVisual, AuditVisual, CodexVisual, ForgeVisual } from './visuals';
import type { ReactNode } from 'react';

interface ProductPageTemplateProps {
  product: Product;
  icon: LucideIcon;
}

// Map product IDs to their visuals
const productVisuals: Record<string, ReactNode> = {
  ontology: <OntologyVisual />,
  audit: <AuditVisual />,
  codex: <CodexVisual />,
  forge: <ForgeVisual />,
};

export function ProductPageTemplate({ product, icon: Icon }: ProductPageTemplateProps) {
  const navigate = useNavigate();
  const Visual = productVisuals[product.id];

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Split Layout with Visual */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden">
        {/* Subtle corner accents */}
        <div className="absolute top-20 left-0 w-32 h-32 border-l border-t border-primary/10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-primary/10" />

        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Platform
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
                  {product.positioning}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">
                {product.name}
              </h1>

              <p className="text-xl text-primary/90 mb-6">{product.tagline}</p>

              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                {product.shortNarrative}
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white px-8"
                  onClick={() => navigate('/contact')}
                >
                  Request a Briefing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 px-8"
                >
                  View Documentation
                </Button>
              </div>
            </div>

            {/* Visual */}
            <div className="hidden lg:block">
              <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
                {Visual}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem - With Visual Layout */}
      {product.problemStatement && (
        <section className="relative py-20 px-6 bg-gradient-to-b from-black to-zinc-950">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Problem Diagram Placeholder */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="sticky top-28">
                  <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                      The Challenge
                    </div>
                    {/* Mobile: Show visual here */}
                    <div className="lg:hidden mb-6">{Visual}</div>
                    {/* Problem visualization */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-sm text-red-400">Fragmented data sources</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-sm text-amber-400">Manual reconciliation</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-sm text-orange-400">Audit trail gaps</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Text */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-8">
                  The Problem
                </h2>
                <div className="text-muted-foreground leading-relaxed text-base space-y-4">
                  {product.problemStatement.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* The Approach */}
      {product.approachStatement && (
        <section className="relative py-20 px-6">
          <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-primary/10" />

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Approach Text */}
              <div className="lg:col-span-3">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-8">
                  The Approach
                </h2>
                <div className="text-muted-foreground leading-relaxed text-base space-y-4">
                  {product.approachStatement.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Solution Diagram */}
              <div className="lg:col-span-2">
                <div className="sticky top-28">
                  <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                      The Solution
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm text-primary">Unified data model</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-green-400">Automated workflows</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-blue-400">Complete traceability</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Capabilities - Card Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-zinc-950 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-12">
            Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.capabilities.map((capability, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary text-lg font-light">{i + 1}</span>
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary mb-2">
                  {capability.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For - Horizontal Cards */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-12">
            Who It's For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.audiences.map((audience, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <div className="w-8 h-1 bg-primary/50 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {audience.segment}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Integration */}
      {product.platformIntegration && (
        <section className="py-20 px-6 bg-gradient-to-b from-black to-zinc-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-8">
              Platform Integration
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-2xl mx-auto">
              {product.platformIntegration}
            </p>

            {/* Platform ecosystem visualization */}
            <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
              {['Ontology', 'Audit', 'Codex', 'Forge'].map((name) => (
                <div
                  key={name}
                  className={`px-6 py-3 rounded-lg border transition-all ${
                    product.name.includes(name)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-6">
            Ready to see {product.name.replace('Obsidian ', '')} in action?
          </h2>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-10 py-6"
            onClick={() => navigate('/contact')}
          >
            Request a Briefing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img src={obsidianLogo} alt="Obsidian" className="h-6 w-auto opacity-60" />
            </Link>
            <span className="text-sm text-muted-foreground">
              Infrastructure for institutional coherence
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/platform/ontology" className="hover:text-white transition-colors">
              Ontology
            </Link>
            <Link to="/platform/audit" className="hover:text-white transition-colors">
              Audit
            </Link>
            <Link to="/platform/codex" className="hover:text-white transition-colors">
              Codex
            </Link>
            <Link to="/platform/forge" className="hover:text-white transition-colors">
              Forge
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default ProductPageTemplate;
