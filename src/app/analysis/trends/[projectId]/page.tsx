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
    
    const token = localStorage.getItem('token');
    console.log('[Trends Page] Fetching trends with token:', token ? 'present' : 'missing');
    
    fetch(`/api/analysis/trends/${projectId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(res => {
        console.log('[Trends Page] Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[Trends Page] Response data:', data);
        if (data && data.success && Array.isArray(data.trends)) {
          setTrendData(data.trends);
        } else {
          setError(data.error || 'Failed to load trend data');
        }
      })
      .catch(err => {
        console.error('[Trends Page] Error:', err);
        setError(err.message || 'Failed to load trend data');
      })
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Trend Data</h2>
            <p className="text-gray-300">Please wait while we analyze your SEO trends...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm p-8 text-center">
              <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-xl">!</span>
              </div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Trends</h2>
              <p className="text-red-300 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!trendData.length) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-8 text-center">
              <div className="h-12 w-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-400 text-xl">📊</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Trend Data</h2>
              <p className="text-gray-300 mb-6">No trend data available yet. Complete more analyses to see trends over time.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            SEO Trend Analysis
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            Project ID: <span className="font-mono text-indigo-400">{projectId}</span>
          </p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white px-4 py-2 rounded-lg font-medium transition-all"
        >
          ← Back
        </button>
      </div>
      {/* Filters and Export */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6 mb-8">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate || undefined}
              isClearable
              placeholderText="Select start date"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              isClearable
              placeholderText="Select end date"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Severity</label>
            <select 
              value={selectedSeverity} 
              onChange={e => setSelectedSeverity(e.target.value)} 
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Severities</option>
              {allSeverities.map(sev => <option key={sev} value={sev}>{sev}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Type</label>
            <select 
              value={selectedType} 
              onChange={e => setSelectedType(e.target.value)} 
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {allTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2 ml-auto">
            <label className="text-sm font-medium text-gray-300 opacity-0">Export</label>
            <button
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              onClick={() => exportToCSV(filteredData, `seo-trends-${projectId}.csv`)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>
      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-1">
        {/* Overall SEO Score */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-1">Overall SEO Score Over Time</h2>
            <p className="text-gray-400 text-sm">Track your website's overall SEO performance</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366F1" 
                  strokeWidth={3} 
                  dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }} 
                  name="SEO Score" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Scores */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-1">Category Scores Over Time</h2>
            <p className="text-gray-400 text-sm">Monitor performance across different SEO categories</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="technicalScore" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: '#0EA5E9', r: 3 }} name="Technical" />
                <Line type="monotone" dataKey="contentScore" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} name="Content" />
                <Line type="monotone" dataKey="onpageScore" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name="On-Page" />
                <Line type="monotone" dataKey="uxScore" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} name="UX" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Count */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-1">Issue Count Over Time</h2>
            <p className="text-gray-400 text-sm">Track the total number of SEO issues identified</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="issueCount" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIssues)" 
                  name="Issues" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Breakdown by Type */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-1">Issue Breakdown by Type</h2>
            <p className="text-gray-400 text-sm">Analyze issues categorized by their type</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filteredData.map(d => ({ date: d.date, ...d.issueTypeCounts }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  allowDecimals={false} 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                {allTypes.map((type, idx) => (
                  <Bar 
                    key={type} 
                    dataKey={type} 
                    stackId="a" 
                    fill={["#6366F1", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444"][idx % 5]} 
                    name={type} 
                    radius={[0, 0, 4, 4]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Breakdown by Severity */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-1">Issue Breakdown by Severity</h2>
            <p className="text-gray-400 text-sm">Prioritize fixes based on issue severity levels</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filteredData.map(d => ({ date: d.date, ...d.issueSeverityCounts }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  allowDecimals={false} 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                {allSeverities.map((sev, idx) => (
                  <Bar 
                    key={sev} 
                    dataKey={sev} 
                    stackId="a" 
                    fill={["#EF4444", "#F59E0B", "#6366F1", "#10B981", "#8B5CF6"][idx % 5]} 
                    name={sev} 
                    radius={[0, 0, 4, 4]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 