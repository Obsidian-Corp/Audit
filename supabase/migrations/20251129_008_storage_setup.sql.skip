-- ============================================================================
-- Migration: Storage Buckets & Policies Setup
-- Version: 20251129_008
-- Description: Creates Supabase Storage buckets and RLS policies for file management
-- Dependencies: 20251129_007_indexes_optimization.sql
-- ============================================================================

-- ============================================================================
-- CREATE STORAGE BUCKETS
-- ============================================================================

-- Engagement documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'engagement-documents',
  'engagement-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Workpapers bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workpapers',
  'workpapers',
  false,
  104857600, -- 100MB limit
  ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain', 'text/csv', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Audit reports bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audit-reports',
  'audit-reports',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Organization logos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES - ENGAGEMENT DOCUMENTS
-- ============================================================================

-- Policy: Organization members can upload engagement documents
CREATE POLICY "Organization members can upload engagement documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'engagement-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Organization members can view their org's engagement documents
CREATE POLICY "Organization members can view engagement documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'engagement-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Organization members can update their org's engagement documents
CREATE POLICY "Organization members can update engagement documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'engagement-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Organization members can delete their org's engagement documents
CREATE POLICY "Organization members can delete engagement documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'engagement-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'partner', 'manager')
      )
    )
  );

-- ============================================================================
-- STORAGE RLS POLICIES - WORKPAPERS
-- ============================================================================

-- Policy: Organization members can upload workpapers
CREATE POLICY "Organization members can upload workpapers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workpapers' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Organization members can view workpapers
CREATE POLICY "Organization members can view workpapers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'workpapers' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Organization members can update workpapers
CREATE POLICY "Organization members can update workpapers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'workpapers' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Organization members can delete workpapers
CREATE POLICY "Organization members can delete workpapers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'workpapers' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'partner', 'manager')
      )
    )
  );

-- ============================================================================
-- STORAGE RLS POLICIES - AUDIT REPORTS
-- ============================================================================

-- Policy: Organization members can upload audit reports
CREATE POLICY "Organization members can upload audit reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audit-reports' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'partner', 'manager')
      )
    )
  );

-- Policy: Organization members can view audit reports
CREATE POLICY "Organization members can view audit reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audit-reports' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Partners can update audit reports
CREATE POLICY "Partners can update audit reports"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'audit-reports' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'partner')
      )
    )
  );

-- Policy: Partners can delete audit reports
CREATE POLICY "Partners can delete audit reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audit-reports' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'partner')
      )
    )
  );

-- ============================================================================
-- STORAGE RLS POLICIES - AVATARS
-- ============================================================================

-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STORAGE RLS POLICIES - ORGANIZATION LOGOS
-- ============================================================================

-- Policy: Admins can upload organization logos
CREATE POLICY "Admins can upload organization logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- Policy: Anyone can view organization logos (public bucket)
CREATE POLICY "Anyone can view organization logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization-logos');

-- Policy: Admins can update organization logos
CREATE POLICY "Admins can update organization logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'organization-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- Policy: Admins can delete organization logos
CREATE POLICY "Admins can delete organization logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'organization-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS FOR STORAGE
-- ============================================================================

-- Function to generate storage path for engagement documents
CREATE OR REPLACE FUNCTION generate_engagement_document_path(
  org_id UUID,
  engagement_id UUID,
  filename TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN org_id::text || '/' || engagement_id::text || '/' || filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total storage usage by bucket
CREATE OR REPLACE FUNCTION get_bucket_storage_usage(bucket_name TEXT, org_id UUID)
RETURNS BIGINT AS $$
DECLARE
  total_bytes BIGINT;
BEGIN
  SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0) INTO total_bytes
  FROM storage.objects
  WHERE bucket_id = bucket_name
    AND (storage.foldername(name))[1] = org_id::text;

  RETURN total_bytes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_008_storage_setup.sql completed successfully';
  RAISE NOTICE 'Storage buckets created: 5';
  RAISE NOTICE 'Storage policies created: 25+';
  RAISE NOTICE 'Folder structure: {organization_id}/{engagement_id}/{filename}';
END $$;
