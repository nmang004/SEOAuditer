import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart } from 'lucide-react';
import { useState } from 'react';

// Mock data for the charts
const generateHistoricalData = () => {
  const months = [];
  const endDate = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setMonth(endDate.getMonth() - i);
    months.push({
      date: date.toLocaleString('default', { month: 'short' }),
      overallScore: Math.floor(Math.random() * 20) + 70, // 70-90
      technical: Math.floor(Math.random() * 20) + 70,
      content: Math.floor(Math.random() * 20) + 70,
      onPage: Math.floor(Math.random() * 20) + 70,
      ux: Math.floor(Math.random() * 20) + 70,
    });
  }
  
  return months;
};

const historicalData = generateHistoricalData();

interface HistoricalTrendsProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

export function HistoricalTrends({ timeRange }: HistoricalTrendsProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Filter data based on selected time range
  const filterData = (data: typeof historicalData, range: string) => {
    switch (range) {
      case '1m':
        return data.slice(-1);
      case '3m':
        return data.slice(-3);
      case '6m':
        return data;
      case '1y':
        return [
          ...data,
          ...Array(5).fill(0).map((_, i) => ({
            date: new Date(new Date().setMonth(new Date().getMonth() + i + 1)).toLocaleString('default', { month: 'short' }),
            overallScore: Math.floor(Math.random() * 20) + 70,
            technical: Math.floor(Math.random() * 20) + 70,
            content: Math.floor(Math.random() * 20) + 70,
            onPage: Math.floor(Math.random() * 20) + 70,
            ux: Math.floor(Math.random() * 20) + 70,
          })),
        ];
      default:
        return data;
    }
  };

  const filteredData = filterData(historicalData, timeRange);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Historical Trends</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className="h-7 text-xs"
            >
              <LineChart className="h-3.5 w-3.5 mr-1" />
              Line
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="h-7 text-xs"
            >
              <BarChart className="h-3.5 w-3.5 mr-1" />
              Bar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
        {chartType === 'line' ? (
          <div className="text-center">
            <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/20" />
            <p>Line chart showing {timeRange} trend data</p>
            <p className="text-xs text-muted-foreground/60">Mock data visualization</p>
          </div>
        ) : (
          <div className="text-center">
            <BarChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/20" />
            <p>Bar chart showing {timeRange} trend data</p>
            <p className="text-xs text-muted-foreground/60">Mock data visualization</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
