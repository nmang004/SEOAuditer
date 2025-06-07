'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition } from '@/components/animations/page-transition';
import { LoadingState, SkeletonLoader, ShimmerEffect } from '@/components/animations/loading-state';
import { ProgressRing } from '@/components/animations/loading-states';

export default function AnimationsDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCard, setShowCard] = useState(true);

  const simulateLoading = () => {
    setIsLoading(true);
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(Math.min(100, currentProgress));
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 500);
      }
    }, 200);
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold">Animation Showcase</h1>
        
        <Tabs defaultValue="loading" className="w-full">
          <TabsList>
            <TabsTrigger value="loading">Loading States</TabsTrigger>
            <TabsTrigger value="transitions">Transitions</TabsTrigger>
            <TabsTrigger value="micro">Micro-interactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="loading" className="space-y-8 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Loading State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-x-4">
                  <Button onClick={simulateLoading} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Simulate Loading'}
                  </Button>
                  
                  <Button variant="outline" onClick={() => setShowCard(!showCard)}>
                    {showCard ? 'Hide Card' : 'Show Card'}
                  </Button>
                </div>
                
                <div className="relative h-40 rounded-lg border p-4">
                  <LoadingState 
                    isLoading={isLoading} 
                    loader={
                      <div className="text-center space-y-4">
                        <ProgressRing progress={progress} size={48} />
                        <p className="text-sm text-muted-foreground">Loading content... {progress}%</p>
                      </div>
                    }
                  >
                    <m.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full flex items-center justify-center"
                    >
                      {showCard ? (
                        <Card className="w-full max-w-md">
                          <CardHeader>
                            <CardTitle>Content Loaded!</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>This content is now visible after loading.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <p>Content is hidden. Click "Show Card" to reveal.</p>
                      )}
                    </m.div>
                  </LoadingState>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skeleton Loader</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SkeletonLoader 
                        count={5} 
                        className="space-y-2"
                        itemClassName="h-4 w-full"
                      />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Shimmer Effect</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-24 w-full overflow-hidden rounded-lg bg-muted">
                        <ShimmerEffect />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transitions" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Transitions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Navigate between pages to see the smooth page transitions.
                  </p>
                  <div className="h-40 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                    Transition Preview Area
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="micro" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Micro-interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Button Hover/Tap</h3>
                  <div className="space-x-4">
                    <m.button
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Hover Me
                    </m.button>
                    <m.button
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
                      whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Outline Button
                    </m.button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Card Hover</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <m.div
                        key={item}
                        className="p-6 border rounded-lg bg-card"
                        whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <h4 className="font-medium mb-2">Card {item}</h4>
                        <p className="text-sm text-muted-foreground">
                          Hover over this card to see the elevation effect.
                        </p>
                      </m.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
