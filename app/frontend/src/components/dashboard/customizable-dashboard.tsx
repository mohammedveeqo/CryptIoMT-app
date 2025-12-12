"use client";

import { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { WidgetWrapper } from './widgets/widget-wrapper';
import { DeviceDistribution } from './charts/device-distribution';
// Remove this line since StatsCard doesn't exist:
// import { StatsCard } from './stats-card';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Widget {
  id: string;
  type: string;
  title: string;
  config?: any;
}

export function CustomizableDashboard() {
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [
      { i: 'stats-1', x: 0, y: 0, w: 3, h: 2 },
      { i: 'stats-2', x: 3, y: 0, w: 3, h: 2 },
      { i: 'stats-3', x: 6, y: 0, w: 3, h: 2 },
      { i: 'stats-4', x: 9, y: 0, w: 3, h: 2 },
      { i: 'device-distribution', x: 0, y: 2, w: 12, h: 4 },
    ]
  });

  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'stats-1', type: 'stats', title: 'Total Devices' },
    { id: 'stats-2', type: 'stats', title: 'Critical Alerts' },
    { id: 'stats-3', type: 'stats', title: 'PHI Devices' },
    { id: 'stats-4', type: 'stats', title: 'Data Collection Score' },
    { id: 'device-distribution', type: 'chart', title: 'Device Distribution' },
  ]);

  const [isEditMode, setIsEditMode] = useState(false);

  const addWidget = useCallback((type: 'stats' | 'chart') => {
    const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    const newWidget: Widget = { id, type, title: type === 'stats' ? 'New Stat' : 'New Chart' };
    setWidgets(prev => [...prev, newWidget]);
    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg || []), { i: id, x: 0, y: Infinity, w: 3, h: type === 'stats' ? 2 : 4 }]
    }));
  }, []);

  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
  }, []);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayouts(prev => ({
      ...prev,
      lg: prev.lg?.filter(l => l.i !== widgetId) || []
    }));
  }, []);

  const saveLayout = useCallback(() => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layouts));
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    setIsEditMode(false);
  }, [layouts, widgets]);

  const resetLayout = useCallback(() => {
    localStorage.removeItem('dashboard-layout');
    localStorage.removeItem('dashboard-widgets');
    window.location.reload();
  }, []);

  const renderWidget = (widget: Widget) => {
    const commonProps = {
      onRemove: isEditMode ? () => handleRemoveWidget(widget.id) : undefined,
      onConfigure: () => console.log('Configure', widget.id),
    };

    switch (widget.type) {
      case 'stats':
        return (
          <WidgetWrapper key={widget.id} id={widget.id} title={widget.title} {...commonProps}>
            <div className="text-2xl font-bold">123</div>
            <p className="text-xs text-muted-foreground">Sample stat</p>
          </WidgetWrapper>
        );
      case 'chart':
        return (
          <WidgetWrapper key={widget.id} id={widget.id} title={widget.title} {...commonProps}>
            <DeviceDistribution
              hospitalData={[
                { name: 'Main Hospital', count: 45, color: '#0088FE' },
                { name: 'Clinic A', count: 23, color: '#00C49F' },
              ]}
              deviceTypes={[
                { type: 'MRI', count: 12, risk: 'low' },
                { type: 'CT Scanner', count: 8, risk: 'medium' },
              ]}
              osVersions={[
                { version: 'Windows 10', count: 25, supported: true },
                { version: 'Windows 7', count: 8, supported: false },
              ]}
            />
          </WidgetWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customizable Dashboard</h2>
        <div className="flex space-x-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Exit Edit' : 'Edit Layout'}
          </Button>
          {isEditMode && (
            <>
              <Button variant="outline" onClick={() => addWidget('stats')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stat
              </Button>
              <Button variant="outline" onClick={() => addWidget('chart')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Chart
              </Button>
              <Button onClick={saveLayout}>
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
              <Button variant="outline" onClick={resetLayout}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
      >
        {widgets.map(renderWidget)}
      </ResponsiveGridLayout>
    </div>
  );
}
