"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { fadeInUp } from "@/lib/animations";
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  score: number;
  technical: number;
  content: number;
  onPage: number;
  ux: number;
}

interface PerformanceTrendsProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export function PerformanceTrends({ data, isLoading = false }: PerformanceTrendsProps) {
  const [timeRange, setTimeRange] = useState("30d");
  const chartLines = [
    { key: 'score', name: 'Overall', color: '#3b82f6' },
    { key: 'technical', name: 'Technical', color: '#10b981' },
    { key: 'content', name: 'Content', color: '#8b5cf6' },
    { key: 'onPage', name: 'On Page', color: '#f59e0b' },
    { key: 'ux', name: 'UX', color: '#ec4899' },
  ];
  
  const [visibleLines, setVisibleLines] = useState<string[]>(chartLines.map(line => line.key));
  
  // Toggle visibility of a chart line
  const toggleLine = (lineKey: string) => {
    setVisibleLines(prev => 
      prev.includes(lineKey) 
        ? prev.filter(key => key !== lineKey)
        : [...prev, lineKey]
    );
  };

  // Get filtered data based on time range
  const filteredData = timeRange === '7d' 
    ? data.slice(-7) 
    : timeRange === '30d'
    ? data.slice(-30)
    : timeRange === '90d'
    ? data.slice(-90)
    : data;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <Card className="border-none bg-gradient-to-br from-background/80 to-background/30 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
            <CardTitle className="text-xl font-bold">Performance Trends</CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Project selection */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                        Time Range: {timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : '90 Days'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Time Range</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setTimeRange('7d')}>7 Days</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeRange('30d')}>30 Days</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeRange('90d')}>90 Days</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <div className="flex-1 flex flex-wrap gap-2">
                    {chartLines.map((line) => (
                      <Button
                        key={line.key}
                        variant={visibleLines.includes(line.key) ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        onClick={() => toggleLine(line.key)}
                      >
                        <div 
                          className="w-2 h-2 rounded-full mr-1.5" 
                          style={{ backgroundColor: line.color }}
                        />
                        {line.name}
                      </Button>
                    ))}
                  </div>
                </div>
              
              {/* Time range filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <span className="text-xs">{timeRange}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={timeRange} onValueChange={setTimeRange}>
                    <DropdownMenuRadioItem value="7d">Last 7 days</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="30d">Last 30 days</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="90d">Last 90 days</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="1y">Last year</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading chart data...</p>
                </div>
              </div>
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    labelFormatter={(value) => `Date: ${value}`}
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '1rem' }}
                  />
                  {chartLines.map((line) => (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      name={line.name}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
