import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Calendar, TrendingUp, Database, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SavedOpportunity } from "@/utils/OpportunityStorage";
import { FusedCriterion } from "@/utils/dataFusion";
import ProvenancePopover from "@/components/ProvenancePopover";
import VerifyBadge from "@/components/VerifyBadge";
import { formatDistanceToNow } from "date-fns";

interface OpportunityDetailV2Props {
  opportunity: SavedOpportunity;
  onEdit?: () => void;
  onValidate?: () => void;
  onDelete?: () => void;
}

export const OpportunityDetailV2: React.FC<OpportunityDetailV2Props> = ({
  opportunity,
  onEdit,
  onValidate,
  onDelete
}) => {
  // Check if criteria are legacy or fused
  const isFusedCriteria = opportunity.criteria?.[0]?.fusionMetadata !== undefined;
  const fusedCriteria = isFusedCriteria ? opportunity.criteria as FusedCriterion[] : [];
  
  // Calculate overall disagreement index for fused criteria
  const overallDisagreement = fusedCriteria.length > 0 
    ? fusedCriteria.reduce((sum, c) => sum + c.fusionMetadata.disagreementIndex, 0) / fusedCriteria.length
    : 0;
    
  const needsVerification = overallDisagreement > 20;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scored': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'analyzing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sourcing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatValue = (criterion: any, value: number): string => {
    if (criterion.unit === '%') return `${value}%`;
    if (criterion.unit === 'USD') return `$${value.toLocaleString()}`;
    if (criterion.unit === 'searches') return value.toLocaleString();
    return `${value}${criterion.unit}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{opportunity.productName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn("text-xs", getStatusColor(opportunity.status))}>
              {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
            </Badge>
            {isFusedCriteria && (
              <Badge variant="outline" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Multi-source
              </Badge>
            )}
            {needsVerification && (
              <VerifyBadge disagreementIndex={overallDisagreement} />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onValidate && (
            <Button variant="outline" size="sm" onClick={onValidate}>
              Validate
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">Overall Score</span>
                <span className={cn("text-3xl font-bold", getScoreColor(opportunity.finalScore))}>
                  {opportunity.finalScore}
                </span>
              </div>
              <Progress value={opportunity.finalScore} className="h-2 mb-4" />
              
              {isFusedCriteria && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg. Confidence</span>
                    <div className="font-medium">
                      {Math.round(fusedCriteria.reduce((sum, c) => sum + c.fusionMetadata.confidenceScore, 0) / fusedCriteria.length * 100)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Disagreement</span>
                    <div className={cn("font-medium", needsVerification ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400")}>
                      {Math.round(overallDisagreement)}%
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Criteria Details */}
          <Card>
            <CardHeader>
              <CardTitle>Criteria Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunity.criteria?.map((criterion: any) => (
                  <div key={criterion.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{criterion.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {criterion.weight}%
                          </Badge>
                          {isFusedCriteria && (
                            <>
                              <ProvenancePopover criterion={criterion} />
                              <VerifyBadge disagreementIndex={criterion.fusionMetadata?.disagreementIndex || 0} />
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {criterion.description}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {formatValue(criterion, isFusedCriteria ? criterion.fusedValue : criterion.value)}
                        </div>
                        {isFusedCriteria && (
                          <div className="text-xs text-muted-foreground">
                            {Object.keys(criterion.bySource).length} sources
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress 
                        value={((isFusedCriteria ? criterion.fusedValue : criterion.value) / criterion.maxValue) * 100} 
                        className="h-1" 
                      />
                      
                      {criterion.threshold && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Threshold: {formatValue(criterion, criterion.threshold)}</span>
                          <span>Max: {formatValue(criterion, criterion.maxValue)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {opportunity.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {opportunity.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-sm font-medium">
                  {formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              {opportunity.updatedAt && (
                <div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                  <div className="text-sm font-medium">
                    {formatDistanceToNow(new Date(opportunity.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              )}
              
              {opportunity.lastRefreshedAt && (
                <div>
                  <div className="text-xs text-muted-foreground">Last Refreshed</div>
                  <div className="text-sm font-medium">
                    {formatDistanceToNow(new Date(opportunity.lastRefreshedAt), { addSuffix: true })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Source Info */}
          <Card>
            <CardHeader>
              <CardTitle>Source Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Primary Source</div>
                <div className="text-sm font-medium capitalize">
                  {opportunity.source || 'Manual'}
                </div>
              </div>
              
              {opportunity.importedAt && (
                <div>
                  <div className="text-xs text-muted-foreground">Imported</div>
                  <div className="text-sm font-medium">
                    {formatDistanceToNow(new Date(opportunity.importedAt), { addSuffix: true })}
                  </div>
                </div>
              )}
              
              {isFusedCriteria && (
                <div>
                  <div className="text-xs text-muted-foreground">Data Fusion</div>
                  <div className="text-sm font-medium">Multi-source aggregation</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Research Links
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              {needsVerification && (
                <Button variant="outline" size="sm" className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Verify Data
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailV2;