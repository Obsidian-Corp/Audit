/**
 * ==================================================================
 * OBSIDIAN CODEX - PRODUCT PAGE
 * ==================================================================
 * Intelligent Document Liberation
 * ==================================================================
 */

import { BookOpen } from 'lucide-react';
import { getProductById } from '@/data/products';
import { ProductPageTemplate } from '@/components/platform/ProductPageTemplate';
import { Navigate } from 'react-router-dom';

export function CodexPage() {
  const product = getProductById('codex');

  if (!product) {
    return <Navigate to="/" replace />;
  }

  return <ProductPageTemplate product={product} icon={BookOpen} />;
}

export default CodexPage;
