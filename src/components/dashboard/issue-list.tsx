"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle,
  Check,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  Zap,
  X,
  ExternalLink,
  CalendarDays,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Core Types
type Severity = 'critical' | 'high' | 'medium' | 'low';
type Category = 'technical' | 'content' | 'onpage' | 'ux';
type QuickFixAction = 'mark_as_fixed' | 'dismiss' | 'schedule_fix';
type BulkAction = 'mark_all_fixed' | 'dismiss_all' | 'schedule_all' | 'ignore_all';

// Severity order for sorting
const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

// Using a simple div as a separator
const Separator = () => <div className="h-px w-full bg-border my-2" />;

interface SeverityDetails {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

interface EnhancedIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: 'open' | 'in-progress' | 'resolved';
  category: Category;
  detectedDate: string;
  affectedPages: number;
  estimatedImpact: string;
  fixComplexity: 'easy' | 'medium' | 'hard';
  projectId?: string;
  projectName?: string;
  url?: string;
  element?: string;
  codeSnippet?: string;
  recommendation?: string;
  documentationUrl?: string;
  isNew?: boolean;
  lastUpdated?: string;
  priority?: number;
  tags?: string[];
}

interface CheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

interface IssueListProps {
  issues: EnhancedIssue[];
  maxItems?: number;
  groupBy?: 'severity' | 'category' | 'project' | 'none';
  showFilters?: boolean;
  allowDismiss?: boolean;
  className?: string;
  onQuickFix?: (issueId: string, action: QuickFixAction) => void;
  onBulkAction?: (action: BulkAction, issueIds: string[]) => void;
}

// Helper to get severity details
function getSeverityDetails(severity: Severity): SeverityDetails {
  switch (severity) {
    case 'critical':
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        label: 'Critical'
      };
    case 'high':
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        color: 'text-amber-600 dark:text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-950/50',
        borderColor: 'border-amber-200 dark:border-amber-900',
        label: 'High'
      };
    case 'medium':
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        color: 'text-yellow-600 dark:text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
        borderColor: 'border-yellow-200 dark:border-yellow-900',
        label: 'Medium'
      };
    case 'low':
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        color: 'text-blue-600 dark:text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/50',
        borderColor: 'border-blue-200 dark:border-blue-900',
        label: 'Low'
      };
  }
}

// Helper to get category label
function getCategoryLabel(category: Category): string {
  switch (category) {
    case 'technical':
      return 'Technical';
    case 'content':
      return 'Content';
    case 'onpage':
      return 'On-Page';
    case 'ux':
      return 'User Experience';
    default:
      return String(category);
  }
}

// Helper to get complexity details
function getComplexityDetails(complexity: 'easy' | 'medium' | 'hard') {
  switch (complexity) {
    case 'easy':
      return {
        label: 'Easy Fix',
        color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-900'
      };
    case 'medium':
      return {
        label: 'Medium Effort',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-900'
      };
    case 'hard':
      return {
        label: 'Complex Fix',
        color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-900'
      };
  }
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Export types for backward compatibility
export type { EnhancedIssue, IssueListProps, Severity, Category, QuickFixAction, BulkAction };

export function IssueList({
  issues, 
  maxItems = 5, 
  groupBy = "severity",
  showFilters = true,
  allowDismiss = true,
  onQuickFix,
  onBulkAction,
  className = ''
}: IssueListProps) {
  // State variables
  const [selectedIssues, setSelectedIssues] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [dismissedIssues, setDismissedIssues] = useState<string[]>([]);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ issueId: string; action: BulkAction | QuickFixAction } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  
  // Helper functions
  const getActionLabel = (action: BulkAction | QuickFixAction): string => {
    switch (action) {
      case 'mark_all_fixed':
      case 'mark_as_fixed':
        return 'marked as fixed';
      case 'dismiss_all':
      case 'dismiss':
        return 'dismissed';
      case 'schedule_all':
      case 'schedule_fix':
        return 'scheduled';
      case 'ignore_all':
        return 'ignored';
      default:
        return String(action);
    }
  };
  
  // Toggle issue expansion
  const toggleIssue = (issueId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedIssues(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, issueId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpandedIssues(prev => ({
        ...prev,
        [issueId]: !prev[issueId]
      }));
    }
  };
  
  // Check if an issue is selected
  const isIssueSelected = (issueId: string): boolean => {
    return Boolean(selectedIssues[issueId]);
  };
  
  // Handle quick fix action
  const handleQuickFix = (issueId: string, action: QuickFixAction, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingAction({ issueId, action });
    setIsConfirmOpen(true);
  };
  
  // Execute quick fix action
  const executeQuickFix = async (issueId: string, action: QuickFixAction) => {
    try {
      setIsLoading(true);
      // Handle the quick fix action here
      if (onQuickFix) {
        await onQuickFix(issueId, action);
      }
      
      // Show success toast
      toast({
        title: "Action completed",
        description: `Successfully ${getActionLabel(action)} the issue.`,
      });
      
      // Remove from selected issues
      setSelectedIssues(prev => {
        const newState = { ...prev };
        delete newState[issueId];
        return newState;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your request. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
      setPendingAction(null);
    }
  };
  
  // Toggle issue selection
  const toggleIssueSelection = (id: string, checked: boolean | string): void => {
    // Convert string 'indeterminate' to boolean false
    const isChecked = checked === 'indeterminate' ? false : checked;
    setSelectedIssues(prev => {
      const newState = { ...prev };
      if (isChecked) {
        newState[id] = true;
      } else {
        delete newState[id];
      }
      return newState;
    });
  };

  // Toggle select all
  const toggleSelectAll = (checked: boolean | string): void => {
    const isChecked = checked === true || checked === 'true';
    const newSelectedIssues = { ...selectedIssues };
    
    // Only update the visible issues
    filteredIssues.forEach(issue => {
      newSelectedIssues[issue.id] = isChecked;
    });
    
    setSelectedIssues(newSelectedIssues);
    setSelectAll(isChecked);
  };
  
  // Filter out dismissed issues and apply severity filter
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue: EnhancedIssue) => !dismissedIssues.includes(issue.id))
      .filter((issue: EnhancedIssue) => {
        if (selectedSeverities.length === 0) return true;
        return selectedSeverities.includes(issue.severity);
      })
      .filter((issue: EnhancedIssue) => {
        if (selectedCategories.length === 0) return true;
        return selectedCategories.includes(issue.category);
      });
  }, [issues, dismissedIssues, selectedSeverities, selectedCategories]);
  
  // Sort issues by severity (critical first)
  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    });
  }, [filteredIssues]);
  
  // Group issues based on groupBy parameter
  const groupedIssues = useMemo(() => {
    const groups: Record<string, EnhancedIssue[]> = {};
    
    if (groupBy === 'none') {
      groups['all'] = sortedIssues.slice(0, maxItems);
    } else {
      sortedIssues.slice(0, maxItems).forEach(issue => {
        const groupKey = issue[groupBy as keyof EnhancedIssue] as string;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(issue);
      });
    }
    
    return groups;
  }, [sortedIssues, groupBy, maxItems]);
  
  // Get selected issue count
  const selectedIssueCount = Object.values(selectedIssues).filter(Boolean).length;
  
  // Sort groups by priority (for severity) or alphabetically
  const sortedGroups = Object.keys(groupedIssues).sort((a, b) => {
    if (groupBy === "severity") {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a as keyof typeof severityOrder] - severityOrder[b as keyof typeof severityOrder];
    }
    return a.localeCompare(b);
  });

  // Check if an issue is expanded
  const isExpanded = (id: string): boolean => Boolean(expandedIssues[id]);
  
  // Handle bulk actions
  const handleBulkAction = (action: BulkAction) => {
    const selectedIssueIds = Object.entries(selectedIssues)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);
      
    if (selectedIssueIds.length === 0) return;

    // Show confirmation for destructive actions
    if (['dismiss_all', 'mark_all_fixed'].includes(action)) {
      setPendingAction({ issueId: '', action });
      setShowConfirmation(true);
      return;
    }

    // For non-destructive actions, proceed immediately
    executeBulkAction(action);
  };
  
  // Execute bulk action after confirmation
  const executeBulkAction = (action: BulkAction) => {
    try {
      const issueIds = Object.keys(selectedIssues).filter(id => selectedIssues[id]);

      switch (action) {
        case 'dismiss_all':
          setDismissedIssues(prev => [...prev, ...issueIds]);
          break;
        case 'mark_all_fixed':
          // Handle marking as fixed
          break;
        case 'schedule_all':
          // Handle scheduling fixes
          break;
        case 'ignore_all':
          // Handle ignoring issues
          break;
      }

      // Call the onBulkAction callback if provided
      if (onBulkAction) {
        onBulkAction(action, issueIds);
      }

      // Reset selection
      setSelectedIssues({});
      setSelectAll(false);
      setBulkActionOpen(false);
      
      // Show success toast
      toast({
        title: "Action completed",
        description: `Successfully ${getActionLabel(action)} ${issueIds.length} issues.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your request. Please try again.",
      });
    }
  };
  
  // Confirmation Dialog
  const ConfirmationDialog = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-2">Confirm Action</h3>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to {getActionLabel(pendingAction?.action || 'dismiss')} this issue? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsConfirmOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              if (pendingAction) {
                if (pendingAction.issueId) {
                  // Single issue action
                  executeQuickFix(pendingAction.issueId, pendingAction.action as QuickFixAction);
                } else {
                  // Bulk action
                  executeBulkAction(pendingAction.action as BulkAction);
                }
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
  
  // Error boundary fallback UI
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => setError(null)}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Main render function
  const renderIssueList = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
        hidden: { opacity: 0 }
      }}
      className={className}
    >
      {isConfirmOpen && <ConfirmationDialog />}
      
      <Card className="border-none bg-gradient-to-br from-background/80 to-background/30 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showFilters && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setSelectAll(isChecked);
                      toggleSelectAll(isChecked);
                    }}
                    className="h-4 w-4 rounded"
                  />
                  <label 
                    htmlFor="select-all" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select all
                  </label>
                </div>
              )}
              <CardTitle className="text-xl font-bold">
                Latest Issues
                {selectedIssueCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({selectedIssueCount} selected)
                  </span>
                )}
              </CardTitle>
            </div>
            
            {showFilters && (
              <div className="flex items-center space-x-2">
                {selectedIssueCount > 0 && (
                  <DropdownMenu open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-xs">Bulk Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('mark_all_fixed')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>Mark as Fixed</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('dismiss_all')}>
                        <CheckSquare className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Dismiss Selected</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('schedule_all')}>
                        <CalendarDays className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>Schedule Fix</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleBulkAction('ignore_all')}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Ignore Selected</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Severity filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Filter className="w-3 h-3" />
                      <span className="text-xs">Severity</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("critical" as Severity)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedSeverities(prev => [...prev, "critical" as Severity]);
                        } else {
                          setSelectedSeverities(prev => prev.filter(s => s !== "critical"));
                        }
                      }}
                    >
                      Critical
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("high" as Severity)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedSeverities(prev => [...prev, "high" as Severity]);
                        } else {
                          setSelectedSeverities(prev => prev.filter(s => s !== "high"));
                        }
                      }}
                    >
                      High
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("medium" as Severity)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedSeverities(prev => [...prev, "medium" as Severity]);
                        } else {
                          setSelectedSeverities(prev => prev.filter(s => s !== "medium"));
                        }
                      }}
                    >
                      Medium
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("low" as Severity)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedSeverities(prev => [...prev, "low" as Severity]);
                        } else {
                          setSelectedSeverities(prev => prev.filter(s => s !== "low"));
                        }
                      }}
                    >
                      Low
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Category filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Filter className="w-3 h-3" />
                      <span className="text-xs">Category</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={selectedCategories.includes("technical" as Category)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedCategories(prev => [...prev, "technical" as Category]);
                        } else {
                          setSelectedCategories(prev => prev.filter(c => c !== "technical"));
                        }
                      }}
                    >
                      Technical
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedCategories.includes("content" as Category)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedCategories(prev => [...prev, "content" as Category]);
                        } else {
                          setSelectedCategories(prev => prev.filter(c => c !== "content"));
                        }
                      }}
                    >
                      Content
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedCategories.includes("onpage" as Category)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedCategories(prev => [...prev, "onpage" as Category]);
                        } else {
                          setSelectedCategories(prev => prev.filter(c => c !== "onpage"));
                        }
                      }}
                    >
                      On-Page
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedCategories.includes("ux" as Category)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedCategories(prev => [...prev, "ux" as Category]);
                        } else {
                          setSelectedCategories(prev => prev.filter(c => c !== "ux"));
                        }
                      }}
                    >
                      User Experience
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-12 h-12 mb-3 text-success opacity-50" />
              <h3 className="text-lg font-medium">No issues found</h3>
              <p className="text-sm text-muted-foreground">
                Great job! Your site is performing well.
              </p>
            </div>
          ) : (
            sortedGroups.map(group => (
              <div key={group} className="space-y-2">
                {groupBy !== 'none' && (
                  <h3 className="text-sm font-medium">
                    {group}
                  </h3>
                )}
                
                {groupedIssues[group].map((issue: EnhancedIssue) => {
                  const severityDetails = getSeverityDetails(issue.severity);
                  const complexityDetails = getComplexityDetails(issue.fixComplexity);
                  
                  return (
                    <motion.div
                      key={issue.id}
                      variants={fadeInUp}
                      className={cn(
                        "overflow-hidden border rounded-lg shadow-sm bg-background/50 transition-colors",
                        selectedIssues[issue.id] && "ring-2 ring-primary/50 border-primary/30"
                      )}
                    >
                      {/* Issue header */}
                      <div 
                        className="flex items-start p-3 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => toggleIssue(issue.id, e)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, issue.id)}
                        aria-expanded={expandedIssues[issue.id] || false}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center">
                            <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Checkbox 
                                id={`select-${issue.id}`}
                                checked={isIssueSelected(issue.id)}
                                onCheckedChange={(checked: boolean) => {
                                  toggleIssueSelection(issue.id, checked);
                                }}
                                className="h-4 w-4 rounded mr-2"
                                aria-label={`Select issue: ${issue.title}`}
                              />
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 px-2 py-0.5 transition-all ${severityDetails.color} ${
                                isIssueSelected(issue.id) ? 'opacity-100' : 'group-hover:opacity-100 opacity-90'
                              }`}
                            >
                              {severityDetails.icon}
                              <span className="text-xs">{severityDetails.label}</span>
                            </Badge>
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium truncate pr-2">
                                {issue.title}
                              </h4>
                              <div className="flex-shrink-0 flex items-center gap-1">
                                {issue.fixComplexity === 'easy' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-6 text-xs gap-1 px-2"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                      e.stopPropagation();
                                      handleQuickFix(issue.id, 'mark_as_fixed' as QuickFixAction, e);
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Quick Fix</span>
                                  </Button>
                                )}
                                {allowDismiss && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6 text-muted-foreground hover:text-destructive"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                      e.stopPropagation();
                                      handleQuickFix(issue.id, 'dismiss' as QuickFixAction, e);
                                    }}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span className="sr-only">Dismiss</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="secondary" 
                                className="text-xs font-normal"
                              >
                                {getCategoryLabel(issue.category)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {issue.affectedPages} {issue.affectedPages === 1 ? 'page' : 'pages'}
                              </span>
                              {issue.fixComplexity && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs font-normal",
                                    complexityDetails.color
                                  )}
                                >
                                  {complexityDetails.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded(issue.id) ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Expanded issue details */}
                      {isExpanded(issue.id) && (
                        <div className="p-3 pt-0 border-t">
                          <p className="text-sm text-muted-foreground mb-3">
                            {issue.description}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground">Estimated Impact</h5>
                              <p className="text-sm">{issue.estimatedImpact}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground">Fix Complexity</h5>
                              <Badge variant="outline" className={cn("mt-1", complexityDetails.color)}>
                                {complexityDetails.label}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-1 h-8"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                // Handle view affected pages
                              }}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="text-xs">View Pages</span>
                            </Button>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 h-8 flex-1"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  handleQuickFix(issue.id, 'schedule_fix' as QuickFixAction, e);
                                }}
                              >
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span className="text-xs">Schedule</span>
                              </Button>
                              
                              <Button 
                                size="sm" 
                                className="gap-1 h-8 flex-1"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  handleQuickFix(issue.id, 'mark_as_fixed' as QuickFixAction, e);
                                }}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="text-xs">Mark Fixed</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}
        </CardContent>
        
        <CardFooter className="pt-2">
          <Button variant="ghost" className="w-full justify-center" size="sm">
            View All Issues
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default IssueList;