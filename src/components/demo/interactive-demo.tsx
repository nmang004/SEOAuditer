'use client';

import React, { useState } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { haptic } from '@/theme/haptic';

interface InteractiveCardProps {
  title: string;
  description: string;
  variant?: 'default' | 'elevated';
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({ 
  title, 
  description, 
  variant = 'default' 
}) => {
  return (
    <m.div
      className={cn(
        'p-6 rounded-xl border bg-card text-card-foreground shadow-sm',
        variant === 'elevated' && 'shadow-md',
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1',
        'active:translate-y-0 active:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        'cursor-pointer'
      )}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </m.div>
  );
};

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState('cards');

  // Haptic feedback demo
  const renderHapticDemo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Haptic Feedback</h3>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => haptic.light()}
          variant="outline"
          className="px-4 py-2"
        >
          Light Tap
        </Button>
        <Button
          onClick={() => haptic.medium()}
          className="px-4 py-2"
        >
          Medium Tap
        </Button>
      </div>
    </div>
  );

  const handleReset = () => {
    setActiveTab('cards');
    haptic.light();
  };

  return (
    <div className="space-y-8">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold tracking-tight">Interactive Components</h2>
        <p className="text-muted-foreground">
          Experience the enhanced micro-interactions, haptic feedback, and touch-optimized components.
        </p>
      </m.div>

      <div className="border rounded-lg p-1 bg-muted/20">
        <div className="flex space-x-1">
          {['cards', 'buttons', 'feedback'].map((tab) => (
            <Button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                haptic.light();
              }}
              variant={activeTab === tab ? 'default' : 'ghost'}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      <m.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-[200px]"
      >
        {activeTab === 'cards' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Interactive Card',
                description: 'Hover and tap to see the interaction',
                variant: 'default' as const,
              },
              {
                title: 'Elevated Card',
                description: 'With subtle elevation on hover',
                variant: 'elevated' as const,
              },
            ].map((card, index) => (
              <InteractiveCard key={index} {...card} />
            ))}
          </div>
        )}

        {activeTab === 'buttons' && (
          <div className="flex flex-wrap gap-4 p-6 bg-muted/20 rounded-lg">
            {[
              'default',
              'secondary',
              'destructive',
              'outline',
              'ghost',
              'link',
            ].map((variant) => (
              <Button
                key={variant}
                // @ts-ignore - variant type is handled by the Button component
                variant={variant}
                className="capitalize"
              >
                {variant} Button
              </Button>
            ))}
          </div>
        )}

        {activeTab === 'feedback' && renderHapticDemo()}
      </m.div>

      <m.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 w-full sm:w-auto"
      >
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full"
        >
          Reset All
        </Button>
      </m.div>
    </div>
  );
}

export default InteractiveDemo;
