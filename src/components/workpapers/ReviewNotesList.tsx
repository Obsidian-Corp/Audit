/**
 * ReviewNotesList Component
 * Ticket: UI-003
 *
 * Displays review notes for a workpaper with threading support.
 * Allows creating, replying to, and resolving notes.
 */

import { useState, useRef, useEffect } from 'react';
import {
  useReviewNotes,
  ReviewNote,
  ReviewNoteThread,
  NoteType,
} from '@/hooks/useReviewNotes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  Check,
  CheckCircle,
  MoreHorizontal,
  Reply,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Icon and color mapping for note types
const noteTypeConfig: Record<
  NoteType,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  comment: {
    icon: MessageCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Comment',
  },
  question: {
    icon: HelpCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    label: 'Question',
  },
  suggestion: {
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    label: 'Suggestion',
  },
  issue: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    label: 'Issue',
  },
};

interface NoteItemProps {
  note: ReviewNote;
  isReply?: boolean;
  onReply: (noteId: string) => void;
  onEdit: (note: ReviewNote) => void;
  onResolve: (noteId: string, comment?: string) => void;
  onReopen: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  currentUserId?: string;
}

function NoteItem({
  note,
  isReply = false,
  onReply,
  onEdit,
  onResolve,
  onReopen,
  onDelete,
  currentUserId,
}: NoteItemProps) {
  const config = noteTypeConfig[note.note_type];
  const Icon = config.icon;
  const isOwn = note.created_by === currentUserId;
  const isResolved = note.status !== 'open';

  const initials = note.profiles?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || note.profiles?.email?.[0]?.toUpperCase() || '?';

  return (
    <div
      id={`note-${note.id}`}
      className={cn(
        'group relative',
        isReply && 'ml-8 border-l-2 border-muted pl-4',
        isResolved && 'opacity-60'
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={note.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {note.profiles?.full_name || note.profiles?.email || 'Unknown'}
            </span>
            {!isReply && (
              <Badge
                variant="secondary"
                className={cn('h-5 text-xs', config.bgColor, config.color)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            )}
            {isResolved && (
              <Badge variant="outline" className="h-5 text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolved
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>

          {/* Location reference */}
          {note.location_reference && (
            <p className="text-xs text-muted-foreground mt-1">
              📍 {note.location_reference}
            </p>
          )}

          {/* Resolution */}
          {note.resolution_comment && (
            <div className="mt-2 p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                {note.resolution_comment}
              </p>
              {note.resolved_by_profile && (
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  - {note.resolved_by_profile.full_name || note.resolved_by_profile.email}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isResolved && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onReply(note.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                {note.note_type !== 'comment' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-green-600"
                    onClick={() => onResolve(note.id)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                )}
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwn && !isResolved && (
                  <DropdownMenuItem onClick={() => onEdit(note)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isResolved && (
                  <DropdownMenuItem onClick={() => onReopen(note.id)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reopen
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {isOwn && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThreadViewProps {
  thread: ReviewNoteThread;
  onReply: (noteId: string) => void;
  onEdit: (note: ReviewNote) => void;
  onResolve: (noteId: string, comment?: string) => void;
  onReopen: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  currentUserId?: string;
}

function ThreadView({
  thread,
  onReply,
  onEdit,
  onResolve,
  onReopen,
  onDelete,
  currentUserId,
}: ThreadViewProps) {
  const [isExpanded, setIsExpanded] = useState(!thread.isResolved);

  return (
    <div className="border rounded-lg p-4">
      {/* Root note */}
      <NoteItem
        note={thread.rootNote}
        onReply={onReply}
        onEdit={onEdit}
        onResolve={onResolve}
        onReopen={onReopen}
        onDelete={onDelete}
        currentUserId={currentUserId}
      />

      {/* Replies */}
      {thread.replies.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-3 ml-8 h-7 text-xs">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 space-y-4">
              {thread.replies.map((reply) => (
                <NoteItem
                  key={reply.id}
                  note={reply}
                  isReply
                  onReply={onReply}
                  onEdit={onEdit}
                  onResolve={onResolve}
                  onReopen={onReopen}
                  onDelete={onDelete}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

interface NoteComposerProps {
  workpaperId: string;
  parentNoteId?: string;
  onCancel?: () => void;
  onSubmit: (params: {
    workpaperId: string;
    content: string;
    noteType: NoteType;
    parentNoteId?: string;
  }) => void;
  isSubmitting: boolean;
}

function NoteComposer({
  workpaperId,
  parentNoteId,
  onCancel,
  onSubmit,
  isSubmitting,
}: NoteComposerProps) {
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('comment');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!content.trim()) return;

    onSubmit({
      workpaperId,
      content: content.trim(),
      noteType: parentNoteId ? 'comment' : noteType, // Replies are always comments
      parentNoteId,
    });

    setContent('');
    setNoteType('comment');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('border rounded-lg p-3', parentNoteId && 'ml-8 bg-muted/20')}>
      {!parentNoteId && (
        <div className="flex items-center gap-2 mb-2">
          <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(noteTypeConfig).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <config.icon className={cn('h-4 w-4', config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder={parentNoteId ? 'Write a reply...' : 'Add a note...'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[80px] resize-none"
      />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">
          Press Cmd+Enter to submit
        </p>
        <div className="flex items-center gap-2">
          {parentNoteId && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReviewNotesListProps {
  workpaperId: string;
  /** Show only open notes */
  showOpenOnly?: boolean;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

export function ReviewNotesList({
  workpaperId,
  showOpenOnly = false,
  compact = false,
}: ReviewNotesListProps) {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<ReviewNote | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const {
    threads,
    stats,
    isLoading,
    error,
    createNote,
    updateNote,
    resolveNote,
    reopenNote,
    deleteNote,
    isCreating,
  } = useReviewNotes(workpaperId);

  // Filter threads
  const filteredThreads = threads.filter((thread) => {
    if (showOpenOnly || filter === 'open') return !thread.isResolved;
    if (filter === 'resolved') return thread.isResolved;
    return true;
  });

  const handleReply = (noteId: string) => {
    setReplyingTo(noteId);
    setEditingNote(null);
  };

  const handleEdit = (note: ReviewNote) => {
    setEditingNote(note);
    setReplyingTo(null);
  };

  const handleResolve = (noteId: string, comment?: string) => {
    resolveNote({ noteId, resolutionComment: comment });
  };

  const handleCreateNote = (params: {
    workpaperId: string;
    content: string;
    noteType: NoteType;
    parentNoteId?: string;
  }) => {
    createNote(params);
    setReplyingTo(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load review notes</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Review Notes
              {stats.total > 0 && (
                <Badge variant="secondary">{stats.total}</Badge>
              )}
            </h3>
            {stats.unresolvedIssues > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.unresolvedIssues} unresolved {stats.unresolvedIssues === 1 ? 'issue' : 'issues'}
              </Badge>
            )}
          </div>

          {!showOpenOnly && stats.total > 0 && (
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({stats.total})</SelectItem>
                <SelectItem value="open">Open ({stats.open})</SelectItem>
                <SelectItem value="resolved">Resolved ({stats.resolved})</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* New note composer */}
      <NoteComposer
        workpaperId={workpaperId}
        onSubmit={handleCreateNote}
        isSubmitting={isCreating}
      />

      {/* Notes list */}
      {filteredThreads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No {filter !== 'all' ? filter : ''} notes yet</p>
          {filter === 'all' && (
            <p className="text-sm mt-1">Add a note to start a discussion</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <div key={thread.rootNote.id}>
              <ThreadView
                thread={thread}
                onReply={handleReply}
                onEdit={handleEdit}
                onResolve={handleResolve}
                onReopen={reopenNote}
                onDelete={deleteNote}
                currentUserId={user?.id}
              />

              {/* Reply composer */}
              {replyingTo === thread.rootNote.id && (
                <div className="mt-2">
                  <NoteComposer
                    workpaperId={workpaperId}
                    parentNoteId={thread.rootNote.id}
                    onCancel={() => setReplyingTo(null)}
                    onSubmit={handleCreateNote}
                    isSubmitting={isCreating}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewNotesList;
