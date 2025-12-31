/**
 * ==================================================================
 * OBSIDIAN AUDIT - PRODUCT PAGE
 * ==================================================================
 * The Institutional Memory of Audit
 * ==================================================================
 */

import { Shield } from 'lucide-react';
import { getProductById } from '@/data/products';
import { ProductPageTemplate } from '@/components/platform/ProductPageTemplate';
import { Navigate } from 'react-router-dom';

export function AuditPage() {
  const product = getProductById('audit');

  if (!product) {
    return <Navigate to="/" replace />;
  }

  return <ProductPageTemplate product={product} icon={Shield} />;
}

export default AuditPage;
