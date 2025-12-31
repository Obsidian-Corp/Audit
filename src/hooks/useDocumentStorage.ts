/**
 * ==================================================================
 * DOCUMENT STORAGE HOOKS
 * ==================================================================
 * React Query hooks for document upload, download, and management
 * ==================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  DocumentCategory,
  DocumentMetadata,
  uploadDocument,
  uploadDocumentVersion,
  getDocumentUrl,
  deleteDocument,
  archiveDocument,
  listEngagementDocuments,
  getDocumentVersionHistory,
  searchDocuments,
} from '@/lib/document-storage';

// ============================================
// Query Keys
// ============================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (engagementId: string, filters?: { category?: DocumentCategory }) =>
    [...documentKeys.lists(), engagementId, filters] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
  versions: (id: string) => [...documentKeys.all, 'versions', id] as const,
  search: (engagementId: string, term: string) =>
    [...documentKeys.all, 'search', engagementId, term] as const,
};

// ============================================
// Query Hooks
// ============================================

/**
 * List documents for an engagement
 */
export function useEngagementDocuments(
  engagementId: string,
  options?: {
    category?: DocumentCategory;
    includeArchived?: boolean;
  }
) {
  return useQuery({
    queryKey: documentKeys.list(engagementId, { category: options?.category }),
    queryFn: async () => {
      const result = await listEngagementDocuments(engagementId, options);
      if (result.error) throw new Error(result.error);
      return result.documents;
    },
    enabled: !!engagementId,
  });
}

/**
 * Get document version history
 */
export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: documentKeys.versions(documentId),
    queryFn: async () => {
      const result = await getDocumentVersionHistory(documentId);
      if (result.error) throw new Error(result.error);
      return result.versions;
    },
    enabled: !!documentId,
  });
}

/**
 * Search documents
 */
export function useDocumentSearch(engagementId: string, searchTerm: string) {
  return useQuery({
    queryKey: documentKeys.search(engagementId, searchTerm),
    queryFn: async () => {
      const result = await searchDocuments(engagementId, searchTerm);
      if (result.error) throw new Error(result.error);
      return result.documents;
    },
    enabled: !!engagementId && searchTerm.length >= 2,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Upload a new document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      engagementId,
      category,
      options,
    }: {
      file: File;
      engagementId: string;
      category: DocumentCategory;
      options?: {
        description?: string;
        workpaperReference?: string;
        tags?: string[];
      };
    }) => {
      const result = await uploadDocument(file, engagementId, category, options);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.list(variables.engagementId),
      });
      toast({
        title: 'Document uploaded',
        description: `${variables.file.name} has been uploaded successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Upload a new version of a document
 */
export function useUploadDocumentVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      previousDocumentId,
      options,
    }: {
      file: File;
      previousDocumentId: string;
      options?: {
        description?: string;
      };
    }) => {
      const result = await uploadDocumentVersion(file, previousDocumentId, options);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      if (data.metadata) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.list(data.metadata.engagement_id),
        });
      }
      toast({
        title: 'New version uploaded',
        description: `Version ${data.metadata?.version} has been uploaded.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get download URL for a document
 */
export function useGetDocumentUrl() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (path: string) => {
      const result = await getDocumentUrl(path);
      if (result.error) throw new Error(result.error);
      return result.url;
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to get download link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      documentId,
      engagementId,
    }: {
      documentId: string;
      engagementId: string;
    }) => {
      const result = await deleteDocument(documentId);
      if (!result.success) throw new Error(result.error);
      return { documentId, engagementId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.list(data.engagementId),
      });
      toast({
        title: 'Document deleted',
        description: 'The document has been permanently deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Archive a document
 */
export function useArchiveDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      documentId,
      engagementId,
    }: {
      documentId: string;
      engagementId: string;
    }) => {
      const result = await archiveDocument(documentId);
      if (!result.success) throw new Error(result.error);
      return { documentId, engagementId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.list(data.engagementId),
      });
      toast({
        title: 'Document archived',
        description: 'The document has been moved to the archive.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Archive failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================
// Utility Hook for File Downloads
// ============================================

/**
 * Hook to handle file downloads
 */
export function useDownloadDocument() {
  const getUrl = useGetDocumentUrl();

  const download = async (document: DocumentMetadata) => {
    try {
      const url = await getUrl.mutateAsync(document.file_path);
      if (url) {
        // Create a temporary anchor element to trigger download
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.file_name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return {
    download,
    isDownloading: getUrl.isPending,
  };
}
