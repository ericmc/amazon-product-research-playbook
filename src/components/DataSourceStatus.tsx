import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSourceStatusProps {
  sources: {
    name: string;
    hasData: boolean;
    quality: 'high' | 'medium' | 'low' | 'missing';
    lastUpdated?: string;
  }[];
  className?: string;
}

export const DataSourceStatus: React.FC<DataSourceStatusProps> = ({ sources, className }) => {
  const getSourceBadge = (source: { hasData: boolean; quality: string }) => {
    if (!source.hasData || source.quality === 'missing') {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Missing
        </Badge>
      );
    }
    
    if (source.quality === 'high') {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Live
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />
        Manual
      </Badge>
    );
  };

  const missingCount = sources.filter(s => !s.hasData || s.quality === 'missing').length;
  const totalCount = sources.length;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Data Sources</span>
        <Badge 
          variant={missingCount === 0 ? "default" : missingCount < totalCount ? "secondary" : "destructive"}
          className="text-xs"
        >
          {totalCount - missingCount}/{totalCount} Connected
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {sources.map((source) => (
          <div key={source.name} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{source.name}</span>
            {getSourceBadge(source)}
          </div>
        ))}
      </div>
      
      {missingCount > 0 && (
        <div className="p-2 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">
              {missingCount} source{missingCount > 1 ? 's' : ''} missing - using default values
            </span>
          </div>
        </div>
      )}
    </div>
  );
};