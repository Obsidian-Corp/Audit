import { supabase } from '@/integrations/supabase/client';
import { FileMetadata, FileUploadOptions, FileFilter } from './types';

export class FileService {
  private static BUCKET_NAME = 'project-files';

  static async uploadFile(
    file: File,
    options: FileUploadOptions
  ): Promise<FileMetadata | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = options.folder
        ? `${options.organizationId}/${options.folder}/${timestamp}-${sanitizedName}`
        : `${options.organizationId}/${timestamp}-${sanitizedName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create file record in database
      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert({
          name: file.name,
          path: filePath,
          mime_type: file.type,
          size: file.size,
          folder: options.folder,
          tags: options.tags || [],
          uploaded_by: user.id,
          project_id: options.projectId || null,
          task_id: options.taskId || null,
          deliverable_id: options.deliverableId || null,
          workstream_id: options.workstreamId || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return fileRecord as FileMetadata;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  static async listFiles(filter: FileFilter = {}): Promise<FileMetadata[]> {
    try {
      let query = supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.folder) {
        query = query.eq('folder', filter.folder);
      }
      if (filter.projectId) {
        query = query.eq('project_id', filter.projectId);
      }
      if (filter.taskId) {
        query = query.eq('task_id', filter.taskId);
      }
      if (filter.deliverableId) {
        query = query.eq('deliverable_id', filter.deliverableId);
      }
      if (filter.mimeType) {
        query = query.ilike('mime_type', `${filter.mimeType}%`);
      }
      if (filter.searchQuery) {
        query = query.ilike('name', `%${filter.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as FileMetadata[];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  static async getFileUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  static async downloadFile(filePath: string, fileName: string): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  static async deleteFile(fileId: string, filePath: string): Promise<boolean> {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
    return '📎';
  }
}
