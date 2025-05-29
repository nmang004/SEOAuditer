import React, { useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceDot,
  ReferenceLine,
  Label
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Plus, LineChart as LineChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { generateMockAnalysisData } from '@/lib/mock-data-analysis';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

interface HistoricalTrendsProps {
  timeRange: '1m' | '3m' | '6m' | '1y';
}

const chartColors = {
  overallScore: '#3b82f6',
  technicalScore: '#10b981',
  contentScore: '#8b5cf6',
  onPageScore: '#f59e0b',
  userExperienceScore: '#ec4899',
};

export const HistoricalTrends = React.memo(function HistoricalTrends({ timeRange }: HistoricalTrendsProps) {
  // Use mock data from the generator
  const mock = generateMockAnalysisData();
  let data = mock.historicalData.map(d => ({ ...d, date: d.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) }));

  // Filter data based on selected time range
  let filteredData = data;
  if (timeRange === '1m') filteredData = data.slice(-1);
  else if (timeRange === '3m') filteredData = data.slice(-3);
  else if (timeRange === '6m') filteredData = data;
  else if (timeRange === '1y') {
    // For demo, repeat data to fill 12 months
    const extra = Array.from({ length: 6 }, (_, i) => ({ ...data[0], date: `M${i + 7}` }));
    filteredData = [...data, ...extra];
  }

  const [visibleLines, setVisibleLines] = React.useState([
    'overallScore',
    'technicalScore',
    'contentScore',
    'onPageScore',
    'userExperienceScore',
  ]);
  const [annotations, setAnnotations] = React.useState([
    { index: 2, label: 'Major Update', color: '#f59e0b' },
    { index: 4, label: 'Google Core Update', color: '#3b82f6' },
  ]);
  const chartRef = useRef<HTMLDivElement>(null);

  // Export chart as image
  const handleExport = () => {
    if (!chartRef.current) return;
    import('html-to-image').then(htmlToImage => {
      htmlToImage.toPng(chartRef.current!).then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'historical-trends.png';
        link.href = dataUrl;
        link.click();
      });
    });
  };

  // Add export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historical-trends.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('SEO Historical Trends', 10, 10);
    filteredData.slice(0, 40).forEach((row, i) => {
      doc.text(`${row.date}: Overall ${row.overallScore}, Technical ${row.technicalScore}, Content ${row.contentScore}, OnPage ${row.onPageScore}, UX ${row.userExperienceScore}`, 10, 20 + i * 7);
    });
    doc.save('historical-trends.pdf');
  };

  // Toggle metric lines
  const toggleLine = (key: string) => {
    setVisibleLines(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Historical Trends</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} aria-label="Export chart as image">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[340px]">
        <div className="flex gap-2 p-2 border-b bg-muted/10">
          <Button size="xs" variant="outline" onClick={handleExportCSV} aria-label="Export trends as CSV">Export CSV</Button>
          <Button size="xs" variant="outline" onClick={handleExportPDF} aria-label="Export trends as PDF">Export PDF</Button>
        </div>
        <div ref={chartRef} className="h-full w-full" role="img" aria-label="SEO historical trends line chart" tabIndex={0} aria-describedby="historical-trends-desc">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                labelFormatter={value => `Date: ${value}`}
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingBottom: '1rem' }}
                onClick={e => toggleLine(e.dataKey)}
              />
              <Brush dataKey="date" height={20} stroke="#3b82f6" travellerWidth={10} />
              {/* Render metric lines */}
              {visibleLines.includes('overallScore') && (
                <Line type="monotone" dataKey="overallScore" name="Overall" stroke={chartColors.overallScore} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
              )}
              {visibleLines.includes('technicalScore') && (
                <Line type="monotone" dataKey="technicalScore" name="Technical" stroke={chartColors.technicalScore} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
              )}
              {visibleLines.includes('contentScore') && (
                <Line type="monotone" dataKey="contentScore" name="Content" stroke={chartColors.contentScore} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
              )}
              {visibleLines.includes('onPageScore') && (
                <Line type="monotone" dataKey="onPageScore" name="On Page" stroke={chartColors.onPageScore} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
              )}
              {visibleLines.includes('userExperienceScore') && (
                <Line type="monotone" dataKey="userExperienceScore" name="UX" stroke={chartColors.userExperienceScore} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
              )}
              {/* Annotations */}
              {annotations.map(a => (
                <ReferenceDot key={a.index} x={filteredData[a.index]?.date} y={filteredData[a.index]?.overallScore} r={6} fill={a.color} stroke="#fff" strokeWidth={2} isFront>
                  <Label value={a.label} position="top" fill={a.color} fontSize={12} />
                </ReferenceDot>
              ))}
              {/* Example: major change line */}
              <ReferenceLine x={filteredData[3]?.date} stroke="#f59e0b" strokeDasharray="3 3">
                <Label value="Site Redesign" position="top" fill="#f59e0b" fontSize={12} />
              </ReferenceLine>
            </LineChart>
          </ResponsiveContainer>
          <span id="historical-trends-desc" className="sr-only">Line chart showing SEO performance trends over time for overall, technical, content, on-page, and user experience scores.</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(chartColors).map(([key, color]) => (
            <Button
              key={key}
              size="xs"
              variant={visibleLines.includes(key) ? 'default' : 'outline'}
              style={{ color, borderColor: color }}
              onClick={() => toggleLine(key)}
              aria-pressed={visibleLines.includes(key)}
            >
              <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: color }} />
              {key.replace('Score', '')}
            </Button>
          ))}
          <Button size="xs" variant="ghost" onClick={() => setAnnotations(a => [...a, { index: 5, label: 'Manual Note', color: '#10b981' }])}>
            <Plus className="h-3 w-3 mr-1" /> Add Annotation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
