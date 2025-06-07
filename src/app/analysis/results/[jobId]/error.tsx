'use client';

export default function ErrorCrawlResults({ error }: { error: Error }) {
  return (
    <div className="max-w-2xl mx-auto mt-16 text-center text-red-600">
      <h2 className="text-xl font-bold mb-2">Failed to load crawl results</h2>
      <div>{error.message}</div>
    </div>
  );
} 