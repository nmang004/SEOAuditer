'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnalysisProgress, MultiStepProgress } from '@/components/ui/enhanced-progress';
import { useAnalysisProgress } from '@/hooks/useAnalysisProgress';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  RefreshCw, 
  WifiOff, 
  Wifi, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  ExternalLink,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

export interface RealTimeAnalysisProps {
  jobId: string;
  projectId: string;
  className?: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
  showSteps?: boolean;
  showQueue?: boolean;
  autoNavigateOnComplete?: boolean;
}

export function RealTimeAnalysis({
  jobId,
  projectId,
  className,
  onComplete,
  onError,
  showSteps = true,
  showQueue = true,
  autoNavigateOnComplete = false,
}: RealTimeAnalysisProps) {
  const { user } = useAuth();
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const resultsRef = useRef<any>(null);

  // Fetch results manually for fallback
  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/analysis/results/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.results) {
          setAnalysisResults(data.results);
          resultsRef.current = data.results;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch results:', error);
    }
  }, [jobId]);

  const {
    state,
    subscribe,
    unsubscribe,
    reconnect,
    getStatus,
    isLoading,
    canRetry
  } = useAnalysisProgress({
    autoReconnect: true,
    maxReconnectAttempts: 10,
    fallbackPolling: true,
    onProgress: useCallback((progress: any) => {
      setLastUpdate(new Date());
      
      // If we get a high progress percentage, try to prefetch results
      if (progress.percentage > 90 && !resultsRef.current) {
        fetchResults();
      }
    }, [fetchResults]),
    onCompleted: useCallback((event: any) => {
      setAnalysisResults(event.data);
      resultsRef.current = event.data;
      setLastUpdate(new Date());
      onComplete?.(event.data);
      
      if (autoNavigateOnComplete) {
        setTimeout(() => {
          window.location.href = `/dashboard/projects/${projectId}/analyses/${jobId}`;
        }, 2000);
      }
    }, [onComplete, autoNavigateOnComplete, projectId, jobId]),
    onError: useCallback((event: any) => {
      onError?.(event.data?.message || 'Analysis failed');
    }, [onError]),
    onStepChange: useCallback((event: any) => {
      setLastUpdate(new Date());
    }, []),
    onQueueUpdate: useCallback((update: any) => {
      setLastUpdate(new Date());
    }, [])
  });

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    setIsManualRefresh(true);
    try {
      await getStatus(jobId);
      if (state.progress?.percentage === 100 || state.progress?.stage === 'completed') {
        await fetchResults();
      }
    } finally {
      setIsManualRefresh(false);
    }
  }, [getStatus, jobId, state.progress, fetchResults]);

  // Connection retry handler
  const handleRetryConnection = useCallback(async () => {
    setConnectionRetries(prev => prev + 1);
    await reconnect();
  }, [reconnect]);

  // Subscribe to analysis updates
  useEffect(() => {
    if (jobId && user) {
      subscribe(jobId);
      
      // Get initial status
      getStatus(jobId);
    }

    return () => {
      unsubscribe();
    };
  }, [jobId, user, subscribe, unsubscribe, getStatus]);

  // Define analysis steps
  const analysisSteps = [
    {
      id: 'queued',
      label: 'Queued',
      description: 'Analysis queued for processing',
      status: getStepStatus('queued', state.progress?.stage)
    },
    {
      id: 'initializing',
      label: 'Initializing',
      description: 'Setting up analysis environment',
      status: getStepStatus('initializing', state.progress?.stage)
    },
    {
      id: 'crawling',
      label: 'Crawling',
      description: 'Fetching page content and resources',
      status: getStepStatus('crawling', state.progress?.stage),
      progress: state.progress?.stage === 'crawling' ? state.progress?.stepProgress : undefined
    },
    {
      id: 'analyzing',
      label: 'Analyzing',
      description: 'Analyzing content and structure',
      status: getStepStatus('analyzing', state.progress?.stage),
      progress: state.progress?.stage === 'analyzing' ? state.progress?.stepProgress : undefined
    },
    {
      id: 'scoring',
      label: 'Scoring',
      description: 'Calculating SEO scores',
      status: getStepStatus('scoring', state.progress?.stage)
    },
    {
      id: 'generating_recommendations',
      label: 'Recommendations',
      description: 'Generating improvement suggestions',
      status: getStepStatus('generating_recommendations', state.progress?.stage)
    },
    {
      id: 'storing_results',
      label: 'Finalizing',
      description: 'Storing analysis results',
      status: getStepStatus('storing_results', state.progress?.stage)
    },
    {
      id: 'completed',
      label: 'Complete',
      description: 'Analysis completed successfully',
      status: getStepStatus('completed', state.progress?.stage)
    }
  ];

  function getStepStatus(stepId: string, currentStage?: string): 'pending' | 'active' | 'completed' | 'failed' {
    if (!currentStage) return 'pending';
    
    const stepOrder = ['queued', 'initializing', 'crawling', 'analyzing', 'scoring', 'generating_recommendations', 'storing_results', 'completed'];
    const currentIndex = stepOrder.indexOf(currentStage);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (currentStage === 'failed' || currentStage === 'error') {
      return stepIndex <= currentIndex ? 'failed' : 'pending';
    }
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }

  const isConnectionHealthy = state.isConnected && state.isAuthenticated;
  const hasProgress = state.progress !== null;
  const isComplete = state.progress?.stage === 'completed' || analysisResults !== null;
  const hasFailed = state.progress?.stage === 'failed' || state.progress?.stage === 'error';

  return (
    <div className={cn("space-y-6", className)}>
      {/* Connection Status */}
      <Card className={cn(
        "border transition-all duration-300",
        !isConnectionHealthy ? "border-yellow-300 bg-yellow-50" : 
        hasProgress ? "border-green-300 bg-green-50" : "border-blue-300 bg-blue-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isConnectionHealthy ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">
                  {isConnectionHealthy ? 'Real-time Connected' : 'Connection Issues'}
                </span>
              </div>
              
              {lastUpdate && (
                <Badge variant="outline" className="text-xs">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </Badge>
              )}
              
              {connectionRetries > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Retries: {connectionRetries}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {!isConnectionHealthy && canRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetryConnection}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
                  Retry
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleManualRefresh}
                disabled={isManualRefresh}
              >
                <RefreshCw className={cn("w-3 h-3", isManualRefresh && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      <AnimatePresence mode="wait">
        {hasProgress ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Analysis Progress
                  <Badge variant={isComplete ? "default" : "secondary"}>
                    {isComplete ? 'Completed' : 'In Progress'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AnalysisProgress
                  jobId={jobId}
                  progress={{
                    percentage: state.progress?.percentage || 0,
                    stage: state.progress?.stage || 'unknown',
                    details: state.progress?.details || 'Waiting for updates...',
                    currentStep: state.progress?.currentStep,
                    totalSteps: state.progress?.totalSteps,
                    stepProgress: state.progress?.stepProgress,
                    estimatedTimeRemaining: state.progress?.estimatedTimeRemaining,
                    queuePosition: state.progress?.queuePosition,
                    processingTime: state.progress?.processingTime
                  }}
                  showDetails={true}
                  showQueue={showQueue}
                  showSteps={showSteps}
                  onComplete={() => {
                    // Fetch results after a brief delay
                    setTimeout(fetchResults, 1000);
                  }}
                  onError={(error) => {
                    onError?.(error);
                  }}
                />

                {showSteps && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Analysis Steps</h4>
                      <MultiStepProgress
                        steps={analysisSteps}
                        orientation="vertical"
                        showDescriptions={true}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Waiting for Analysis</h3>
                    <p className="text-muted-foreground">
                      {isConnectionHealthy ? 
                        'Connected and waiting for analysis to start...' : 
                        'Connecting to analysis service...'
                      }
                    </p>
                  </div>
                  {state.error && (
                    <div className="flex items-center gap-2 justify-center text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{state.error}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      {isComplete && analysisResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <Button asChild className="flex-1">
            <a href={`/dashboard/projects/${projectId}/analyses/${jobId}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Results
            </a>
          </Button>
          
          <Button variant="outline" asChild>
            <a 
              href={`/dashboard/projects/${projectId}/analyses/${jobId}/export`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Export
            </a>
          </Button>
        </motion.div>
      )}

      {/* Error State */}
      {hasFailed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900">Analysis Failed</h3>
                  <p className="text-red-700 mt-1">
                    {state.progress?.details || state.error || 'The analysis encountered an error and could not complete.'}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Analysis
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => window.history.back()}
                    >
                      Go Back
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Stats */}
      {hasProgress && state.progress && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(state.progress.percentage)}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
              
              {state.progress.queuePosition && state.progress.queuePosition > 0 && (
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    #{state.progress.queuePosition}
                  </div>
                  <div className="text-xs text-muted-foreground">Queue Position</div>
                </div>
              )}
              
              {state.progress.estimatedTimeRemaining && (
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.ceil(state.progress.estimatedTimeRemaining / 60000)}m
                  </div>
                  <div className="text-xs text-muted-foreground">Est. Remaining</div>
                </div>
              )}
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  <Zap className="w-5 h-5 inline" />
                </div>
                <div className="text-xs text-muted-foreground">Real-time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 