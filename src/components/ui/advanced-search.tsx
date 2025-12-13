import { useState, useEffect } from "react";
import { Input } from "./input";
import { Badge } from "./badge";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Search, X, Filter, Save, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt";
  value: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: SearchFilter[];
  favorite?: boolean;
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilter[]) => void;
  filterFields: { label: string; value: string; type: "text" | "number" | "date" }[];
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, filters: SearchFilter[]) => void;
  placeholder?: string;
}

export function AdvancedSearch({
  onSearch,
  filterFields,
  savedFilters = [],
  onSaveFilter,
  placeholder = "Search...",
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCounts, setFilterCounts] = useState<Record<string, number>>({});

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query, activeFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeFilters, onSearch]);

  const addFilter = (filter: SearchFilter) => {
    setActiveFilters([...activeFilters, filter]);
    setShowFilters(false);
  };

  const removeFilter = (index: number) => {
    setActiveFilters(activeFilters.filter((_, i) => i !== index));
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    setActiveFilters(savedFilter.filters);
    setShowFilters(false);
  };

  const clearAll = () => {
    setQuery("");
    setActiveFilters([]);
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilters.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filters</h3>
                {onSaveFilter && activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const name = prompt("Filter name:");
                      if (name) onSaveFilter(name, activeFilters);
                    }}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                )}
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Saved Filters
                  </p>
                  {savedFilters.map((saved) => (
                    <button
                      key={saved.id}
                      onClick={() => loadSavedFilter(saved)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated transition-colors text-left"
                    >
                      <span className="text-sm">{saved.name}</span>
                      {saved.favorite && <Star className="h-3 w-3 fill-gold text-gold" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Filter Fields */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Add Filter
                </p>
                {filterFields.map((field) => (
                  <div
                    key={field.value}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                    onClick={() =>
                      addFilter({
                        field: field.value,
                        operator: "contains",
                        value: "",
                      })
                    }
                  >
                    <span className="text-sm">{field.label}</span>
                    {filterCounts[field.value] && (
                      <Badge variant="secondary" className="text-xs">
                        {filterCounts[field.value]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {(query || activeFilters.length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => {
            const field = filterFields.find((f) => f.value === filter.field);
            return (
              <Badge
                key={index}
                variant="outline"
                className="pl-3 pr-2 py-1 gap-2 hover:bg-hover-overlay transition-colors"
              >
                <span className="text-xs">
                  {field?.label}: {filter.value || "any"}
                </span>
                <button
                  onClick={() => removeFilter(index)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
