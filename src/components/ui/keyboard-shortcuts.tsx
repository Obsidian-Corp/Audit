import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Badge } from "./badge";
import { Command } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["g", "p"], description: "Go to Projects", category: "Navigation" },
  { keys: ["g", "d"], description: "Go to Dashboard", category: "Navigation" },
  { keys: ["g", "h"], description: "Go to Portal", category: "Navigation" },
  { keys: ["g", "t"], description: "Go to Team", category: "Navigation" },
  
  // Actions
  { keys: ["c"], description: "Create new item", category: "Actions" },
  { keys: ["⌘", "k"], description: "Open command palette", category: "Actions" },
  { keys: ["/"], description: "Focus search", category: "Actions" },
  { keys: ["Esc"], description: "Close dialogs", category: "Actions" },
  
  // Bulk Actions
  { keys: ["⌘", "a"], description: "Select all", category: "Bulk Actions" },
  { keys: ["Shift", "↑/↓"], description: "Multi-select", category: "Bulk Actions" },
  { keys: ["⌘", "d"], description: "Delete selected", category: "Bulk Actions" },
  
  // Help
  { keys: ["?"], description: "Show keyboard shortcuts", category: "Help" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts dialog on "?"
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Don't trigger if user is typing in input
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setOpen(true);
        }
      }

      // Close on Escape
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const categorizedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Command className="h-5 w-5 text-gold" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(categorizedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-elevated transition-colors"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <Badge 
                            variant="outline" 
                            className="font-mono text-xs px-2 py-1 bg-card border-border-interactive"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-gold/10 border border-gold/30">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Pro tip:</span> Press{" "}
            <Badge variant="outline" className="font-mono mx-1">?</Badge>
            {" "}anytime to view this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
