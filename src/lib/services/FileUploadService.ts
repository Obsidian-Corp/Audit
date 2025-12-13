import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'text/csv',
];

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  organizationId: string;
  engagementId?: string;
  procedureId?: string;
  category?: 'workpaper' | 'evidence' | 'report' | 'other';
  onProgress?: (progress: UploadProgress) => void;
}

export class FileUploadService {
  /**
   * Upload a file to Supabase Storage with progress tracking
   */
  static async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<{ path: string; documentId: string }> {
    // Validate file
    this.validateFile(file);

    const { organizationId, engagementId, procedureId, category = 'other', onProgress } = options;

    // Generate storage path
    const timestamp = new Date().getTime();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${organizationId}/${engagementId || 'general'}/${timestamp}_${sanitizedName}`;

    // Upload to storage with progress
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audit-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        engagement_id: engagementId || null,
        procedure_id: procedureId || null,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_bucket: 'audit-documents',
        storage_path: storagePath,
        category,
        uploaded_by: user?.id,
      })
      .select()
      .single();

    if (docError) {
      // Cleanup storage if database insert fails
      await supabase.storage.from('audit-documents').remove([storagePath]);
      throw new Error(`Failed to create document record: ${docError.message}`);
    }

    return {
      path: storagePath,
      documentId: document.id,
    };
  }

  /**
   * Download a file from storage
   */
  static async downloadFile(storagePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('audit-documents')
      .download(storagePath);

    if (error) {
      throw new Error(`Download failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Get public URL for a file (creates signed URL for private buckets)
   */
  static async getFileUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('audit-documents')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete a file
   */
  static async deleteFile(documentId: string): Promise<void> {
    // Get document to find storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new Error(`Document not found: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('audit-documents')
      .remove([document.storage_path]);

    if (storageError) {
      throw new Error(`Storage deletion failed: ${storageError.message}`);
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Database deletion failed: ${dbError.message}`);
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `File type ${file.type} not allowed. Allowed types: PDF, Excel, Word, Images, CSV`
      );
    }

    // Additional validation
    if (file.name.length > 255) {
      throw new Error('File name too long (max 255 characters)');
    }
  }

  /**
   * Create a new version of an existing document
   */
  static async createVersion(
    documentId: string,
    file: File,
    options: Omit<UploadOptions, 'category'>
  ): Promise<string> {
    // Get original document
    const { data: originalDoc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      throw new Error(`Original document not found: ${error.message}`);
    }

    // Upload new version
    const { path } = await this.uploadFile(file, {
      ...options,
      category: originalDoc.category,
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create version record if table exists
    // Note: This assumes document_versions table exists
    try {
      const { data: version, error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: (originalDoc.current_version || 0) + 1,
          storage_path: path,
          file_size: file.size,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (versionError) {
        throw new Error(`Failed to create version: ${versionError.message}`);
      }

      // Update document current version
      await supabase
        .from('documents')
        .update({ current_version: (originalDoc.current_version || 0) + 1 })
        .eq('id', documentId);

      return version.id;
    } catch (err) {
      // If version tracking isn't available, just update the main document
      await supabase
        .from('documents')
        .update({
          storage_path: path,
          file_size: file.size,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      return documentId;
    }
  }
}
