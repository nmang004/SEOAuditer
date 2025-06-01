'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  ChartOptions,
  ChartData,
  InteractionItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, RefreshCw } from 'lucide-react';
import { usePerformanceTrends } from '@/hooks/useReactQueryDashboard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface PerformanceChartProps {
  days?: number;
  projectId?: string;
  height?: number;
  showControls?: boolean;
  onDataPointClick?: (data: any) => void;
}

export function PerformanceChart({ 
  days = 30, 
  projectId,
  height = 400,
  showControls = true,
  onDataPointClick
}: PerformanceChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  
  const { 
    data: trendsData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = usePerformanceTrends(days);

  // Chart configuration
  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `SEO Performance Trends (${days} days)`,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const date = context[0]?.parsed?.x;
            return date ? format(new Date(date), 'MMM dd, yyyy') : '';
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return value !== null ? `${label}: ${value}` : `${label}: No data`;
          },
          afterBody: (context) => {
            const dataPoint = trendsData?.data?.[context[0]?.dataIndex];
            if (dataPoint?.projectCount) {
              return [`${dataPoint.projectCount} projects`];
            }
            return [];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: days > 7 ? 'day' : 'hour',
          displayFormats: {
            day: 'MMM dd',
            hour: 'HH:mm',
          },
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score',
          font: {
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => `${value}`,
        },
      },
    },
    elements: {
      line: {
        tension: 0.3,
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: '#fff',
      },
    },
    onClick: (event, elements: InteractionItem[]) => {
      if (elements.length > 0 && onDataPointClick) {
        const dataIndex = elements[0].index;
        const dataPoint = trendsData?.data?.[dataIndex];
        if (dataPoint) {
          onDataPointClick(dataPoint);
        }
      }
    },
  }), [days, onDataPointClick, trendsData]);

  // Chart data
  const chartData: ChartData<'line'> = useMemo(() => {
    if (!trendsData?.data) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = trendsData.data.map(item => parseISO(item.date));
    
    return {
      labels,
      datasets: [
        {
          label: 'Overall Score',
          data: trendsData.data.map(item => item.overallScore),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          spanGaps: false,
        },
        {
          label: 'Technical',
          data: trendsData.data.map(item => item.technicalScore),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          spanGaps: false,
        },
        {
          label: 'Content',
          data: trendsData.data.map(item => item.contentScore),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: false,
          spanGaps: false,
        },
        {
          label: 'On-Page',
          data: trendsData.data.map(item => item.onPageScore),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: false,
          spanGaps: false,
        },
        {
          label: 'UX Score',
          data: trendsData.data.map(item => item.uxScore),
          borderColor: 'rgb(236, 72, 153)',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          fill: false,
          spanGaps: false,
        },
      ],
    };
  }, [trendsData]);

  // Export functionality
  const handleExport = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `performance-trends-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = url;
      link.click();
    }
  };

  // Fullscreen functionality
  const handleFullscreen = () => {
    // Implementation would open chart in modal/fullscreen view
    console.log('Fullscreen chart functionality');
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-800">Error loading chart</h3>
            <p className="text-sm text-red-600 mt-1">
              {error.message || 'Failed to load performance data'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      {/* Header */}
      {showControls && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Performance Trends</h3>
            {isRefetching && (
              <Badge variant="secondary" className="animate-pulse">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
            {trendsData?.data && trendsData.data.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{trendsData.data.length} data points</span>
                <span>•</span>
                <span>{trendsData.data.reduce((sum, d) => sum + d.projectCount, 0)} total projects</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              disabled={isLoading}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Expand
            </Button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div style={{ height: `${height}px` }} className="relative">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : (
          <Line ref={chartRef} data={chartData} options={options} />
        )}
      </div>

      {/* Summary Stats */}
      {trendsData?.data && trendsData.data.length > 0 && !isLoading && (
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Average Score</span>
              <div className="font-semibold text-lg">
                {(trendsData.data.reduce((sum, d) => sum + d.overallScore, 0) / trendsData.data.length).toFixed(1)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Best Score</span>
              <div className="font-semibold text-lg text-green-600">
                {Math.max(...trendsData.data.map(d => d.overallScore))}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Lowest Score</span>
              <div className="font-semibold text-lg text-red-600">
                {Math.min(...trendsData.data.map(d => d.overallScore))}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total Projects</span>
              <div className="font-semibold text-lg">
                {trendsData.data.reduce((sum, d) => sum + d.projectCount, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 