import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useNavigate } from 'react-router-dom';
import { Search, File, Users, Briefcase, FileText, Building2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'client' | 'engagement' | 'procedure' | 'document' | 'finding' | 'program';
  title: string;
  subtitle?: string;
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useKeyboardShortcut(['k'], () => setOpen(true));

  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      try {
        const searchTerm = `%${debouncedQuery}%`;

        // Search clients
        const { data: clients } = await supabase
          .from('clients')
          .select('id, client_name, industry')
          .ilike('client_name', searchTerm)
          .limit(5);

        // Search audits (engagements table doesn't exist)
        const { data: engagements } = await supabase
          .from('audits')
          .select('id, audit_title, audit_type, clients(client_name)')
          .ilike('audit_title', searchTerm)
          .limit(5);

        // Search procedures
        const { data: procedures } = await supabase
          .from('audit_procedures')
          .select('id, description, audits(audit_title)')
          .ilike('description', searchTerm)
          .limit(5);

        // Search documents
        const { data: documents } = await supabase
          .from('documents')
          .select('id, file_name, document_category')
          .ilike('file_name', searchTerm)
          .limit(5);

        // Search findings
        const { data: findings } = await supabase
          .from('audit_findings')
          .select('id, title, finding_number, audits(audit_title)')
          .ilike('title', searchTerm)
          .limit(5);

        // Search programs
        const { data: programs } = await supabase
          .from('engagement_programs')
          .select('id, program_name, audits(audit_title)')
          .ilike('program_name', searchTerm)
          .limit(5);

        const allResults: SearchResult[] = [];

        // Map clients
        if (clients) {
          allResults.push(...clients.map(c => ({
            id: c.id,
            type: 'client' as const,
            title: c.client_name,
            subtitle: c.industry || undefined,
            url: `/crm/clients/${c.id}`,
          })));
        }

        // Map engagements (audits)
        if (engagements) {
          allResults.push(...engagements.map((e: any) => ({
            id: e.id,
            type: 'engagement' as const,
            title: e.audit_title,
            subtitle: e.clients?.client_name || e.audit_type,
            url: `/engagements/${e.id}`,
          })));
        }

        // Map procedures
        if (procedures) {
          allResults.push(...procedures.map((p: any) => ({
            id: p.id,
            type: 'procedure' as const,
            title: p.description.substring(0, 60) + (p.description.length > 60 ? '...' : ''),
            subtitle: p.audits?.audit_title,
            url: `/audit/procedures/${p.id}`,
          })));
        }

        // Map documents
        if (documents) {
          allResults.push(...documents.map(d => ({
            id: d.id,
            type: 'document' as const,
            title: d.file_name,
            subtitle: d.document_category || undefined,
            url: `/documents/${d.id}`,
          })));
        }

        // Map findings
        if (findings) {
          allResults.push(...findings.map((f: any) => ({
            id: f.id,
            type: 'finding' as const,
            title: f.finding_number || f.title,
            subtitle: f.audits?.audit_title || f.title,
            url: `/audit/findings/${f.id}`,
          })));
        }

        // Map programs
        if (programs) {
          allResults.push(...programs.map((p: any) => ({
            id: p.id,
            type: 'program' as const,
            title: p.program_name,
            subtitle: p.audits?.audit_title,
            url: `/audit/programs/${p.id}`,
          })));
        }

        setResults(allResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchData();
  }, [debouncedQuery]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return Users;
      case 'engagement': return Briefcase;
      case 'procedure': return FileText;
      case 'document': return File;
      case 'finding': return Search;
      case 'program': return Calendar;
      default: return Search;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setQuery('');
        setResults([]);
      }
    }}>
      <DialogContent className="max-w-2xl p-0">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 border-b pb-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search clients, engagements, procedures, documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center text-muted-foreground py-8">
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="text-center text-muted-foreground py-8">
              No results found for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => {
                const Icon = getIcon(result.type);
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg text-left transition-colors"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize flex-shrink-0">
                      {result.type}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Press <kbd className="px-2 py-1 bg-muted rounded">⌘K</kbd> or{' '}
            <kbd className="px-2 py-1 bg-muted rounded">Ctrl+K</kbd> to search
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
