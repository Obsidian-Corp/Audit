-- Create storage bucket for audit documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-documents', 'audit-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage

-- Policy: Users can upload to their organization folder
CREATE POLICY "Users can upload to their org folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audit-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT f.id::text
      FROM firms f
      INNER JOIN profiles p ON p.firm_id = f.id
      WHERE p.id = auth.uid()
    )
  );

-- Policy: Users can view their organization files
CREATE POLICY "Users can view their org files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audit-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT f.id::text
      FROM firms f
      INNER JOIN profiles p ON p.firm_id = f.id
      WHERE p.id = auth.uid()
    )
  );

-- Policy: Users can update their organization files
CREATE POLICY "Users can update their org files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audit-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT f.id::text
      FROM firms f
      INNER JOIN profiles p ON p.firm_id = f.id
      WHERE p.id = auth.uid()
    )
  );

-- Policy: Users can delete their organization files
CREATE POLICY "Users can delete their org files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audit-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT f.id::text
      FROM firms f
      INNER JOIN profiles p ON p.firm_id = f.id
      WHERE p.id = auth.uid()
    )
  );
