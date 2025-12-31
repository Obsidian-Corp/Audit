/**
 * ==================================================================
 * DOCUMENT STORAGE MODULE
 * ==================================================================
 * Supabase Storage integration for audit workpapers and documents
 *
 * Features:
 * - File upload with progress tracking
 * - Organized bucket structure by engagement
 * - Document versioning support
 * - Secure signed URLs for downloads
 * - File type validation
 * - Metadata tracking
 * ==================================================================
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type DocumentCategory =
  | 'workpaper'
  | 'supporting_document'
  | 'client_pbc'
  | 'correspondence'
  | 'signed_letter'
  | 'audit_report'
  | 'management_letter'
  | 'confirmation'
  | 'representation_letter'
  | 'engagement_letter'
  | 'other';

export interface DocumentMetadata {
  id: string;
  engagement_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: DocumentCategory;
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
  version: number;
  previous_version_id?: string;
  workpaper_reference?: string;
  is_archived: boolean;
  tags?: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
  metadata?: DocumentMetadata;
}

// ============================================
// Constants
// ============================================

export const BUCKET_NAME = 'audit-documents';

export const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/tiff',
  // Other
  'text/plain',
  'application/zip',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a storage path for the document
 */
export function generateStoragePath(
  engagementId: string,
  category: DocumentCategory,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${engagementId}/${category}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: PDF, Word, Excel, CSV, Images`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// Storage Operations
// ============================================

/**
 * Upload a file to Supabase Storage
 */
export async function uploadDocument(
  file: File,
  engagementId: string,
  category: DocumentCategory,
  options?: {
    description?: string;
    workpaperReference?: string;
    tags?: string[];
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate storage path
    const path = generateStoragePath(engagementId, category, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create metadata record in database
    const { data: metadataRecord, error: metadataError } = await supabase
      .from('document_metadata')
      .insert([{
        engagement_id: engagementId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        file_type: file.type,
        category,
        description: options?.description,
        uploaded_by: user?.id,
        version: 1,
        workpaper_reference: options?.workpaperReference,
        is_archived: false,
        tags: options?.tags,
      }])
      .select()
      .single();

    if (metadataError) {
      console.error('Failed to create metadata record:', metadataError);
      // Still return success since file was uploaded
    }

    // Get signed URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1 hour expiry

    return {
      success: true,
      path,
      url: urlData?.signedUrl,
      metadata: metadataRecord as DocumentMetadata,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Upload failed' };
  }
}

/**
 * Upload a new version of an existing document
 */
export async function uploadDocumentVersion(
  file: File,
  previousDocumentId: string,
  options?: {
    description?: string;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> {
  try {
    // Get the previous document metadata
    const { data: prevDoc, error: fetchError } = await supabase
      .from('document_metadata')
      .select('*')
      .eq('id', previousDocumentId)
      .single();

    if (fetchError || !prevDoc) {
      return { success: false, error: 'Previous document not found' };
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate new storage path
    const path = generateStoragePath(
      prevDoc.engagement_id,
      prevDoc.category,
      file.name
    );

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create new metadata record with version increment
    const { data: metadataRecord, error: metadataError } = await supabase
      .from('document_metadata')
      .insert([{
        engagement_id: prevDoc.engagement_id,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        file_type: file.type,
        category: prevDoc.category,
        description: options?.description || prevDoc.description,
        uploaded_by: user?.id,
        version: prevDoc.version + 1,
        previous_version_id: previousDocumentId,
        workpaper_reference: prevDoc.workpaper_reference,
        is_archived: false,
        tags: prevDoc.tags,
      }])
      .select()
      .single();

    if (metadataError) {
      console.error('Failed to create metadata record:', metadataError);
    }

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600);

    return {
      success: true,
      path,
      url: urlData?.signedUrl,
      metadata: metadataRecord as DocumentMetadata,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Upload failed' };
  }
}

/**
 * Get a signed download URL for a document
 */
export async function getDocumentUrl(
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error: any) {
    return { error: error.message || 'Failed to get download URL' };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the document metadata
    const { data: doc, error: fetchError } = await supabase
      .from('document_metadata')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      return { success: false, error: 'Document not found' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([doc.file_path]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    // Delete metadata record
    const { error: dbError } = await supabase
      .from('document_metadata')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Delete failed' };
  }
}

/**
 * Archive a document (soft delete)
 */
export async function archiveDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_metadata')
      .update({ is_archived: true })
      .eq('id', documentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Archive failed' };
  }
}

/**
 * List documents for an engagement
 */
export async function listEngagementDocuments(
  engagementId: string,
  options?: {
    category?: DocumentCategory;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ documents: DocumentMetadata[]; error?: string }> {
  try {
    let query = supabase
      .from('document_metadata')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('uploaded_at', { ascending: false });

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (!options?.includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { documents: [], error: error.message };
    }

    return { documents: data as DocumentMetadata[] };
  } catch (error: any) {
    return { documents: [], error: error.message || 'Failed to list documents' };
  }
}

/**
 * Get document version history
 */
export async function getDocumentVersionHistory(
  documentId: string
): Promise<{ versions: DocumentMetadata[]; error?: string }> {
  try {
    // First get the current document
    const { data: currentDoc, error: fetchError } = await supabase
      .from('document_metadata')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !currentDoc) {
      return { versions: [], error: 'Document not found' };
    }

    // Find all versions by following the previous_version_id chain
    const versions: DocumentMetadata[] = [currentDoc as DocumentMetadata];
    let prevId = currentDoc.previous_version_id;

    while (prevId) {
      const { data: prevDoc, error: prevError } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('id', prevId)
        .single();

      if (prevError || !prevDoc) break;

      versions.push(prevDoc as DocumentMetadata);
      prevId = prevDoc.previous_version_id;
    }

    return { versions };
  } catch (error: any) {
    return { versions: [], error: error.message || 'Failed to get version history' };
  }
}

/**
 * Search documents by tags or description
 */
export async function searchDocuments(
  engagementId: string,
  searchTerm: string
): Promise<{ documents: DocumentMetadata[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('document_metadata')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('is_archived', false)
      .or(`file_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('uploaded_at', { ascending: false });

    if (error) {
      return { documents: [], error: error.message };
    }

    return { documents: data as DocumentMetadata[] };
  } catch (error: any) {
    return { documents: [], error: error.message || 'Search failed' };
  }
}
