'use client';
import React from 'react';
import Link from 'next/link';

export default function ProjectsListPage() {
  // TODO: Replace with real data fetching
  const mockProjects = [
    { id: 'project-1', name: 'Acme Corp', url: 'https://acme.com' },
    { id: 'project-2', name: 'Blue Ribbon', url: 'https://blueribbonservices.com' },
  ];
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-8">
      <h1 className="text-2xl font-bold mb-2">Projects</h1>
      <div className="mb-6">
        <Link href="/dashboard/projects/new" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create New Project</Link>
      </div>
      <div className="space-y-4">
        {mockProjects.map(p => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="block p-4 bg-slate-50 rounded shadow hover:bg-blue-50 transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-gray-500">{p.url}</div>
              </div>
              <div className="text-blue-700 font-bold">View</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 