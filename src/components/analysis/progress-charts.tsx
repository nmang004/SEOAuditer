import React from "react";
import { m } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeInUp } from "@/lib/animations";
import { ChartData } from "@/lib/types";

interface ProgressChartsProps {
  chartData: {
    scoreHistory: ChartData;
    categoryComparison: ChartData;
  };
  isLoading?: boolean;
}

export function ProgressCharts({ chartData, isLoading = false }: ProgressChartsProps) {
  // In a real implementation, we would use a charting library like Chart.js or Recharts
  // For this mockup, we'll create a visual representation using divs

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score History</CardTitle>
            <CardDescription>SEO score progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Comparison</CardTitle>
            <CardDescription>Performance across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock line chart for score history
  const scoreHistory = chartData.scoreHistory;
  const maxScore = Math.max(...scoreHistory.datasets[0].data);
  const minScore = Math.min(...scoreHistory.datasets[0].data);
  const range = maxScore - minScore;

  // Mock bar chart for category comparison
  const categoryComparison = chartData.categoryComparison;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <m.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score History</CardTitle>
            <CardDescription>SEO score progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {/* Mock Line Chart */}
              <div className="relative h-full w-full">
                {/* Y-axis labels */}
                <div className="absolute bottom-0 left-0 top-0 flex flex-col justify-between py-4 text-xs text-muted-foreground">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="absolute bottom-8 left-8 right-4 top-4 border-b border-l">
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map((value, i) => (
                    <div 
                      key={i}
                      className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-800"
                      style={{ bottom: `${value}%` }}
                    />
                  ))}
                  
                  {/* Line chart */}
                  <svg className="absolute inset-0 h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Area fill */}
                    <path
                      d={`
                        M0,${100 - ((scoreHistory.datasets[0].data[0] - minScore) / range) * 100}
                        ${scoreHistory.datasets[0].data.map((value, i) => {
                          const x = (i / (scoreHistory.datasets[0].data.length - 1)) * 100;
                          const y = 100 - ((value - minScore) / range) * 100;
                          return `L${x},${y}`;
                        }).join(" ")}
                        L100,100 L0,100 Z
                      `}
                      fill="url(#scoreGradient)"
                    />
                    
                    {/* Line */}
                    <path
                      d={`
                        M0,${100 - ((scoreHistory.datasets[0].data[0] - minScore) / range) * 100}
                        ${scoreHistory.datasets[0].data.map((value, i) => {
                          const x = (i / (scoreHistory.datasets[0].data.length - 1)) * 100;
                          const y = 100 - ((value - minScore) / range) * 100;
                          return `L${x},${y}`;
                        }).join(" ")}
                      `}
                      fill="none"
                      stroke="var(--primary-500)"
                      strokeWidth="2"
                    />
                    
                    {/* Data points */}
                    {scoreHistory.datasets[0].data.map((value, i) => {
                      const x = (i / (scoreHistory.datasets[0].data.length - 1)) * 100;
                      const y = 100 - ((value - minScore) / range) * 100;
                      return (
                        <circle
                          key={i}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3"
                          fill="white"
                          stroke="var(--primary-500)"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-muted-foreground">
                  {scoreHistory.labels.map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </m.div>
      
      <m.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Comparison</CardTitle>
            <CardDescription>Performance across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {/* Mock Bar Chart */}
              <div className="relative h-full w-full">
                {/* Y-axis labels */}
                <div className="absolute bottom-0 left-0 top-0 flex flex-col justify-between py-4 text-xs text-muted-foreground">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="absolute bottom-8 left-8 right-4 top-4 border-b border-l">
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map((value, i) => (
                    <div 
                      key={i}
                      className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-800"
                      style={{ bottom: `${value}%` }}
                    />
                  ))}
                  
                  {/* Bars */}
                  <div className="flex h-full items-end justify-around">
                    {categoryComparison.datasets[0].data.map((value, i) => {
                      const barColor = i % 2 === 0 ? "var(--primary-500)" : "var(--primary-600)";
                      return (
                        <div key={i} className="group relative flex h-full w-1/6 items-end justify-center">
                          <div 
                            className="w-3/4 rounded-t-sm transition-all duration-200 group-hover:w-full"
                            style={{ 
                              height: `${value}%`, 
                              backgroundColor: barColor 
                            }}
                          />
                          
                          {/* Tooltip on hover */}
                          <div className="absolute -top-8 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                            {value}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 right-4 flex justify-around text-xs text-muted-foreground">
                  {categoryComparison.labels.map((label, i) => (
                    <span key={i} className="w-1/6 truncate text-center">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </m.div>
    </div>
  );
}
