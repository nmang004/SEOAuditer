import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebSocketClient, AnalysisProgress, AnalysisEvent, QueueUpdate } from '@/lib/websocket-client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface AnalysisProgressState {
  jobId: string | null;
  progress: AnalysisProgress | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isSubscribed: boolean;
  connectionAttempts: number;
  lastUpdate: Date | null;
}

export interface AnalysisProgressHookReturn {
  state: AnalysisProgressState;
  subscribe: (jobId: string) => void;
  unsubscribe: () => void;
  reconnect: () => Promise<void>;
  getStatus: (jobId: string) => void;
  isLoading: boolean;
  canRetry: boolean;
}

export interface UseAnalysisProgressOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  fallbackPolling?: boolean;
  onProgress?: (progress: AnalysisProgress) => void;
  onCompleted?: (event: AnalysisEvent) => void;
  onError?: (event: AnalysisEvent) => void;
  onStepChange?: (event: AnalysisEvent) => void;
  onQueueUpdate?: (update: QueueUpdate) => void;
}

export function useAnalysisProgress(options: UseAnalysisProgressOptions = {}): AnalysisProgressHookReturn {
  const { user, token } = useAuth();
  const wsClient = useRef(getWebSocketClient({
    autoReconnect: options.autoReconnect ?? true,
    maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
    fallbackPolling: options.fallbackPolling ?? true,
  }));

  const [state, setState] = useState<AnalysisProgressState>({
    jobId: null,
    progress: null,
    isConnected: false,
    isAuthenticated: false,
    error: null,
    isSubscribed: false,
    connectionAttempts: 0,
    lastUpdate: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update connection state from WebSocket client
  const updateConnectionState = useCallback(() => {
    const status = wsClient.current.getConnectionStatus();
    setState(prev => ({
      ...prev,
      isConnected: status.connected,
      isAuthenticated: status.authenticated,
      connectionAttempts: status.reconnectAttempts,
    }));
  }, []);

  // Initialize WebSocket connection
  const initializeConnection = useCallback(async () => {
    if (!token || !user) {
      logger.warn('Cannot initialize WebSocket: no token or user');
      return false;
    }

    try {
      setIsLoading(true);
      const connected = await wsClient.current.connect(token, user.id);
      updateConnectionState();
      
      if (connected) {
        setState(prev => ({ ...prev, error: null }));
        logger.info('WebSocket connected successfully');
      } else {
        setState(prev => ({ ...prev, error: 'Failed to connect to real-time service' }));
      }
      
      return connected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      logger.error('WebSocket connection failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, user, updateConnectionState]);

  // Subscribe to analysis job
  const subscribe = useCallback((jobId: string) => {
    if (!jobId) {
      logger.warn('Cannot subscribe: no job ID provided');
      return;
    }

    setState(prev => ({ ...prev, jobId, isSubscribed: true, error: null }));

    const callbacks = {
      onProgress: (progress: AnalysisProgress) => {
        setState(prev => ({
          ...prev,
          progress,
          lastUpdate: new Date(),
          error: null,
        }));
        
        options.onProgress?.(progress);
        logger.debug(`Progress update for job ${jobId}: ${progress.percentage}%`);
      },

      onCompleted: (event: AnalysisEvent) => {
        setState(prev => ({
          ...prev,
          progress: prev.progress ? {
            ...prev.progress,
            percentage: 100,
            stage: 'completed',
            details: 'Analysis completed successfully',
          } : null,
          lastUpdate: new Date(),
        }));
        
        options.onCompleted?.(event);
        logger.info(`Analysis ${jobId} completed`);
      },

      onError: (event: AnalysisEvent) => {
        const errorMessage = event.data?.message || 'Analysis failed';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          progress: prev.progress ? {
            ...prev.progress,
            stage: 'failed',
            details: errorMessage,
          } : null,
          lastUpdate: new Date(),
        }));
        
        options.onError?.(event);
        logger.error(`Analysis ${jobId} failed:`, errorMessage);
      },

      onStepChange: (event: AnalysisEvent) => {
        setState(prev => ({
          ...prev,
          progress: prev.progress ? {
            ...prev.progress,
            currentStep: event.data.currentStep,
            totalSteps: event.data.totalSteps,
            stepProgress: event.data.stepProgress,
            details: event.data.details,
          } : null,
          lastUpdate: new Date(),
        }));
        
        options.onStepChange?.(event);
        logger.debug(`Step change for job ${jobId}: ${event.data.currentStep}`);
      },

      onQueueUpdate: (update: QueueUpdate) => {
        setState(prev => ({
          ...prev,
          progress: prev.progress ? {
            ...prev.progress,
            queuePosition: update.position,
            estimatedTimeRemaining: update.estimatedWaitTime,
          } : null,
          lastUpdate: new Date(),
        }));
        
        options.onQueueUpdate?.(update);
        logger.debug(`Queue update for job ${jobId}: position ${update.position}`);
      },
    };

    wsClient.current.subscribeToAnalysis(jobId, callbacks);
    logger.info(`Subscribed to analysis progress for job ${jobId}`);
  }, [options]);

  // Unsubscribe from current analysis
  const unsubscribe = useCallback(() => {
    if (state.jobId && state.isSubscribed) {
      wsClient.current.unsubscribeFromAnalysis(state.jobId);
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        progress: null,
        error: null,
      }));
      logger.info(`Unsubscribed from analysis ${state.jobId}`);
    }
  }, [state.jobId, state.isSubscribed]);

  // Reconnect WebSocket
  const reconnect = useCallback(async () => {
    if (!token || !user) return;
    
    logger.info('Attempting to reconnect WebSocket...');
    setState(prev => ({ ...prev, error: null }));
    
    await initializeConnection();
    
    // Re-subscribe if we were subscribed before
    if (state.jobId && state.isSubscribed) {
      setTimeout(() => subscribe(state.jobId!), 1000);
    }
  }, [token, user, initializeConnection, state.jobId, state.isSubscribed, subscribe]);

  // Get current analysis status
  const getStatus = useCallback((jobId: string) => {
    wsClient.current.requestAnalysisStatus(jobId);
  }, []);

  // Setup connection event listeners
  useEffect(() => {
    const unsubscribeConnection = wsClient.current.onConnectionChange(updateConnectionState);
    const unsubscribeAuth = wsClient.current.onAuthChange(updateConnectionState);

    return () => {
      unsubscribeConnection();
      unsubscribeAuth();
    };
  }, [updateConnectionState]);

  // Initialize connection when auth changes
  useEffect(() => {
    if (token && user) {
      initializeConnection();
    }
    
    return () => {
      if (state.isSubscribed) {
        unsubscribe();
      }
    };
  }, [token, user, initializeConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isSubscribed) {
        unsubscribe();
      }
    };
  }, [state.isSubscribed, unsubscribe]);

  const canRetry = state.connectionAttempts < (options.maxReconnectAttempts ?? 10);

  return {
    state,
    subscribe,
    unsubscribe,
    reconnect,
    getStatus,
    isLoading,
    canRetry,
  };
}

// Hook for managing multiple analysis jobs
export interface MultiAnalysisProgressState {
  jobs: Map<string, AnalysisProgress>;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export function useMultiAnalysisProgress(options: UseAnalysisProgressOptions = {}) {
  const { user, token } = useAuth();
  const wsClient = useRef(getWebSocketClient({
    autoReconnect: options.autoReconnect ?? true,
    maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
    fallbackPolling: options.fallbackPolling ?? true,
  }));

  const [state, setState] = useState<MultiAnalysisProgressState>({
    jobs: new Map(),
    isConnected: false,
    isAuthenticated: false,
    error: null,
    lastUpdate: null,
  });

  const subscriptions = useRef(new Set<string>());

  const updateConnectionState = useCallback(() => {
    const status = wsClient.current.getConnectionStatus();
    setState(prev => ({
      ...prev,
      isConnected: status.connected,
      isAuthenticated: status.authenticated,
    }));
  }, []);

  const addJob = useCallback((jobId: string) => {
    if (subscriptions.current.has(jobId)) {
      return; // Already subscribed
    }

    subscriptions.current.add(jobId);

    const callbacks = {
      onProgress: (progress: AnalysisProgress) => {
        setState(prev => ({
          ...prev,
          jobs: new Map(prev.jobs).set(jobId, progress),
          lastUpdate: new Date(),
        }));
        options.onProgress?.(progress);
      },

      onCompleted: (event: AnalysisEvent) => {
        setState(prev => {
          const newJobs = new Map(prev.jobs);
          const currentProgress = newJobs.get(jobId);
          if (currentProgress) {
            newJobs.set(jobId, {
              ...currentProgress,
              percentage: 100,
              stage: 'completed',
              details: 'Analysis completed successfully',
            });
          }
          return { ...prev, jobs: newJobs, lastUpdate: new Date() };
        });
        options.onCompleted?.(event);
      },

      onError: (event: AnalysisEvent) => {
        setState(prev => {
          const newJobs = new Map(prev.jobs);
          const currentProgress = newJobs.get(jobId);
          if (currentProgress) {
            newJobs.set(jobId, {
              ...currentProgress,
              stage: 'failed',
              details: event.data?.message || 'Analysis failed',
            });
          }
          return { ...prev, jobs: newJobs, lastUpdate: new Date() };
        });
        options.onError?.(event);
      },

      onStepChange: options.onStepChange,
      onQueueUpdate: options.onQueueUpdate,
    };

    wsClient.current.subscribeToAnalysis(jobId, callbacks);
  }, [options]);

  const removeJob = useCallback((jobId: string) => {
    if (subscriptions.current.has(jobId)) {
      subscriptions.current.delete(jobId);
      wsClient.current.unsubscribeFromAnalysis(jobId);
      
      setState(prev => {
        const newJobs = new Map(prev.jobs);
        newJobs.delete(jobId);
        return { ...prev, jobs: newJobs };
      });
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    if (token && user) {
      wsClient.current.connect(token, user.id);
    }
  }, [token, user]);

  // Setup connection listeners
  useEffect(() => {
    const unsubscribeConnection = wsClient.current.onConnectionChange(updateConnectionState);
    const unsubscribeAuth = wsClient.current.onAuthChange(updateConnectionState);

    return () => {
      unsubscribeConnection();
      unsubscribeAuth();
    };
  }, [updateConnectionState]);

  return {
    state,
    addJob,
    removeJob,
    clearJobs: () => {
      subscriptions.current.forEach(jobId => removeJob(jobId));
    },
  };
} 