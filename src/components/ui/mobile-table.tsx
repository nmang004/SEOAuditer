'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';
import { useMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/pwa';

interface MobileTableColumn<T = any> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  mobileLabel?: string;
  hiddenOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low'; // high = always show, medium = show if space, low = hide on mobile
}

interface MobileTableProps<T = any> {
  data: T[];
  columns: MobileTableColumn<T>[];
  onRowClick?: (item: T, index: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowKey?: keyof T | ((item: T) => string | number);
  expandable?: boolean;
  renderExpanded?: (item: T) => React.ReactNode;
  stickyHeader?: boolean;
  virtualizeRows?: boolean;
  pageSize?: number;
}

export function MobileTable<T = any>({
  data,
  columns,
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  className,
  rowKey,
  expandable = false,
  renderExpanded,
  stickyHeader = false,
  virtualizeRows = false,
  pageSize = 50,
}: MobileTableProps<T>) {
  const { isMobile, screenSize } = useMobile();
  const [expandedRows, setExpandedRows] = React.useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(0);

  const getRowKey = React.useCallback((item: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(item);
    } else if (rowKey) {
      return item[rowKey] as string | number;
    }
    return index;
  }, [rowKey]);

  const toggleExpanded = React.useCallback((key: string | number) => {
    hapticFeedback('light');
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSort = React.useCallback((key: string) => {
    if (!onSort) return;
    
    hapticFeedback('light');
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, direction);
  }, [onSort, sortKey, sortDirection]);

  const visibleColumns = React.useMemo(() => {
    if (!isMobile) return columns;
    
    return columns.filter(col => {
      if (col.hiddenOnMobile) return false;
      if (col.priority === 'high') return true;
      if (col.priority === 'low') return false;
      if (screenSize === 'sm') return false; // For small screens, only show high priority
      return true;
    });
  }, [columns, isMobile, screenSize]);

  const paginatedData = React.useMemo(() => {
    if (!virtualizeRows) return data;
    const startIndex = currentPage * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize, virtualizeRows]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {paginatedData.map((item, index) => {
          const key = getRowKey(item, index);
          const isExpanded = expandedRows.has(key);
          
          return (
            <Card 
              key={key} 
              className={cn(
                'transition-all duration-200 active:scale-[0.98]',
                onRowClick && 'cursor-pointer hover:shadow-md'
              )}
              onClick={() => onRowClick?.(item, index)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Primary information */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-1">
                      {visibleColumns.slice(0, 2).map(column => (
                        <div key={column.key}>
                          {column.key === visibleColumns[0].key ? (
                            <div className="font-medium text-foreground truncate">
                              {column.render ? column.render(item) : (item as any)[column.key]}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground truncate">
                              {column.render ? column.render(item) : (item as any)[column.key]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      {expandable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(key);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Secondary information */}
                  {visibleColumns.length > 2 && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      {visibleColumns.slice(2).map(column => (
                        <div key={column.key} className="min-w-0">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            {column.mobileLabel || column.header}
                          </div>
                          <div className="text-sm font-medium truncate">
                            {column.render ? column.render(item) : (item as any)[column.key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && renderExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t mt-4">
                        {renderExpanded(item)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Pagination for virtual scrolling */}
        {virtualizeRows && data.length > pageSize && (
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Page {currentPage + 1} of {Math.ceil(data.length / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(currentPage + 1) * pageSize >= data.length}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn('bg-muted/50', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide',
                    column.sortable && 'cursor-pointer hover:text-foreground',
                    column.width && `w-${column.width}`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortKey === column.key && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-foreground"
                      >
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </motion.span>
                    )}
                  </div>
                </th>
              ))}
              {(expandable || onRowClick) && <th className="w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((item, index) => {
              const key = getRowKey(item, index);
              
              return (
                <React.Fragment key={key}>
                  <tr
                    className={cn(
                      'transition-colors hover:bg-muted/50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {columns.map(column => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </td>
                    ))}
                    {(expandable || onRowClick) && (
                      <td className="px-4 py-3 text-right">
                        {expandable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(key);
                            }}
                          >
                            {expandedRows.has(key) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                  
                  {/* Expanded row */}
                  <AnimatePresence>
                    {expandable && expandedRows.has(key) && renderExpanded && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={columns.length + 1} className="px-4 py-3 bg-muted/25">
                          {renderExpanded(item)}
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 