/**
 * useReviewNotes Hook
 * Ticket: FEAT-002
 *
 * Manages review notes/comments on workpapers with threading support.
 * Supports questions, suggestions, issues, and general comments.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

// Type definitions
export type NoteType = 'comment' | 'question' | 'suggestion' | 'issue';
export type NoteStatus = 'open' | 'resolved' | 'wont_fix';

export interface ReviewNote {
  id: string;
  workpaper_id: string;
  parent_note_id: string | null;
  thread_root_id: string | null;
  created_by: string;
  content: string;
  note_type: NoteType;
  status: NoteStatus;
  location_reference: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_comment: string | null;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  resolved_by_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  // Computed
  replies?: ReviewNote[];
  replyCount?: number;
}

export interface ReviewNoteThread {
  rootNote: ReviewNote;
  replies: ReviewNote[];
  isResolved: boolean;
  hasUnresolvedIssues: boolean;
}

export interface ReviewNoteStats {
  total: number;
  open: number;
  resolved: number;
  byType: Record<NoteType, number>;
  unresolvedIssues: number;
}

interface CreateNoteParams {
  workpaperId: string;
  content: string;
  noteType?: NoteType;
  parentNoteId?: string;
  locationReference?: string;
}

interface UpdateNoteParams {
  noteId: string;
  content: string;
}

interface ResolveNoteParams {
  noteId: string;
  resolutionComment?: string;
  status?: NoteStatus;
}

/**
 * Hook for managing review notes on workpapers
 * @param workpaperId - The workpaper to manage notes for
 */
export function useReviewNotes(workpaperId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Get all notes for a workpaper
  const {
    data: notes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['review-notes', workpaperId],
    queryFn: async () => {
      if (!workpaperId) return [];

      const { data, error } = await supabase
        .from('review_notes')
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            email,
            avatar_url
          ),
          resolved_by_profile:resolved_by (
            id,
            full_name,
            email
          )
        `)
        .eq('workpaper_id', workpaperId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ReviewNote[];
    },
    enabled: !!workpaperId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Organize notes into threads
  const threads = useMemo((): ReviewNoteThread[] => {
    if (!notes || notes.length === 0) return [];

    const rootNotes = notes.filter((n) => !n.parent_note_id);
    const replyMap = new Map<string, ReviewNote[]>();

    // Group replies by thread root
    notes.forEach((note) => {
      if (note.thread_root_id) {
        const existing = replyMap.get(note.thread_root_id) || [];
        existing.push(note);
        replyMap.set(note.thread_root_id, existing);
      }
    });

    return rootNotes.map((rootNote) => {
      const replies = replyMap.get(rootNote.id) || [];
      const allNotes = [rootNote, ...replies];
      const hasUnresolvedIssues = allNotes.some(
        (n) => n.note_type === 'issue' && n.status === 'open'
      );
      const isResolved = rootNote.status !== 'open';

      return {
        rootNote,
        replies: replies.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
        isResolved,
        hasUnresolvedIssues,
      };
    });
  }, [notes]);

  // Compute statistics
  const stats = useMemo((): ReviewNoteStats => {
    if (!notes || notes.length === 0) {
      return {
        total: 0,
        open: 0,
        resolved: 0,
        byType: { comment: 0, question: 0, suggestion: 0, issue: 0 },
        unresolvedIssues: 0,
      };
    }

    const byType: Record<NoteType, number> = {
      comment: 0,
      question: 0,
      suggestion: 0,
      issue: 0,
    };

    let open = 0;
    let resolved = 0;
    let unresolvedIssues = 0;

    notes.forEach((note) => {
      byType[note.note_type] = (byType[note.note_type] || 0) + 1;

      if (note.status === 'open') {
        open++;
        if (note.note_type === 'issue') {
          unresolvedIssues++;
        }
      } else {
        resolved++;
      }
    });

    return {
      total: notes.length,
      open,
      resolved,
      byType,
      unresolvedIssues,
    };
  }, [notes]);

  // Mutation: Create a new note
  const createNoteMutation = useMutation({
    mutationFn: async ({
      workpaperId,
      content,
      noteType = 'comment',
      parentNoteId,
      locationReference,
    }: CreateNoteParams) => {
      const insertData: Record<string, any> = {
        workpaper_id: workpaperId,
        created_by: user?.id,
        content,
        note_type: noteType,
        status: 'open',
        location_reference: locationReference || null,
      };

      // If replying to a note, set parent and thread root
      if (parentNoteId) {
        insertData.parent_note_id = parentNoteId;

        // Find the thread root (the trigger will also set this, but let's be explicit)
        const parentNote = notes?.find((n) => n.id === parentNoteId);
        if (parentNote) {
          insertData.thread_root_id = parentNote.thread_root_id || parentNote.id;
        }
      }

      const { data, error } = await supabase
        .from('review_notes')
        .insert(insertData)
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data as ReviewNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', workpaperId] });

      const typeLabel = data.parent_note_id ? 'Reply' : capitalizeFirst(data.note_type);
      toast({
        title: `${typeLabel} added`,
        description: data.parent_note_id
          ? 'Your reply has been posted.'
          : `Your ${data.note_type} has been added to the workpaper.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update a note
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, content }: UpdateNoteParams) => {
      // Can only update own notes
      const note = notes?.find((n) => n.id === noteId);
      if (note && note.created_by !== user?.id) {
        throw new Error('You can only edit your own notes');
      }

      const { data, error } = await supabase
        .from('review_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data as ReviewNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', workpaperId] });
      toast({
        title: 'Note updated',
        description: 'Your note has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Resolve a note/thread
  const resolveNoteMutation = useMutation({
    mutationFn: async ({ noteId, resolutionComment, status = 'resolved' }: ResolveNoteParams) => {
      const { data, error } = await supabase
        .from('review_notes')
        .update({
          status,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_comment: resolutionComment || null,
        })
        .eq('id', noteId)
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            email,
            avatar_url
          ),
          resolved_by_profile:resolved_by (
            id,
            full_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data as ReviewNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', workpaperId] });
      toast({
        title: data.status === 'resolved' ? 'Note resolved' : 'Note closed',
        description:
          data.status === 'resolved'
            ? 'The note has been marked as resolved.'
            : 'The note has been closed as "won\'t fix".',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to resolve note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Reopen a resolved note
  const reopenNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data, error } = await supabase
        .from('review_notes')
        .update({
          status: 'open',
          resolved_by: null,
          resolved_at: null,
          resolution_comment: null,
        })
        .eq('id', noteId)
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data as ReviewNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', workpaperId] });
      toast({
        title: 'Note reopened',
        description: 'The note has been reopened for further discussion.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to reopen note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Delete a note
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const note = notes?.find((n) => n.id === noteId);

      // Can only delete own notes within 24 hours, or managers/partners can delete any
      if (note && note.created_by !== user?.id) {
        // TODO: Check if user is manager/partner
        throw new Error('You can only delete your own notes');
      }

      const { error } = await supabase.from('review_notes').delete().eq('id', noteId);

      if (error) throw error;
      return noteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', workpaperId] });
      toast({
        title: 'Note deleted',
        description: 'The note has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Get notes by type
  const getNotesByType = (type: NoteType): ReviewNote[] => {
    return notes?.filter((n) => n.note_type === type) || [];
  };

  // Helper: Get unresolved notes
  const getUnresolvedNotes = (): ReviewNote[] => {
    return notes?.filter((n) => n.status === 'open') || [];
  };

  // Helper: Get notes at a specific location
  const getNotesAtLocation = (location: string): ReviewNote[] => {
    return notes?.filter((n) => n.location_reference === location) || [];
  };

  // Helper: Check if workpaper has unresolved issues
  const hasUnresolvedIssues = stats.unresolvedIssues > 0;

  // Helper: Check if all notes are resolved
  const allNotesResolved = stats.open === 0;

  return {
    // Data
    notes: notes || [],
    threads,
    stats,
    isLoading,
    error: error as Error | null,

    // Computed flags
    hasUnresolvedIssues,
    allNotesResolved,

    // Helpers
    getNotesByType,
    getUnresolvedNotes,
    getNotesAtLocation,

    // Actions
    createNote: createNoteMutation.mutate,
    createNoteAsync: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutate,
    updateNoteAsync: updateNoteMutation.mutateAsync,
    resolveNote: resolveNoteMutation.mutate,
    resolveNoteAsync: resolveNoteMutation.mutateAsync,
    reopenNote: reopenNoteMutation.mutate,
    reopenNoteAsync: reopenNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutate,
    deleteNoteAsync: deleteNoteMutation.mutateAsync,
    refetch,

    // Loading states
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isResolving: resolveNoteMutation.isPending,
    isReopening: reopenNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}

// Helper functions
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default useReviewNotes;
