/**
 * ==================================================================
 * ADVANCED SEARCH COMPONENT
 * ==================================================================
 * Global search across engagements, clients, procedures, workpapers, findings
 * With filters, saved searches, and recent searches per UX critique issue #9
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'engagement' | 'client' | 'procedure' | 'workpaper' | 'finding' | 'report';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

interface AdvancedSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEARCH_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'engagement', label: 'Engagements' },
  { value: 'client', label: 'Clients' },
  { value: 'procedure', label: 'Procedures' },
  { value: 'workpaper', label: 'Workpapers' },
  { value: 'finding', label: 'Findings' },
  { value: 'report', label: 'Reports' },
];

/**
 * Advanced Search Dialog Component
 *
 * Usage:
 * ```tsx
 * const [searchOpen, setSearchOpen] = useState(false);
 *
 * // Keyboard shortcut (Cmd/Ctrl + K)
 * useEffect(() => {
 *   const handleKeyDown = (e: KeyboardEvent) => {
 *     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 *       e.preventDefault();
 *       setSearchOpen(true);
 *     }
 *   };
 *   window.addEventListener('keydown', handleKeyDown);
 *   return () => window.removeEventListener('keydown', handleKeyDown);
 * }, []);
 *
 * <AdvancedSearch open={searchOpen} onOpenChange={setSearchOpen} />
 * ```
 */
export function AdvancedSearch({ open, onOpenChange }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery, searchType);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, searchType]);

  const performSearch = async (searchQuery: string, type: string) => {
    setIsLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search engagements
      if (type === 'all' || type === 'engagement') {
        const { data: engagements } = await supabase
          .from('audits')
          .select('id, audit_name, client:clients(name), status')
          .ilike('audit_name', `%${searchQuery}%`)
          .limit(5);

        if (engagements) {
          engagements.forEach((eng) => {
            searchResults.push({
              id: eng.id,
              type: 'engagement',
              title: eng.audit_name,
              subtitle: eng.client?.name || '',
              url: `/engagements/${eng.id}/audit`,
              metadata: { status: eng.status },
            });
          });
        }
      }

      // Search clients
      if (type === 'all' || type === 'client') {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, contact_email, status')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);

        if (clients) {
          clients.forEach((client) => {
            searchResults.push({
              id: client.id,
              type: 'client',
              title: client.name,
              subtitle: client.contact_email || '',
              url: `/crm/clients/${client.id}`,
              metadata: { status: client.status },
            });
          });
        }
      }

      // Search procedures
      if (type === 'all' || type === 'procedure') {
        const { data: procedures } = await supabase
          .from('audit_procedures')
          .select('id, title, procedure_code, status')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);

        if (procedures) {
          procedures.forEach((proc) => {
            searchResults.push({
              id: proc.id,
              type: 'procedure',
              title: proc.title,
              subtitle: proc.procedure_code || '',
              url: `/audit/procedures/${proc.id}`,
              metadata: { status: proc.status },
            });
          });
        }
      }

      // Search findings
      if (type === 'all' || type === 'finding') {
        const { data: findings } = await supabase
          .from('audit_findings')
          .select('id, title, finding_type, severity')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);

        if (findings) {
          findings.forEach((finding) => {
            searchResults.push({
              id: finding.id,
              type: 'finding',
              title: finding.title,
              subtitle: finding.finding_type || '',
              url: `/findings/${finding.id}`,
              metadata: { severity: finding.severity },
            });
          });
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate to result
    navigate(result.url);
    onOpenChange(false);

    // Reset search
    setQuery('');
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getResultIcon = (type: string) => {
    const icons: Record<string, string> = {
      engagement: '📋',
      client: '🏢',
      procedure: '✅',
      workpaper: '📄',
      finding: '🔍',
      report: '📊',
    };
    return icons[type] || '📁';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </DialogTitle>
          <DialogDescription>
            Search across engagements, clients, procedures, workpapers, and findings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10"
                autoFocus
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results or Recent Searches */}
          <ScrollArea className="h-[400px]">
            {query.length >= 2 ? (
              // Search Results
              <div className="space-y-2">
                {isLoading && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Searching...
                  </p>
                )}

                {!isLoading && results.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No results found for "{query}"
                  </p>
                )}

                {!isLoading &&
                  results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors border"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getResultIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{result.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                          {result.metadata?.status && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {result.metadata.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              // Recent Searches
              recentSearches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="h-auto p-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((recentQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(recentQuery)}
                        className="w-full p-2 text-left text-sm hover:bg-muted rounded transition-colors flex items-center gap-2"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {recentQuery}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </ScrollArea>

          {/* Keyboard Shortcuts */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>
              <kbd className="px-1.5 py-0.5 rounded bg-muted">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">↓</kbd> to navigate •
              <kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">Enter</kbd> to select •
              <kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">Esc</kbd> to close
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
