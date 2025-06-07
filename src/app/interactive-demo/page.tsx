import { Metadata } from 'next';
import { InteractiveDemo } from '@/components/demo/interactive-demo';

export const metadata: Metadata = {
  title: 'Interactive Demo',
  description: 'Experience enhanced micro-interactions and touch-optimized components',
};

export default function InteractiveDemoPage() {
  return (
    <div className="container py-12">
      <InteractiveDemo />
    </div>
  );
}
