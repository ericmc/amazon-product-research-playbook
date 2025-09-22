import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, AlertTriangle, Clock, TrendingUp, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { FusedCriterion, DataSource, SourcedValue } from "@/utils/dataFusion";
import { formatDistanceToNow } from "date-fns";

interface ProvenancePopoverProps {
  criterion: FusedCriterion;
  trigger?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

const sourceLabels: Record<DataSource, string> = {
  jungle_scout: "Jungle Scout",
  helium_10: "Helium 10", 
  amazon_poe: "Amazon POE",
  manual: "Manual Entry",
  validation: "Validation"
};

const sourceColors: Record<DataSource, string> = {
  jungle_scout: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  helium_10: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  amazon_poe: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  manual: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  validation: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
};

export const ProvenancePopover: React.FC<ProvenancePopoverProps> = ({ 
  criterion, 
  trigger,
  side = "right" 
}) => {
  const { fusionMetadata, bySource, unit } = criterion;
  const sourceEntries = Object.entries(bySource).filter(([_, value]) => value !== undefined) as [DataSource, SourcedValue][];
  
  const needsVerification = fusionMetadata.disagreementIndex > 20;
  
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-6 px-2 text-xs",
        needsVerification && "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300"
      )}
    >
      <Database className="h-3 w-3 mr-1" />
      {sourceEntries.length} sources
      {needsVerification && <AlertTriangle className="h-3 w-3 ml-1" />}
    </Button>
  );

  const formatValue = (value: number): string => {
    if (unit === '%') return `${value}%`;
    if (unit === 'USD') return `$${value.toLocaleString()}`;
    if (unit === 'searches') return value.toLocaleString();
    return `${value}${unit}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80 p-0" align="start">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Data Provenance</h4>
            {needsVerification && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Verify
              </Badge>
            )}
          </div>

          {/* Fusion Summary */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fused Value</span>
              <span className="text-lg font-semibold text-primary">
                {formatValue(criterion.fusedValue)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="block">Confidence</span>
                <span className={cn("font-medium", getConfidenceColor(fusionMetadata.confidenceScore))}>
                  {Math.round(fusionMetadata.confidenceScore * 100)}%
                </span>
              </div>
              <div>
                <span className="block">Disagreement</span>
                <span className={cn(
                  "font-medium",
                  fusionMetadata.disagreementIndex > 20 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                )}>
                  {Math.round(fusionMetadata.disagreementIndex)}%
                </span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="capitalize">{fusionMetadata.fusionMethod.replace('_', ' ')}</span>
              {fusionMetadata.conservativeFusion && " (conservative)"}
            </div>
          </div>

          <Separator className="mb-3" />

          {/* Source Data */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Source Data ({sourceEntries.length})
            </h5>
            
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {sourceEntries.map(([source, sourceValue]) => (
                  <div key={source} className="p-2 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={cn("text-xs", sourceColors[source])}>
                        {sourceLabels[source]}
                      </Badge>
                      <span className="font-medium text-sm">
                        {formatValue(sourceValue.value)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(sourceValue.timestamp), { addSuffix: true })}
                      </div>
                      {sourceValue.confidence && (
                        <div className={cn("font-medium", getConfidenceColor(sourceValue.confidence))}>
                          {Math.round(sourceValue.confidence * 100)}% conf.
                        </div>
                      )}
                    </div>
                    
                    {sourceValue.notes && (
                      <div className="mt-1 text-xs text-muted-foreground italic">
                        {sourceValue.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Recommendations */}
          {needsVerification && (
            <>
              <Separator className="my-3" />
              <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-medium text-orange-700 dark:text-orange-300 mb-1">
                      High Disagreement Detected
                    </div>
                    <div className="text-orange-600 dark:text-orange-400">
                      Consider gathering additional data or validating conflicting sources.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProvenancePopover;