import { Search, FilterX } from "lucide-react";
import { EmptyState } from "./empty-state";

interface SearchEmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
  title?: string;
  description?: string;
}

export function SearchEmptyState({ 
  searchQuery,
  onClearSearch,
  className,
  title,
  description
}: SearchEmptyStateProps) {
  const displayTitle = title || (searchQuery 
    ? `No results for "${searchQuery}"` 
    : "No results found");
  
  const displayDescription = description || (searchQuery
    ? "Try adjusting your search or filter to find what you're looking for."
    : "No items match your current filters.");

  return (
    <EmptyState
      title={displayTitle}
      description={displayDescription}
      icon={
        <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
          <Search className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
      }
      action={onClearSearch ? {
        label: "Clear search",
        onClick: onClearSearch,
        icon: <FilterX className="h-4 w-4" />
      } : undefined}
      variant="card"
      className={className}
    />
  );
}
