"use client";

import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Filter } from 'lucide-react';
import { useIssueTrends } from '@/hooks/useReactQueryDashboard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface IssueTrendsChartProps {
  days?: number;
  projectId?: string;
  height?: number;
  showControls?: boolean;
}

export function IssueTrendsChart({ 
  days = 30, 
  projectId,
  height = 350,
  showControls = true
}: IssueTrendsChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const [timeRange, setTimeRange] = React.useState(days.toString());
  
  const { 
    data: trendsData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useIssueTrends(parseInt(timeRange));

  // Chart configuration
  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `Issue Trends (${timeRange} days)`,
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
            return `${label}: ${value} issues`;
          },
          afterBody: (context) => {
            const dataPoint = trendsData?.data?.[context[0]?.dataIndex];
            if (dataPoint) {
              const netChange = dataPoint.newIssues - dataPoint.resolvedIssues;
              const netText = netChange > 0 ? `+${netChange}` : netChange.toString();
              return [`Net change: ${netText}`, `Total open: ${dataPoint.totalIssues}`];
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
        title: {
          display: true,
          text: 'Number of Issues',
          font: {
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => Math.floor(Number(value)).toString(),
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      },
    },
  }), [timeRange, days, trendsData]);

  // Chart data
  const chartData: ChartData<'bar'> = useMemo(() => {
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
          label: 'New Issues',
          data: trendsData.data.map(item => item.newIssues),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
        {
          label: 'Resolved Issues',
          data: trendsData.data.map(item => -item.resolvedIssues), // Negative for visual effect
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
        {
          label: 'Critical Issues',
          data: trendsData.data.map(item => item.criticalIssues),
          backgroundColor: 'rgba(220, 38, 127, 0.8)',
          borderColor: 'rgb(220, 38, 127)',
          borderWidth: 1,
        },
      ],
    };
  }, [trendsData]);

  // Export functionality
  const handleExport = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `issue-trends-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = url;
      link.click();
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-800">Error loading issue trends</h3>
            <p className="text-sm text-red-600 mt-1">
              {error.message || 'Failed to load issue trend data'}
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
            <h3 className="text-lg font-semibold">Issue Trends</h3>
            {isRefetching && (
              <Badge variant="secondary" className="animate-pulse">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
            {trendsData?.summary && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{trendsData.summary.totalNewIssues} new</span>
                <span>•</span>
                <span>{trendsData.summary.totalResolvedIssues} resolved</span>
                <span>•</span>
                <span>{trendsData.summary.resolutionRate}% resolution rate</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7d</SelectItem>
                <SelectItem value="14">14d</SelectItem>
                <SelectItem value="30">30d</SelectItem>
                <SelectItem value="60">60d</SelectItem>
                <SelectItem value="90">90d</SelectItem>
              </SelectContent>
            </Select>
            
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
            </div>
          </div>
        ) : (
          <Bar ref={chartRef} data={chartData} options={options} />
        )}
      </div>

      {/* Summary Stats */}
      {trendsData?.summary && !isLoading && (
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-600">New Issues</span>
              <div className="font-semibold text-lg text-red-600">{trendsData.summary.totalNewIssues}</div>
            </div>
            <div>
              <span className="text-gray-600">Resolved</span>
              <div className="font-semibold text-lg text-green-600">{trendsData.summary.totalResolvedIssues}</div>
            </div>
            <div>
              <span className="text-gray-600">Net Change</span>
              <div className={`font-semibold text-lg ${
                trendsData.summary.netIssueChange > 0 ? 'text-red-600' : 
                trendsData.summary.netIssueChange < 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {trendsData.summary.netIssueChange > 0 ? '+' : ''}{trendsData.summary.netIssueChange}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Open Issues</span>
              <div className="font-semibold text-lg">{trendsData.summary.currentOpenIssues}</div>
            </div>
            <div>
              <span className="text-gray-600">Resolution Rate</span>
              <div className="font-semibold text-lg text-blue-600">{trendsData.summary.resolutionRate}%</div>
            </div>
          </div>
          
          {/* Severity Breakdown */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">New Issues by Severity</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{trendsData.summary.severityBreakdown.critical}</div>
                <div className="text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{trendsData.summary.severityBreakdown.high}</div>
                <div className="text-gray-600">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{trendsData.summary.severityBreakdown.medium}</div>
                <div className="text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{trendsData.summary.severityBreakdown.low}</div>
                <div className="text-gray-600">Low</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 