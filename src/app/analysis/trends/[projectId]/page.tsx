'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TrendAnalysisPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/analysis/trends/${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.trends)) {
          setTrendData(data.trends);
        } else {
          setError(data.error || 'Failed to load trend data');
        }
      })
      .catch(err => setError(err.message || 'Failed to load trend data'))
      .finally(() => setLoading(false));
  }, [projectId]);

  // Filtered data
  const filteredData = trendData.filter(d => {
    const date = new Date(d.date);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    if (selectedSeverity && (!d.issueSeverityCounts || !d.issueSeverityCounts[selectedSeverity])) return false;
    if (selectedType && (!d.issueTypeCounts || !d.issueTypeCounts[selectedType])) return false;
    return true;
  });

  // Collect all severities/types for filter dropdowns
  const allSeverities = Array.from(new Set(trendData.flatMap(d => d.issueSeverityCounts ? Object.keys(d.issueSeverityCounts) : [])));
  const allTypes = Array.from(new Set(trendData.flatMap(d => d.issueTypeCounts ? Object.keys(d.issueTypeCounts) : [])));

  if (loading) return <div className="max-w-2xl mx-auto mt-16 text-center">Loading trend data...</div>;
  if (error) return <div className="max-w-2xl mx-auto mt-16 text-center text-red-600">{error}</div>;
  if (!trendData.length) return <div className="max-w-2xl mx-auto mt-16 text-center">No trend data found.</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-8">
      <h1 className="text-2xl font-bold mb-2">SEO Trend Analysis</h1>
      <div className="text-gray-600 mb-6">Project ID: <span className="font-mono">{projectId}</span></div>
      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 items-center mb-8">
        <div>
          <span className="mr-2">Start Date:</span>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate || undefined}
            isClearable
            placeholderText="Start"
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <span className="mr-2">End Date:</span>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || undefined}
            isClearable
            placeholderText="End"
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <span className="mr-2">Severity:</span>
          <select value={selectedSeverity} onChange={e => setSelectedSeverity(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {allSeverities.map(sev => <option key={sev} value={sev}>{sev}</option>)}
          </select>
        </div>
        <div>
          <span className="mr-2">Type:</span>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {allTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <button
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => exportToCSV(filteredData, `seo-trends-${projectId}.csv`)}
        >
          Export CSV
        </button>
      </div>
      {/* Overall SEO Score */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Overall SEO Score Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={false} name="SEO Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Category Scores */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Category Scores Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="technicalScore" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Technical" />
            <Line type="monotone" dataKey="contentScore" stroke="#f59e42" strokeWidth={2} dot={false} name="Content" />
            <Line type="monotone" dataKey="onpageScore" stroke="#22c55e" strokeWidth={2} dot={false} name="On-Page" />
            <Line type="monotone" dataKey="uxScore" stroke="#a21caf" strokeWidth={2} dot={false} name="UX" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Issue Count */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Issue Count Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="issueCount" stroke="#dc2626" fillOpacity={1} fill="url(#colorIssues)" name="Issues" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Issue Breakdown by Type */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Issue Breakdown by Type</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData.map(d => ({ date: d.date, ...d.issueTypeCounts }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {allTypes.map((type, idx) => (
              <Bar key={type} dataKey={type} stackId="a" fill={["#2563eb", "#f59e42", "#22c55e", "#a21caf", "#dc2626"][idx % 5]} name={type} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Issue Breakdown by Severity */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Issue Breakdown by Severity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData.map(d => ({ date: d.date, ...d.issueSeverityCounts }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {allSeverities.map((sev, idx) => (
              <Bar key={sev} dataKey={sev} stackId="a" fill={["#dc2626", "#f59e42", "#2563eb", "#22c55e", "#a21caf"][idx % 5]} name={sev} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 