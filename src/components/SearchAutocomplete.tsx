import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getSearchSuggestions, type SearchSuggestion } from "@/lib/api";
import { parseSearchQuery, buildQueryString } from "@/lib/searchParser";

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchAutocomplete({ onSearch, placeholder = "Search products..." }: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await getSearchSuggestions(query.trim());
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error("Search suggestions error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      const parsed = parseSearchQuery(query);
      const smartQuery = buildQueryString(parsed, query);
      setIsOpen(false);
      if (smartQuery) {
        window.location.href = `/products?${smartQuery}`;
      } else {
        onSearch?.(query.trim());
      }
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]?.type === "product") {
        // Navigate to product
        const product = suggestions[selectedIndex];
        if (product.id) {
          window.location.href = `/product/${product.id}`;
        }
      } else {
        handleSearch();
      }
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "product" && suggestion.id) {
      window.location.href = `/product/${suggestion.id}`;
    } else if (suggestion.type === "search" && suggestion.query) {
      setQuery(suggestion.query);
      handleSearch();
    }
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              onClick={clearSearch}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.type === "product" ? suggestion.id : suggestion.query}
              className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.type === "product" ? (
                <>
                  {suggestion.image && (
                    <img
                      src={suggestion.image}
                      alt={suggestion.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{suggestion.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.brand} • {suggestion.category}
                    </p>
                  </div>
                  {suggestion.price !== undefined && (
                    <p className="font-semibold">₹{suggestion.price.toFixed(2)}</p>
                  )}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>Search for "{suggestion.query}"</span>
                </>
              )}
            </div>
          ))}
          
          <div className="px-4 py-2 bg-muted/50 border-t text-xs text-muted-foreground flex items-center justify-between">
            <span>Press Enter to search</span>
            <span>ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
}

