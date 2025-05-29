import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AnalysesListPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  // TODO: Replace with real data fetching
  const mockAnalyses = [
    { id: 'analysis-1', date: '2024-06-01', score: 85 },
    { id: 'analysis-2', date: '2024-05-20', score: 78 },
  ];
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-8">
      <h1 className="text-2xl font-bold mb-2">Analyses for Project</h1>
      <div className="text-gray-600 mb-6">Project ID: <span className="font-mono">{projectId}</span></div>
      <div className="mb-6">
        <Link href={`/dashboard/projects/${projectId}/analyses/new`} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Start New Analysis</Link>
      </div>
      <div className="space-y-4">
        {mockAnalyses.map(a => (
          <Link key={a.id} href={`/dashboard/projects/${projectId}/analyses/${a.id}`} className="block p-4 bg-slate-50 rounded shadow hover:bg-blue-50 transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">Analysis {a.id}</div>
                <div className="text-sm text-gray-500">Date: {a.date}</div>
              </div>
              <div className="text-lg font-bold text-blue-700">Score: {a.score}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 