import { FilePlus } from "lucide-react";
import { EmptyState } from "./empty-state";

interface ProjectEmptyStateProps {
  onCreateProject: () => void;
  className?: string;
}

export function ProjectEmptyState({ 
  onCreateProject, 
  className 
}: ProjectEmptyStateProps) {
  return (
    <EmptyState
      title="No Projects Yet"
      description="Get started by creating your first project to analyze your website's SEO performance."
      icon={
        <div className="rounded-full bg-primary/10 p-4">
          <FilePlus className="h-8 w-8 text-primary" />
        </div>
      }
      action={{
        label: "Create Project",
        onClick: onCreateProject,
        icon: <FilePlus className="h-4 w-4" />
      }}
      variant="card"
      className={className}
    />
  );
}
