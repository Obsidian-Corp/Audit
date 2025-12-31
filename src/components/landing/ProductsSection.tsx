/**
 * ==================================================================
 * PRODUCTS SECTION - PALANTIR STYLE
 * ==================================================================
 * Purpose-Built Systems for Specific Problems
 * ==================================================================
 */

import { products } from '@/data/products';
import { ProductCard } from './ProductCard';
import { GitBranch, Shield, BookOpen, Hammer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  'GitBranch': GitBranch,
  'Shield': Shield,
  'BookOpen': BookOpen,
  'Hammer': Hammer,
};

export function ProductsSection() {
  return (
    <section className="py-24 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-white">
            Purpose-Built Systems for Specific Problems
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We don't build horizontal platforms and adapt them to vertical needs.
            We identify domains where information fragmentation creates unacceptable
            risk, and we engineer solutions that practitioners trust with their
            most important work.
          </p>
        </div>

        {/* Product Grid - 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {products.map((product) => {
            const IconComponent = iconMap[product.icon] || Shield;
            return (
              <ProductCard
                key={product.id}
                name={product.name}
                tagline={product.tagline}
                positioning={product.positioning}
                shortNarrative={product.shortNarrative}
                capabilities={product.capabilities}
                href={product.href}
                icon={IconComponent}
                hardTruth={product.hardTruth}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProductsSection;
