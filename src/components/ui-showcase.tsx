'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Plus,
  BarChart3,
  TrendingUp,
  Heart,
  Download,
  RefreshCw,
} from 'lucide-react';

// Import only the basic UI components that exist
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Progress,
  Label,
  Switch,
  Skeleton,
  Separator,
} from '@/components/ui';

function ButtonShowcase() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Button Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Button Sizes</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Heart className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Loading States</h3>
        <Button disabled={loading} onClick={() => setLoading(!loading)}>
          {loading ? 'Loading...' : 'Click me'}
        </Button>
      </div>
    </div>
  );
}

function CardShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Card Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>A standard card with default styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the content area of the card.</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle>Hoverable Card</CardTitle>
              <CardDescription>Hover to see the effects</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has enhanced effects on hover.</p>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>Modern glassmorphism design</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Translucent background with backdrop blur.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormShowcase() {
  const [switchValue, setSwitchValue] = useState(false);
  const [progressValue, setProgressValue] = useState(33);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Form Components</h3>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="Enter your email" />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="notifications" 
              checked={switchValue}
              onCheckedChange={setSwitchValue}
            />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
          
          <div className="space-y-2">
            <Label>Progress: {progressValue}%</Label>
            <Progress value={progressValue} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setProgressValue(Math.max(0, progressValue - 10))}>
                Decrease
              </Button>
              <Button size="sm" onClick={() => setProgressValue(Math.min(100, progressValue + 10))}>
                Increase
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Loading States</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Skeleton Loading</h4>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Badges</h4>
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UIShowcase() {
  const [activeTab, setActiveTab] = useState('buttons');

  const tabs = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'cards', label: 'Cards' },
    { id: 'forms', label: 'Forms' },
    { id: 'loading', label: 'Loading' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">UI Component Showcase</h1>
          <p className="text-xl text-muted-foreground">
            Basic UI components with standard interactions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'buttons' && <ButtonShowcase />}
          {activeTab === 'cards' && <CardShowcase />}
          {activeTab === 'forms' && <FormShowcase />}
          {activeTab === 'loading' && <LoadingShowcase />}
        </div>
      </div>
    </div>
  );
} 