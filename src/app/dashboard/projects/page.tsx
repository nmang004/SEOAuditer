// API contract and authentication updated to match backend (2024-06-01)
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/projects', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setProjects(result.data);
        } else {
          setProjects([]);
        }
      });
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !projectUrl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token'); // or however you store the JWT
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: projectName, url: projectUrl }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Failed to create project');
        setLoading(false);
        return;
      }
      setProjects([result.data, ...projects]);
      setProjectName('');
      setProjectUrl('');
    } catch (err) {
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
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
      {error && <div className="text-red-400 mb-4">{error}</div>}
      <div className="space-y-4">
        {projects.length === 0 && <div className="text-gray-400">No projects found.</div>}
        {projects.map((p: any) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="block p-4 bg-[#181F2A] rounded shadow hover:bg-blue-900/30 transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{p.name || 'Untitled Project'}</div>
                <div className="text-sm text-gray-400">{p.url || ''}</div>
              </div>
              <div className="text-blue-400 font-bold">View</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 