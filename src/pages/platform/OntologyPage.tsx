/**
 * ==================================================================
 * OBSIDIAN ONTOLOGY - PRODUCT PAGE
 * ==================================================================
 * The Connective Tissue of Enterprise Data
 * ==================================================================
 */

import { GitBranch } from 'lucide-react';
import { getProductById } from '@/data/products';
import { ProductPageTemplate } from '@/components/platform/ProductPageTemplate';
import { Navigate } from 'react-router-dom';

export function OntologyPage() {
  const product = getProductById('ontology');

  if (!product) {
    return <Navigate to="/" replace />;
  }

  return <ProductPageTemplate product={product} icon={GitBranch} />;
}

export default OntologyPage;
