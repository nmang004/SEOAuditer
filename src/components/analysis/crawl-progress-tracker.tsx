'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertCircle, 
  Play, 
  Pause, 
  Square, 
  Eye,
  Globe,
  TrendingUp,
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CrawlProgress {
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  crawled: number;
  total: number;
  currentUrl: string;
  errors: number;
  pagesPerMinute: number;
  estimatedTimeRemaining: number;
  recentlyDiscovered: string[];
  startTime: Date;
}

interface CrawlProgressTrackerProps {
  sessionId: string;
  onViewPartialResults?: () => void;
  onCrawlComplete?: (results: any) => void;
}

const STATUS_COLORS = {
  running: 'bg-blue-500',
  paused: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500'
};

const STATUS_LABELS = {
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed'
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "text-white font-medium",
        STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-500'
      )}
    >
      <div className={cn(
        "w-2 h-2 rounded-full mr-2",
        status === 'running' ? 'animate-pulse' : ''
      )} />
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
    </Badge>
  );
}

function formatETA(minutes: number): string {
  if (minutes < 1) return 'Less than 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours < 24) {
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0
    ? `${days}d ${remainingHours}h`
    : `${days}d`;
}

function formatDuration(startTime: Date): string {
  const now = new Date();
  const duration = now.getTime() - new Date(startTime).getTime();
  const minutes = Math.floor(duration / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function CrawlProgressTracker({ 
  sessionId, 
  onViewPartialResults,
  onCrawlComplete 
}: CrawlProgressTrackerProps) {
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws`); // Update with your WebSocket URL
    
    ws.onopen = () => {
      setConnected(true);
      setError(null);
      
      // Subscribe to crawl progress
      ws.send(JSON.stringify({
        type: 'subscribe-crawl',
        data: { sessionId }
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'crawl-status':
            setProgress(message.data);
            break;
          case 'crawl-progress':
            setProgress(message.data.progress);
            break;
          case 'crawl-completed':
            setProgress(prev => prev ? { ...prev, status: 'completed' } : null);
            onCrawlComplete?.(message.data.results);
            break;
          case 'crawl-error':
            setError(message.data.error);
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onclose = () => {
      setConnected(false);
    };
    
    ws.onerror = () => {
      setError('WebSocket connection error');
      setConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, [sessionId, onCrawlComplete]);

  const handlePause = () => {
    // Send pause command via WebSocket
    // Implementation depends on your WebSocket setup
  };

  const handleResume = () => {
    // Send resume command via WebSocket
    // Implementation depends on your WebSocket setup
  };

  const handleStop = () => {
    // Send stop command via WebSocket
    // Implementation depends on your WebSocket setup
  };

  if (!connected) {
    return (
      <Card className="p-6 border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mr-2" />
          <span className="text-gray-300">Connecting to crawl progress...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-500/20 bg-red-500/10">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-300">{error}</span>
        </div>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className="p-6 border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mr-2" />
          <span className="text-gray-300">Loading crawl progress...</span>
        </div>
      </Card>
    );
  }

  const progressPercentage = progress.total > 0 ? (progress.crawled / progress.total) * 100 : 0;

  return (
    <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Globe className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Crawl Progress</h3>
              <p className="text-sm text-gray-400">Session {sessionId.slice(0, 8)}...</p>
            </div>
          </div>
          <StatusBadge status={progress.status} />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-white">Pages Analyzed</span>
            <span className="text-sm text-gray-400">
              {progress.crawled} / {progress.total}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3 bg-gray-700"
          />
          <div className="mt-2 text-center">
            <span className="text-2xl font-bold text-indigo-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>

        {/* Current Activity */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Current Activity</h4>
          
          {progress.status === 'running' && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Currently analyzing:</div>
              <div className="font-mono text-xs bg-gray-800/50 p-2 rounded truncate text-gray-300">
                {progress.currentUrl}
              </div>
            </div>
          )}

          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Speed</span>
              </div>
              <div className="font-semibold text-white">
                {progress.pagesPerMinute}
              </div>
              <div className="text-xs text-gray-400">pages/min</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Errors</span>
              </div>
              <div className="font-semibold text-white">
                {progress.errors}
              </div>
              <div className="text-xs text-gray-400">failed pages</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">ETA</span>
              </div>
              <div className="font-semibold text-white">
                {formatETA(progress.estimatedTimeRemaining)}
              </div>
              <div className="text-xs text-gray-400">remaining</div>
            </div>
          </div>

          {/* Duration */}
          <div className="text-center text-sm text-gray-400">
            <Clock className="h-4 w-4 inline mr-1" />
            Running for {formatDuration(progress.startTime)}
          </div>
        </div>

        {/* Recently Discovered URLs */}
        {progress.recentlyDiscovered.length > 0 && (
          <div>
            <h4 className="font-medium text-white mb-3">Recently Discovered</h4>
            <div className="bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {progress.recentlyDiscovered.map((url, i) => (
                  <div key={i} className="text-xs text-gray-400 truncate">
                    <FileText className="h-3 w-3 inline mr-1" />
                    {url}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-gray-700 bg-gray-900/30">
        <div className="flex gap-3">
          {progress.status === 'running' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handlePause}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          {progress.status === 'paused' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleResume}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          
          {['running', 'paused'].includes(progress.status) && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleStop}
              className="border-red-600 text-red-300 hover:bg-red-700/50"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          
          {progress.crawled > 0 && onViewPartialResults && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onViewPartialResults}
              className="text-gray-300 hover:bg-gray-700/50"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Partial Results
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}