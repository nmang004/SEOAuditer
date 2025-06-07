'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestComponents() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Component Test</h1>
      
      <Card className="p-6 mb-4">
        <h2 className="text-lg font-semibold mb-2">Basic Components Test</h2>
        <div className="space-y-2">
          <Button>Test Button</Button>
          <p>If you can see this, basic components are working.</p>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-2">Status</h2>
        <p className="text-green-600">✅ Page loaded successfully</p>
      </Card>
    </div>
  );
} 