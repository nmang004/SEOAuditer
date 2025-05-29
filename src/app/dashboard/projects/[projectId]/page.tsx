'use client';
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-8">
      <h1 className="text-2xl font-bold mb-2">Project Dashboard</h1>
      <div className="text-gray-600 mb-6">Project ID: <span className="font-mono">{projectId}</span></div>
      <div className="flex gap-4 mb-8">
        <Link href={`/dashboard/projects/${projectId}/analyses`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">View Analyses</Link>
        <Link href={`/dashboard/projects/${projectId}/trends`} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">View Trends</Link>
        <Link href={`/dashboard/projects/${projectId}/analyses/new`} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Start New Analysis</Link>
      </div>
      {/* Add more project overview info here */}
    </div>
  );
}