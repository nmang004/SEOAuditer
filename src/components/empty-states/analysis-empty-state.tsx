import { BarChart, Play } from "lucide-react";
import { EmptyState } from "./empty-state";

interface AnalysisEmptyStateProps {
  onRunAnalysis: () => void;
  className?: string;
}

export function AnalysisEmptyState({ 
  onRunAnalysis, 
  className 
}: AnalysisEmptyStateProps) {
  return (
    <EmptyState
      title="No Analyses Yet"
      description="Run your first analysis to start tracking your website's SEO performance and identify areas for improvement."
      icon={
        <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
          <BarChart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      }
      action={{
        label: "Run Analysis",
        onClick: onRunAnalysis,
        icon: <Play className="h-4 w-4" />
      }}
      variant="card"
      className={className}
    />
  );
}
