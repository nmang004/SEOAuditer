import { CheckCircle } from "lucide-react";
import { EmptyState } from "./empty-state";

interface NoIssuesStateProps {
  className?: string;
  title?: string;
  description?: string;
}

export function NoIssuesState({ 
  className,
  title = "No Issues Found",
  description = "Great job! Your website is looking good with no critical issues detected."
}: NoIssuesStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={
        <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      }
      variant="card"
      className={className}
    />
  );
}
