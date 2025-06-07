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
    variant === 'card' && 'rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12',
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
        <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{title}</h3>
        <p className="text-gray-300 mb-8 text-lg leading-relaxed">{description}</p>
        {action && (
          <Button 
            onClick={action.onClick}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-8"
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        )}
        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </div>
  );
}
