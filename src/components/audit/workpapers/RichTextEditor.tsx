import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useCallback } from 'react';
import { CollaboratorPresence } from './CollaboratorPresence';
import { CollaboratorPresence as CollaboratorType } from '@/hooks/useWorkpaperCollaboration';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  collaborators?: CollaboratorType[];
  onCursorChange?: (position: number) => void;
  onSelectionChange?: (from: number, to: number) => void;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  collaborators = [],
  onCursorChange,
  onSelectionChange,
}: RichTextEditorProps) {
  const members: any[] = []; // User management removed

  const mentionSuggestion = useMemo(
    () => ({
      items: ({ query }: { query: string }) => {
        return members
          .filter((member) =>
            member.full_name.toLowerCase().includes(query.toLowerCase()) ||
            member.email.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5);
      },
      render: () => {
        let component: any;
        let popup: any;

        return {
          onStart: (props: any) => {
            component = document.createElement('div');
            component.className =
              'bg-popover border border-border rounded-lg shadow-lg overflow-hidden';

            const renderItems = () => {
              const { items, command } = props;
              if (items.length === 0) {
                component.innerHTML = `
                  <div class="px-3 py-2 text-sm text-muted-foreground">
                    No results found
                  </div>
                `;
                return;
              }

              component.innerHTML = items
                .map(
                  (item: any, index: number) => `
                  <button
                    class="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 ${
                      index === props.selectedIndex ? 'bg-accent' : ''
                    }"
                    data-index="${index}"
                  >
                    <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                      ${item.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div class="font-medium">${item.full_name}</div>
                      <div class="text-xs text-muted-foreground">${item.email}</div>
                    </div>
                  </button>
                `
                )
                .join('');

              // Add click handlers
              const buttons = component.querySelectorAll('button');
              buttons.forEach((button: HTMLElement, index: number) => {
                button.addEventListener('click', () => command(items[index]));
              });
            };

            renderItems();

            popup = document.body.appendChild(component);
            props.clientRect = props.clientRect || (() => props.view.dom.getBoundingClientRect());
          },

          onUpdate(props: any) {
            const { items, command } = props;
            if (items.length === 0) {
              component.innerHTML = `
                <div class="px-3 py-2 text-sm text-muted-foreground">
                  No results found
                </div>
              `;
              return;
            }

            component.innerHTML = items
              .map(
                (item: any, index: number) => `
                <button
                  class="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 ${
                    index === props.selectedIndex ? 'bg-accent' : ''
                  }"
                  data-index="${index}"
                >
                  <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                    ${item.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div class="font-medium">${item.full_name}</div>
                    <div class="text-xs text-muted-foreground">${item.email}</div>
                  </div>
                </button>
              `
              )
              .join('');

            const buttons = component.querySelectorAll('button');
            buttons.forEach((button: HTMLElement, index: number) => {
              button.addEventListener('click', () => command(items[index]));
            });
          },

          onKeyDown(props: any) {
            if (props.event.key === 'Escape') {
              popup.remove();
              return true;
            }
            return false;
          },

          onExit() {
            popup?.remove();
          },
        };
      },
    }),
    [members]
  );

  const handleSelectionUpdate = useCallback(
    ({ editor }: any) => {
      const { from, to } = editor.state.selection;
      if (from !== to && onSelectionChange) {
        onSelectionChange(from, to);
      }
      if (onCursorChange) {
        onCursorChange(from);
      }
    },
    [onCursorChange, onSelectionChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/20 text-primary px-1 rounded font-medium',
        },
        suggestion: mentionSuggestion,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: handleSelectionUpdate,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {editable && (
        <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') && 'bg-primary/20')}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') && 'bg-primary/20')}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(editor.isActive('code') && 'bg-primary/20')}
          >
            <Code className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(editor.isActive('heading', { level: 1 }) && 'bg-primary/20')}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(editor.isActive('heading', { level: 2 }) && 'bg-primary/20')}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && 'bg-primary/20')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') && 'bg-primary/20')}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive('blockquote') && 'bg-primary/20')}
          >
            <Quote className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
          </div>
          
          {collaborators.length > 0 && (
            <CollaboratorPresence collaborators={collaborators} maxVisible={3} />
          )}
        </div>
      )}
      
      <EditorContent 
        editor={editor} 
        className="prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-muted-foreground"
      />
    </div>
  );
}
