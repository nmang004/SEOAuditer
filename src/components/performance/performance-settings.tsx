import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Gauge, Zap, Battery, Monitor } from 'lucide-react';
import { usePerformanceContext } from '@/contexts/performance-context';

export function PerformanceSettings() {
  const { settings, updateSettings } = usePerformanceContext();

  const handlePerformanceMode = (mode: 'balanced' | 'high' | 'low') => {
    updateSettings({
      performanceMode: mode,
      disableAnimations: mode === 'low',
      reducedMotion: mode === 'low',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Performance settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Performance Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 space-y-2">
          <p className="text-xs text-muted-foreground">Performance Mode</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={settings.performanceMode === 'high' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8"
              onClick={() => handlePerformanceMode('high')}
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              High
            </Button>
            <Button
              variant={settings.performanceMode === 'balanced' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8"
              onClick={() => handlePerformanceMode('balanced')}
            >
              <Monitor className="h-3.5 w-3.5 mr-1" />
              Balanced
            </Button>
            <Button
              variant={settings.performanceMode === 'low' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8"
              onClick={() => handlePerformanceMode('low')}
            >
              <Battery className="h-3.5 w-3.5 mr-1" />
              Low Power
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm">Reduce Motion</span>
            <Button
              variant={settings.reducedMotion ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
            >
              {settings.reducedMotion ? 'On' : 'Off'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Reduces animations for better performance
          </p>
        </div>

        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm">Disable Animations</span>
            <Button
              variant={settings.disableAnimations ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => updateSettings({ disableAnimations: !settings.disableAnimations })}
            >
              {settings.disableAnimations ? 'On' : 'Off'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Disables all non-essential animations
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
