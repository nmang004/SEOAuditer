// Using the async pattern for Next.js App Router pages
export default async function Page({ params }: { params: { projectId: string } }) {
  // Simulate an async operation (can be replaced with actual data fetching)
  const projectId = params.projectId;
  
  return <div>Project ID: {projectId}</div>;
}