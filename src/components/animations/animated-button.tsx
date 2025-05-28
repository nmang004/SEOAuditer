import { Button, ButtonProps } from '@/components/ui/button';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  hoverScale?: number;
  tapScale?: number;
}

export function AnimatedButton({
  children,
  className,
  isLoading = false,
  loadingText = 'Loading...',
  hoverScale = 1.02,
  tapScale = 0.98,
  disabled,
  ...props
}: AnimatedButtonProps) {
  return (
    <m.div
      whileHover={!disabled ? { scale: hoverScale } : {}}
      whileTap={!disabled ? { scale: tapScale } : {}}
      className="inline-block"
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 10,
      }}
    >
      <Button
        className={cn(
          'relative overflow-hidden',
          'transform transition-all duration-200',
          'hover:shadow-lg',
          'active:scale-95',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <m.span
            className="absolute inset-0 flex items-center justify-center bg-inherit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </m.span>
        )}
        <m.span
          animate={isLoading ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
          className="flex items-center"
        >
          {children}
        </m.span>
      </Button>
    </m.div>
  );
}
