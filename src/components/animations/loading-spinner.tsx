import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <m.span
        className={cn(
          'block rounded-full border-t-transparent',
          'border-primary-500 border-opacity-20',
          sizeMap[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <span className="sr-only">Loading...</span>
      </m.span>
      <m.span
        className={cn(
          'absolute rounded-full border-t-primary-500',
          'border-2 border-opacity-20',
          sizeMap[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          ease: 'linear',
          repeat: Infinity,
          delay: 0.3,
        }}
      />
    </div>
  );
}
