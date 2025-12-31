/**
 * ==================================================================
 * OBSIDIAN FORGE - PRODUCT PAGE
 * ==================================================================
 * Custom Intelligence Applications, Rapidly Deployed
 * ==================================================================
 */

import { Hammer } from 'lucide-react';
import { getProductById } from '@/data/products';
import { ProductPageTemplate } from '@/components/platform/ProductPageTemplate';
import { Navigate } from 'react-router-dom';

export function ForgePage() {
  const product = getProductById('forge');

  if (!product) {
    return <Navigate to="/" replace />;
  }

  return <ProductPageTemplate product={product} icon={Hammer} />;
}

export default ForgePage;
