import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "./dialog";
import { Input } from "./input";
import { 
  Search, 
  FolderKanban, 
  LayoutDashboard, 
  Home, 
  Users, 
  Settings,
  FileText,
  Calendar,
  BarChart3,
  Plus
} from "lucide-react";

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: any;
  action: () => void;
  category: string;
  keywords: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const commands: Command[] = [
    // Navigation
    { id: "nav-dashboard", title: "Go to Dashboard", icon: Home, action: () => navigate("/dashboard"), category: "Navigation", keywords: ["home", "dashboard"] },
    { id: "nav-audit", title: "Go to Engagements", icon: LayoutDashboard, action: () => navigate("/engagements"), category: "Navigation", keywords: ["audit", "engagements", "overview"] },
    { id: "nav-universe", title: "Go to Audit Universe", icon: FolderKanban, action: () => navigate("/universe"), category: "Navigation", keywords: ["universe", "entities"] },
    { id: "nav-team", title: "Go to Team", icon: Users, action: () => navigate("/dashboard/team"), category: "Navigation", keywords: ["team", "members", "people"] },
    { id: "nav-portfolio", title: "Go to Portfolio", icon: BarChart3, action: () => navigate("/dashboard/portfolio"), category: "Navigation", keywords: ["portfolio", "management"] },
    { id: "nav-settings", title: "Go to Settings", icon: Settings, action: () => navigate("/dashboard/settings"), category: "Navigation", keywords: ["settings", "preferences"] },
    
    // Actions
    { id: "action-create-project", title: "Create New Project", icon: Plus, action: () => {}, category: "Actions", keywords: ["create", "new", "project"] },
    { id: "action-create-task", title: "Create New Task", icon: Plus, action: () => {}, category: "Actions", keywords: ["create", "new", "task"] },
  ];

  const filteredCommands = commands.filter(command => {
    const searchStr = query.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchStr) ||
      command.description?.toLowerCase().includes(searchStr) ||
      command.keywords.some(k => k.includes(searchStr))
    );
  });

  const executeCommand = useCallback((command: Command) => {
    setOpen(false);
    setQuery("");
    command.action();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open palette with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }

      // Close on Escape
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categorizedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for commands, pages, or actions..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {Object.entries(categorizedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              <div className="space-y-1">
                {cmds.map((command) => {
                  const Icon = command.icon;
                  return (
                    <button
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated transition-colors text-left group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface border border-border group-hover:border-border-interactive group-hover:bg-gold/10 transition-all">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground group-hover:text-gold transition-colors">
                          {command.title}
                        </div>
                        {command.description && (
                          <div className="text-xs text-muted-foreground">
                            {command.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No commands found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-surface">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">↑</kbd>
              <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-card border border-border rounded text-xs font-mono">esc</kbd>
              close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
