import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, ArrowUpRight, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RecommendationsPanelProps, Recommendation } from '@/lib/analysis-types';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
} as const;

export const RecommendationsPanel = React.memo(function RecommendationsPanel({ recommendations, maxVisible, allowCustomOrder, showProgress }: RecommendationsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [customOrder, setCustomOrder] = useState<string[]>(recommendations.map(r => r.id));
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  // Priority sorting
  const sorted = [...recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
  let visible = sorted;
  if (activeFilter !== 'all') visible = visible.filter(r => r.priority === activeFilter);
  if (maxVisible) visible = visible.slice(0, maxVisible);
  if (allowCustomOrder) visible = customOrder.map(id => recommendations.find(r => r.id === id)!).filter(Boolean);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);
  const toggleComplete = (id: string) => setCompleted(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Time/impact matrix (simple legend)
  const renderMatrix = (rec: Recommendation) => (
    <div className="flex gap-2 text-xs mt-2">
      <span className="font-semibold">Impact:</span> <Badge>{rec.estimatedImpact}</Badge>
      <span className="font-semibold">Time:</span> <Badge>{rec.timeToImplement}</Badge>
      <span className="font-semibold">Difficulty:</span> <Badge>{rec.difficulty}</Badge>
    </div>
  );

  // Custom prioritization (up/down)
  const move = (id: string, dir: -1 | 1) => {
    setCustomOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const arr = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= arr.length) return arr;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return arr;
    });
  };

  // Add export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(recommendations);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'seo-recommendations.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('SEO Recommendations', 10, 10);
    recommendations.slice(0, 40).forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec.title} [${rec.priority}]`, 10, 20 + i * 7);
    });
    doc.save('seo-recommendations.pdf');
  };

  return (
    <Card className="h-full" role="region" aria-label="SEO Recommendations Panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
        <div className="flex items-center space-x-2">
          {['all', 'high', 'medium', 'low'].map(p => (
            <Button
              key={p}
              variant={activeFilter === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(p as any)}
              className="h-7 text-xs"
            >
              {typeof p === 'string' ? p.charAt(0).toUpperCase() + p.slice(1) : p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex gap-2 p-2 border-b bg-muted/10">
          <Button size="xs" variant="outline" onClick={handleExportCSV} aria-label="Export recommendations as CSV">Export CSV</Button>
          <Button size="xs" variant="outline" onClick={handleExportPDF} aria-label="Export recommendations as PDF">Export PDF</Button>
        </div>
        <div className="space-y-1">
          {visible.length > 0 ? (
            visible.map((rec, idx) => (
              <div key={rec.id} className="border-b last:border-b-0">
                <div className="flex items-center gap-2 p-2">
                  {allowCustomOrder && (
                    <div className="flex flex-col gap-1">
                      <Button size="xs" variant="ghost" onClick={() => move(rec.id, -1)} disabled={idx === 0}>↑</Button>
                      <Button size="xs" variant="ghost" onClick={() => move(rec.id, 1)} disabled={idx === visible.length - 1}>↓</Button>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-3 min-h-[28px]">
                      <h3 className="font-medium text-base leading-tight">{rec.title}</h3>
                      <Badge variant="outline" className={`text-xs ${priorityColors[rec.priority]}`}>{rec.priority}</Badge>
                      {completed.has(rec.id) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug mb-1">{rec.description}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs mt-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-muted-foreground">Impact:</span>
                        <span className="text-foreground">{rec.estimatedImpact}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-muted-foreground">Time:</span>
                        <span className="text-foreground">{rec.timeToImplement}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-muted-foreground">Difficulty:</span>
                        <span className="text-foreground">{rec.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="xs" variant="ghost" onClick={() => toggleExpand(rec.id)}>
                    {expandedId === rec.id ? 'Hide' : 'Details'}
                  </Button>
                </div>
                {expandedId === rec.id && (
                  <div className="px-4 pb-4 pt-2 bg-accent/30">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2">Implementation Steps</h4>
                      <ol className="space-y-2 pl-4 text-sm">
                        {rec.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <input type="checkbox" checked={completed.has(`${rec.id}-step-${i}`)} onChange={() => toggleComplete(`${rec.id}-step-${i}`)} />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {rec.resources.map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />{res.title}
                        </a>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleComplete(rec.id)}>
                        <Check className="h-4 w-4 mr-2" />Mark as Complete
                      </Button>
                      <Button size="sm" variant="ghost">
                        <X className="h-4 w-4 mr-2" />Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">No recommendations found for the selected filter.</div>
          )}
        </div>
        {showProgress && (
          <div className="p-4" aria-label="Recommendations progress indicator">
            <Progress value={(completed.size / (visible.length * 2)) * 100} aria-valuenow={(completed.size / (visible.length * 2)) * 100} aria-valuemin={0} aria-valuemax={100} />
            <div className="text-xs text-muted-foreground mt-1">Progress: {completed.size} steps completed</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
