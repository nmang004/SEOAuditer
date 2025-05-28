import { ProjectClient } from './ProjectClient';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectClient params={params} />;
} 