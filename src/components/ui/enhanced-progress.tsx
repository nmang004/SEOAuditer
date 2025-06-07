import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, CheckCircle, Loader2, TrendingUp, Zap, AlertTriangle, Pause, Play } from "lucide-react";

export interface ProgressProps {
  value: number;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showPercentage?: boolean;
  className?: string;
  estimatedTimeRemaining?: number;
  currentStep?: string;
  totalSteps?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    value, 
    variant = 'default', 
    size = 'md', 
    animated = false,
    showPercentage = true,
    className,
    estimatedTimeRemaining,
    currentStep,
    totalSteps,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = useState(0);
    const animationRef = useRef<number>();

    // Smooth progress animation
    useEffect(() => {
      const targetValue = Math.min(100, Math.max(0, value));
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const startValue = displayValue;
      const diff = targetValue - startValue;
      const duration = 800; // 800ms animation
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newValue = startValue + (diff * easeOut);
        
        setDisplayValue(newValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [value, displayValue]);

    const getVariantStyles = (variant: string) => {
      switch (variant) {
        case 'success':
          return 'bg-green-500 shadow-green-500/30';
        case 'danger':
          return 'bg-red-500 shadow-red-500/30';
        case 'warning':
          return 'bg-yellow-500 shadow-yellow-500/30';
        case 'info':
          return 'bg-blue-500 shadow-blue-500/30';
        default:
          return 'bg-primary shadow-primary/30';
      }
    };

    const getSizeStyles = (size: string) => {
      switch (size) {
        case 'sm':
          return 'h-2';
        case 'lg':
          return 'h-4';
        default:
          return 'h-3';
      }
    };

    const formatTime = (ms: number): string => {
      const seconds = Math.ceil(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.ceil(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.ceil(minutes / 60);
      return `${hours}h`;
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {(showPercentage || estimatedTimeRemaining || currentStep) && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {currentStep && (
                <span className="text-muted-foreground">
                  {currentStep}
                  {totalSteps && ` (${Math.ceil((displayValue / 100) * totalSteps)}/${totalSteps})`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {showPercentage && (
                <span className="font-medium">
                  {Math.round(displayValue)}%
                </span>
              )}
              {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                <span className="text-xs">
                  ~{formatTime(estimatedTimeRemaining)} left
                </span>
              )}
            </div>
          </div>
        )}
        
        <div 
          className={cn(
            'w-full overflow-hidden rounded-full bg-muted',
            getSizeStyles(size)
          )}
        >
          <motion.div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              getVariantStyles(variant),
              animated && 'shadow-lg'
            )}
            initial={{ width: 0 }}
            animate={{ 
              width: `${displayValue}%`,
              boxShadow: animated ? '0 0 20px rgba(var(--primary), 0.3)' : undefined
            }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
            }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

// Real-time Analysis Progress Component
export interface AnalysisProgressProps {
  jobId: string;
  progress: {
    percentage: number;
    stage: string;
    details: string;
    currentStep?: string;
    totalSteps?: number;
    stepProgress?: number;
    estimatedTimeRemaining?: number;
    queuePosition?: number;
    processingTime?: number;
  };
  className?: string;
  showDetails?: boolean;
  showQueue?: boolean;
  showSteps?: boolean;
  size?: "sm" | "md" | "lg";
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const AnalysisProgress = React.forwardRef<
  HTMLDivElement,
  AnalysisProgressProps
>(({ 
  jobId,
  progress,
  className,
  showDetails = true,
  showQueue = true,
  showSteps = true,
  size = "md",
  onComplete,
  onError,
  ...props 
}, ref) => {
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (progress.stage === 'completed' && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
    
    if (progress.stage === 'failed' || progress.stage === 'error') {
      setHasError(true);
      onError?.(progress.details);
    }
  }, [progress.stage, isComplete, onComplete, onError, progress.details]);

  const getStageIcon = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'queued':
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'active':
      case 'analyzing':
      case 'crawling':
      case 'scoring':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-orange-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-primary" />;
    }
  };

  const getVariant = (stage: string, percentage: number): ProgressProps['variant'] => {
    if (stage.toLowerCase() === 'completed') return 'success';
    if (stage.toLowerCase() === 'failed' || stage.toLowerCase() === 'error') return 'danger';
    if (stage.toLowerCase() === 'queued' || stage.toLowerCase() === 'waiting') return 'warning';
    if (percentage > 75) return 'success';
    if (percentage > 25) return 'info';
    return 'default';
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'queued':
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
      case 'analyzing':
      case 'crawling':
      case 'scoring':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatQueueMessage = () => {
    if (!showQueue || !progress.queuePosition) return null;
    
    const position = progress.queuePosition;
    if (position === 0) return null;
    
    const timeText = progress.estimatedTimeRemaining 
      ? ` (${Math.round(progress.estimatedTimeRemaining / 60000)}min wait)`
      : '';
    
    return `Position ${position} in queue${timeText}`;
  };

  const formatProcessingTime = () => {
    if (!progress.processingTime) return null;
    
    const seconds = Math.floor(progress.processingTime / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {/* Header with stage and details */}
      {showDetails && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStageIcon(progress.stage)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium capitalize">
                  {progress.currentStep || progress.stage.replace('_', ' ')}
                </h4>
                <div 
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium border",
                    getStageBadgeColor(progress.stage)
                  )}
                >
                  {progress.stage}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">
                  {Math.round(progress.percentage)}%
                </span>
                {progress.processingTime && (
                  <span>• {formatProcessingTime()}</span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {progress.details}
            </p>
            
            {/* Queue position */}
            <AnimatePresence>
              {formatQueueMessage() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-2"
                >
                  <Clock className="w-3 h-3" />
                  {formatQueueMessage()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing statistics */}
            {(progress.totalSteps || progress.estimatedTimeRemaining) && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                {progress.totalSteps && (
                  <span>
                    Step {Math.ceil((progress.percentage / 100) * progress.totalSteps)} of {progress.totalSteps}
                  </span>
                )}
                {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    ~{Math.round(progress.estimatedTimeRemaining / 60000)}m remaining
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main progress bar */}
      <Progress
        value={progress.percentage}
        variant={getVariant(progress.stage, progress.percentage)}
        size={size}
        animated={progress.stage !== 'completed' && progress.stage !== 'failed'}
        estimatedTimeRemaining={progress.estimatedTimeRemaining}
        currentStep={showSteps ? progress.currentStep : undefined}
        totalSteps={showSteps ? progress.totalSteps : undefined}
        className="transition-all duration-300"
      />

      {/* Step progress if available */}
      <AnimatePresence>
        {showSteps && progress.stepProgress !== undefined && progress.currentStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current Step Progress</span>
              <span>{Math.round(progress.stepProgress)}%</span>
            </div>
            <Progress
              value={progress.stepProgress}
              variant="info"
              size="sm"
              animated
              showPercentage={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion celebration */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Analysis Complete!</p>
              <p className="text-xs text-green-700">Your SEO analysis has finished successfully.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Analysis Failed</p>
              <p className="text-xs text-red-700">{progress.details}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AnalysisProgress.displayName = "AnalysisProgress";

// Multi-step Progress Component
export interface MultiStepProgressProps {
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    progress?: number;
  }>;
  currentStep?: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
}

export const MultiStepProgress = React.forwardRef<
  HTMLDivElement,
  MultiStepProgressProps
>(({ 
  steps, 
  currentStep = 0, 
  className, 
  orientation = 'horizontal',
  showDescriptions = true,
  ...props 
}, ref) => {
  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'active':
        return <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">{index + 1}</div>;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center font-medium">{index + 1}</div>;
    }
  };

  const getStepLineColor = (step: any, nextStep: any) => {
    if (step.status === 'completed') return 'bg-green-600';
    if (step.status === 'active' && nextStep && nextStep.status !== 'pending') return 'bg-blue-600';
    return 'bg-gray-300';
  };

  if (orientation === 'vertical') {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {getStepIcon(step.status, index)}
              {index < steps.length - 1 && (
                <div className={cn("w-0.5 h-8 mt-2", getStepLineColor(step, steps[index + 1]))} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "text-sm font-medium",
                step.status === 'completed' ? 'text-green-900' :
                step.status === 'failed' ? 'text-red-900' :
                step.status === 'active' ? 'text-blue-900' : 'text-gray-500'
              )}>
                {step.label}
              </h4>
              {showDescriptions && step.description && (
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              )}
              {step.status === 'active' && step.progress !== undefined && (
                <div className="mt-2">
                  <Progress value={step.progress} size="sm" animated />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              {getStepIcon(step.status, index)}
              <span className={cn(
                "text-xs font-medium mt-1 text-center",
                step.status === 'completed' ? 'text-green-900' :
                step.status === 'failed' ? 'text-red-900' :
                step.status === 'active' ? 'text-blue-900' : 'text-gray-500'
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2", getStepLineColor(step, steps[index + 1]))} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {showDescriptions && (
        <div className="text-center">
          {steps.map((step, index) => 
            step.status === 'active' && step.description ? (
              <p key={step.id} className="text-sm text-muted-foreground">{step.description}</p>
            ) : null
          )}
        </div>
      )}
      
      {/* Active step progress */}
      {steps.some(step => step.status === 'active' && step.progress !== undefined) && (
        <div className="mt-4">
          {steps.map(step => 
            step.status === 'active' && step.progress !== undefined ? (
              <Progress key={step.id} value={step.progress} animated />
            ) : null
          )}
        </div>
      )}
    </div>
  );
});

MultiStepProgress.displayName = "MultiStepProgress";

// No need to re-export Progress here since it's already exported earlier 