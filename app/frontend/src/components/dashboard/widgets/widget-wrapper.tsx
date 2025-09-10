"use client";

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, X, Maximize2 } from 'lucide-react';

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: ReactNode;
  onConfigure?: () => void;
  onRemove?: () => void;
  onMaximize?: () => void;
}

export function WidgetWrapper({ 
  id, 
  title, 
  children, 
  onConfigure, 
  onRemove, 
  onMaximize 
}: WidgetWrapperProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex space-x-1">
          {onConfigure && (
            <Button variant="ghost" size="sm" onClick={onConfigure}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {onMaximize && (
            <Button variant="ghost" size="sm" onClick={onMaximize}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}