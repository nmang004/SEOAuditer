'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/projects?userId=manual')
      .then(res => res.json())
      .then(setProjects);
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !projectUrl.trim()) return;
    setLoading(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName, url: projectUrl, userId: 'manual' }),
    });
    const newProject = await res.json();
    setProjects([newProject, ...projects]);
    setProjectName('');
    setProjectUrl('');
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 rounded-2xl shadow-xl bg-[#232B3A]">
      <h1 className="text-3xl font-extrabold mb-6 text-white">Projects</h1>
      <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="Project Name"
          className="flex-1 px-4 py-3 rounded-lg bg-[#181F2A] border border-[#374151] text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="url"
          value={projectUrl}
          onChange={e => setProjectUrl(e.target.value)}
          placeholder="Project URL (https://...)"
          className="flex-1 px-4 py-3 rounded-lg bg-[#181F2A] border border-[#374151] text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>
      <div className="space-y-4">
        {projects.map((p: any) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="block p-4 bg-[#181F2A] rounded shadow hover:bg-blue-900/30 transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{p.name}</div>
                <div className="text-sm text-gray-400">{p.url}</div>
              </div>
              <div className="text-blue-400 font-bold">View</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 