import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Search, Check, X, AlertTriangle, Info, Filter } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SEOIssue, FilterState, IssuesDashboardProps } from '@/lib/analysis-types';
import { FixedSizeList as List } from 'react-window';
import React from 'react';
import debounce from 'lodash/debounce';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

const severityColors = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
} as const;

const statusColors = {
  'new': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'fixed': 'bg-green-100 text-green-800',
  'ignored': 'bg-gray-100 text-gray-800',
} as const;

const allSeverities = ['critical', 'high', 'medium', 'low'];
const allCategories = ['technical', 'content', 'onpage', 'ux'];
const allStatuses = ['new', 'in-progress', 'fixed', 'ignored'];

export function IssuesDashboard({
  issues,
  filters,
  onFilterChange,
  onIssueAction,
}: IssuesDashboardProps) {
  const [search, setSearch] = useState('');
  const debouncedSetSearch = React.useMemo(() => debounce(setSearch, 200), []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'severity' | 'status' | 'detectedDate'>('severity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filtering
  const filteredIssues = useMemo(() => {
    let filtered = issues;
    if (filters.severity.length)
      filtered = filtered.filter(i => filters.severity.includes(i.severity));
    if (filters.category.length)
      filtered = filtered.filter(i => filters.category.includes(i.category));
    if (filters.status.length)
      filtered = filtered.filter(i => filters.status.includes(i.status));
    if (search)
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase())
      );
    return filtered;
  }, [issues, filters, search]);

  // Sorting
  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      if (sortBy === 'severity') {
        const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (sevOrder[a.severity] - sevOrder[b.severity]) * (sortDir === 'asc' ? 1 : -1);
      }
      if (sortBy === 'status') {
        return (a.status.localeCompare(b.status)) * (sortDir === 'asc' ? 1 : -1);
      }
      if (sortBy === 'detectedDate') {
        return (new Date(a.detectedDate).getTime() - new Date(b.detectedDate).getTime()) * (sortDir === 'asc' ? 1 : -1);
      }
      return 0;
    });
  }, [filteredIssues, sortBy, sortDir]);

  // Batch selection
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(sortedIssues.map(i => i.id)));
  const clearSelection = () => setSelected(new Set());

  // Batch actions
  const handleBatchAction = (action: string) => {
    selected.forEach(id => onIssueAction(id, action));
    clearSelection();
  };

  // Export (mock)
  const handleExport = (type: 'csv' | 'pdf') => {
    // TODO: Implement real export
    alert(`Exporting ${sortedIssues.length} issues as ${type.toUpperCase()}`);
  };

  // Filter controls
  const handleFilter = (type: keyof FilterState, value: string) => {
    const arr = filters[type];
    if (arr.includes(value)) {
      onFilterChange({ ...filters, [type]: arr.filter(v => v !== value) });
    } else {
      onFilterChange({ ...filters, [type]: [...arr, value] });
    }
  };

  // Add export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredIssues);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'seo-issues.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('SEO Issues Report', 10, 10);
    filteredIssues.slice(0, 40).forEach((issue, i) => {
      doc.text(`${i + 1}. ${issue.title} [${issue.severity}]`, 10, 20 + i * 7);
    });
    doc.save('seo-issues.pdf');
  };

  return (
    <Card className="h-full overflow-visible">
      <CardHeader className="pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">SEO Issues</CardTitle>
          <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-muted divide-x divide-muted bg-background">
            <Button size="sm" variant="ghost" onClick={handleExportCSV} aria-label="Export issues as CSV" className="flex items-center gap-1 px-3">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export issues as PDF" className="flex items-center gap-1 px-3">
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            value={search}
            onChange={e => debouncedSetSearch(e.target.value)}
            placeholder="Search issues..."
            className="w-48"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost"><Filter className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2">
                  <div>
                    <div className="font-semibold mb-1">Severity</div>
                    <div className="flex gap-1 flex-wrap">
                      {allSeverities.map(sev => (
                        <Button
                          key={sev}
                          size="xs"
                          variant={filters.severity.includes(sev) ? 'default' : 'outline'}
                          onClick={() => handleFilter('severity', sev)}
                        >
                          {sev}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Category</div>
                    <div className="flex gap-1 flex-wrap">
                      {allCategories.map(cat => (
                        <Button
                          key={cat}
                          size="xs"
                          variant={filters.category.includes(cat) ? 'default' : 'outline'}
                          onClick={() => handleFilter('category', cat)}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Status</div>
                    <div className="flex gap-1 flex-wrap">
                      {allStatuses.map(stat => (
                        <Button
                          key={stat}
                          size="xs"
                          variant={filters.status.includes(stat) ? 'default' : 'outline'}
                          onClick={() => handleFilter('status', stat)}
                        >
                          {stat}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-0" role="region" aria-label="SEO Issues List">
        <div className="border-b">
          <Input
            type="search"
            placeholder="Search issues..."
            value={search}
            onChange={e => debouncedSetSearch(e.target.value)}
            className="w-full rounded-none border-0 border-b bg-background px-4 py-3 text-sm focus:ring-0"
            aria-label="Search issues"
            role="searchbox"
          />
        </div>
        <div className="flex gap-2 p-2 border-b bg-muted/10">
          <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-muted divide-x divide-muted bg-background">
            <Button size="xs" variant="ghost" onClick={handleExportCSV} aria-label="Export issues as CSV" className="flex items-center gap-1 px-2">
              <Download className="h-3 w-3" /> CSV
            </Button>
            <Button size="xs" variant="ghost" onClick={handleExportPDF} aria-label="Export issues as PDF" className="flex items-center gap-1 px-2">
              <Download className="h-3 w-3" /> PDF
            </Button>
          </div>
        </div>
        {/* Virtualized List */}
        <List
          height={500}
          itemCount={filteredIssues.length}
          itemSize={120}
          width="100%"
          className="w-full"
          outerElementType="div"
          innerElementType="ul"
          role="listbox"
          aria-label="SEO Issues Virtual List"
        >
          {({ index, style }) => {
            const issue = filteredIssues[index];
            return (
              <li style={style} key={issue.id} role="option" aria-selected="false" aria-label={issue.title} tabIndex={0} className="border-b last:border-b-0 bg-background/80 hover:bg-accent/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-2 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${severityColors[issue.severity]}`}>{issue.severity}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">{issue.category}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColors[issue.status]}`}>{issue.status}</span>
                    </div>
                    <div className="font-medium text-sm truncate" title={issue.title}>{issue.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 mb-1 max-w-2xl whitespace-pre-line break-words line-clamp-2" title={issue.description}>
                      {issue.description}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.affectedElements.map((el, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{el}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 items-center mt-2 md:mt-0">
                    <Button size="xs" variant="success" onClick={() => onIssueAction(issue.id, 'fixed')} aria-label={`Mark ${issue.title} as fixed`} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
                      <Check className="h-4 w-4" /> Fixed
                    </Button>
                    <Button size="xs" variant="destructive" onClick={() => onIssueAction(issue.id, 'ignored')} aria-label={`Ignore ${issue.title}`} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
                      <X className="h-4 w-4" /> Ignore
                    </Button>
                  </div>
                </div>
              </li>
            );
          }}
        </List>
      </CardContent>
    </Card>
  );
}
