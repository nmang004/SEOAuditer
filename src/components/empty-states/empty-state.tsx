import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The title of the empty state */
  title: string;
  /** The description providing more context */
  description: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Additional content to display below the action button */
  footer?: React.ReactNode;
  /** Whether to use a card style */
  variant?: 'default' | 'card';
  /** Optional class name for the icon container */
  iconClassName?: string;
  /** Optional class name for the content container */
  contentClassName?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  footer,
  variant = 'default',
  className,
  iconClassName,
  contentClassName,
  ...props
}: EmptyStateProps) {
  const containerClasses = cn(
    'flex flex-col items-center justify-center text-center',
    variant === 'card' && 'rounded-lg border border-dashed p-8',
    className
  );

  return (
    <div className={containerClasses} {...props}>
      {icon && (
        <div className={cn('mb-4 text-muted-foreground', iconClassName)}>
          {icon}
        </div>
      )}
      <div className={cn('max-w-md', contentClassName)}>
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        )}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}
