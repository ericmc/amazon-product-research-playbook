import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Database, 
  GitCompare, 
  Calendar, 
  TrendingDown, 
  Star,
  Trash2,
  RefreshCw,
  ClipboardList,
  ChevronRight,
  Package,
  Clock,
  Plus,
  Filter,
  SortAsc,
  AlertTriangle,
  X,
  ExternalLink,
  FileText
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import OpportunityChecklistComponent, { OpportunityChecklist } from "./OpportunityChecklist";
import DecisionTree from "./DecisionTree";
import SourcingPacket from "./SourcingPacket";
import { EmptyState } from "@/components/EmptyState";
import RefreshCadence from "./RefreshCadence";
import RefreshModal from "./RefreshModal";

import { SavedOpportunity } from "@/utils/OpportunityStorage";
import { isStale, getStalenessDays, sortOpportunities, filterStale } from "@/utils/refreshUtils";

interface WeakCriterion {
  id: string;
  name: string;
  score: number;
}

const OpportunitiesList = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<SavedOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<SavedOpportunity[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [viewingChecklist, setViewingChecklist] = useState<number | null>(null);
  const [viewingSourcingPacket, setViewingSourcingPacket] = useState<number | null>(null);
  const [viewingRefreshCadence, setViewingRefreshCadence] = useState<number | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [refreshingOpportunity, setRefreshingOpportunity] = useState<SavedOpportunity | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'highest-score' | 'stale-first'>('newest');
  const [showStaleOnly, setShowStaleOnly] = useState(false);

  const loadOpportunities = async () => {
    setIsLoading(true);
    try {
      const { opportunityStorage } = await import("@/utils/OpportunityStorage");
      const data = await opportunityStorage.getOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error("Error loading opportunities:", error);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  // Refresh opportunities when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      loadOpportunities();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    let filtered = showStaleOnly ? filterStale(opportunities) : opportunities;
    filtered = sortOpportunities(filtered, sortBy);
    setFilteredOpportunities(filtered);
  }, [opportunities, sortBy, showStaleOnly]);

  const getWeakCriteria = (opportunity: SavedOpportunity): WeakCriterion[] => {
    return opportunity.criteria
      .map(criterion => {
        const normalized = ['competition', 'barriers', 'seasonality'].includes(criterion.id) 
          ? criterion.maxValue - criterion.value 
          : criterion.value;
        const percentage = (normalized / criterion.maxValue) * 100;
        const weightedScore = (percentage * criterion.weight) / 100;
        
        return {
          id: criterion.id,
          name: criterion.name,
          score: weightedScore
        };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 2); // Show top 2 weakest
  };

  const scoreColorMap = {
    excellent: "bg-success text-success-foreground",
    good: "bg-warning text-warning-foreground", 
    poor: "bg-destructive text-destructive-foreground"
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return scoreColorMap.excellent;
    if (score >= 60) return scoreColorMap.good;
    return scoreColorMap.poor;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Poor";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectOpportunity = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(index.toString());
    } else {
      newSelected.delete(index.toString());
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(opportunities.map((_, index) => index.toString())));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    const indicesToDelete = Array.from(selectedIds).map(id => parseInt(id));
    const { opportunityStorage } = await import("@/utils/OpportunityStorage");
    
    for (const index of indicesToDelete) {
      if (opportunities[index]) {
        await opportunityStorage.deleteOpportunity(opportunities[index].id);
      }
    }
    
    await loadOpportunities();
    setSelectedIds(new Set());
  };

  const getSelectedOpportunities = () => {
    return Array.from(selectedIds)
      .map(id => opportunities[parseInt(id)])
      .filter(Boolean)
      .slice(0, 3); // Limit to 3 for comparison
  };

  const updateOpportunityChecklist = async (index: number, checklist: OpportunityChecklist) => {
    const opportunity = opportunities[index];
    if (!opportunity) return;
    
    const { opportunityStorage } = await import("@/utils/OpportunityStorage");
    const updatedOpportunity = {
      ...opportunity,
      checklist
    };
    
    await opportunityStorage.saveOpportunity(updatedOpportunity);
    await loadOpportunities();
  };

  const updateOpportunityRefreshData = async (index: number, refreshData: any) => {
    const opportunity = opportunities[index];
    if (!opportunity) return;
    
    const { opportunityStorage } = await import("@/utils/OpportunityStorage");
    const updatedOpportunity = {
      ...opportunity,
      refreshData
    };
    
    await opportunityStorage.saveOpportunity(updatedOpportunity);
    await loadOpportunities();
  };

  const updateOpportunitySourcingPacket = async (index: number, sourcingPacket: any) => {
    const opportunity = opportunities[index];
    if (!opportunity) return;
    
    const { opportunityStorage } = await import("@/utils/OpportunityStorage");
    const updatedOpportunity = {
      ...opportunity,
      sourcingPacket
    };
    
    await opportunityStorage.saveOpportunity(updatedOpportunity);
    await loadOpportunities();
  };

  const handleRefreshOpportunity = async (updatedOpportunity: SavedOpportunity) => {
    const { opportunityStorage } = await import("@/utils/OpportunityStorage");
    await opportunityStorage.saveOpportunity(updatedOpportunity);
    await loadOpportunities();
    setRefreshingOpportunity(null);
  };

  const getStalenessBadge = (opportunity: SavedOpportunity) => {
    if (!isStale(opportunity)) return null;
    
    const days = getStalenessDays(opportunity);
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Needs refresh ({days}d)
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show refresh cadence view if selected
  if (viewingRefreshCadence !== null && opportunities[viewingRefreshCadence]) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setViewingRefreshCadence(null)}
          className="mb-4"
        >
          ← Back to Opportunities
        </Button>
        <RefreshCadence
          opportunityIndex={viewingRefreshCadence}
          productName={opportunities[viewingRefreshCadence].productName}
          opportunity={opportunities[viewingRefreshCadence]}
          onUpdate={(refreshData) => updateOpportunityRefreshData(viewingRefreshCadence, refreshData)}
        />
      </div>
    );
  }

  // Show sourcing packet view if selected
  if (viewingSourcingPacket !== null && opportunities[viewingSourcingPacket]) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setViewingSourcingPacket(null)}
          className="mb-4"
        >
          ← Back to Opportunities
        </Button>
        <SourcingPacket
          opportunityIndex={viewingSourcingPacket}
          productName={opportunities[viewingSourcingPacket].productName}
          opportunity={opportunities[viewingSourcingPacket]}
          onUpdate={(packet) => updateOpportunitySourcingPacket(viewingSourcingPacket, packet)}
        />
      </div>
    );
  }

  // Show checklist view if selected
  if (viewingChecklist !== null && opportunities[viewingChecklist]) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setViewingChecklist(null)}
          className="mb-4"
        >
          ← Back to Opportunities
        </Button>
        <OpportunityChecklistComponent
          opportunityIndex={viewingChecklist}
          productName={opportunities[viewingChecklist].productName}
          checklist={opportunities[viewingChecklist].checklist}
          onUpdate={(checklist) => updateOpportunityChecklist(viewingChecklist, checklist)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Saved Opportunities</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review and compare your analyzed product opportunities
        </p>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Opportunities Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by analyzing products in the Scoring System to build your opportunity pipeline.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/score')}>
                <Plus className="w-4 h-4 mr-2" />
                New Score
              </Button>
              <Button variant="outline" onClick={loadOpportunities}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedIds.size === opportunities.length && opportunities.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all opportunities"
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({opportunities.length})
                </span>
              </div>
              {selectedIds.size >= 2 && selectedIds.size <= 3 && (
                <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-tour="btn-compare">
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare ({selectedIds.size})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Product Comparison</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto">
                      <ComparisonModal opportunities={getSelectedOpportunities()} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Opportunities</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} selected opportunities? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40" aria-label="Sort opportunities by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="highest-score">Highest Score</SelectItem>
                    <SelectItem value="stale-first">Stale First</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant={showStaleOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowStaleOnly(!showStaleOnly)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Stale {showStaleOnly && <X className="w-3 h-3 ml-1" />}
                </Button>
              </div>
              
              <Button onClick={() => navigate('/score')}>
                <Plus className="w-4 h-4 mr-2" />
                New Score
              </Button>
              <Button variant="outline" onClick={loadOpportunities}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredOpportunities.map((opportunity, index) => {
              const originalIndex = opportunities.findIndex(o => o.id === opportunity.id);
              const weakCriteria = getWeakCriteria(opportunity);
              const isSelected = selectedIds.has(originalIndex.toString());
              const opportunityIsStale = isStale(opportunity);

              return (
                <Card key={opportunity.id} className={isSelected ? "ring-2 ring-primary" : ""}>
                  <CardHeader className="pb-3">
                     <div className="flex items-start justify-between">
                       <div className="flex items-start space-x-3">
                         <Checkbox
                           checked={isSelected}
                           onCheckedChange={(checked) => handleSelectOpportunity(originalIndex, checked as boolean)}
                           aria-label={`Select ${opportunity.productName}`}
                         />
                         {/* Product Image */}
                         {opportunity.imageUrl && (
                           <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                             <img 
                               src={opportunity.imageUrl} 
                               alt="Product"
                               className="w-full h-full object-cover"
                               onError={(e) => {
                                 e.currentTarget.src = '/placeholder.svg';
                               }}
                             />
                           </div>
                         )}
                         <div className="space-y-1">
                           <div className="flex items-center gap-2">
                             <CardTitle className="text-lg">{opportunity.productName}</CardTitle>
                             {/* Amazon Link */}
                             {opportunity.asin && (
                               <a
                                 href={`https://www.amazon.com/dp/${opportunity.asin}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-blue-600 hover:text-blue-800 transition-colors"
                                 title="View on Amazon"
                               >
                                 <ExternalLink className="h-4 w-4" />
                               </a>
                             )}
                           </div>
                           <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                             <Calendar className="w-4 h-4" />
                             <span>{formatDate(opportunity.createdAt)}</span>
                             {getStalenessBadge(opportunity)}
                           </div>
                         </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={cn("text-lg px-3 py-1", getScoreColor(opportunity.finalScore))}>
                          {opportunity.finalScore}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-muted-foreground">
                            {getScoreLabel(opportunity.finalScore)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Overall Score</h4>
                        <Progress value={opportunity.finalScore} className="h-2" />
                      </div>
                      
                      {weakCriteria.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-destructive" />
                            <h4 className="text-sm font-medium text-foreground">Weakest Areas</h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {weakCriteria.map((criterion) => (
                              <Badge key={criterion.id} variant="outline" className="text-xs px-2 py-1">
                                {criterion.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-foreground mb-2">Decision Tree</h4>
                        <DecisionTree criteria={opportunity.criteria} />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                            className="flex items-center space-x-2"
                          >
                            <ClipboardList className="w-4 h-4" />
                            <span>View Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          
                          {opportunityIsStale && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setRefreshingOpportunity(opportunity)}
                              className="flex items-center space-x-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span>Refresh Data</span>
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingSourcingPacket(originalIndex)}
                            className="flex items-center space-x-2"
                          >
                            <Package className="w-4 h-4" />
                            <span>Sourcing Packet</span>
                            {opportunity.sourcingPacket && (
                              <Badge 
                                variant={
                                  opportunity.sourcingPacket.status === "in-tooling" ? "default" :
                                  opportunity.sourcingPacket.status === "samples" ? "secondary" :
                                  opportunity.sourcingPacket.status === "requested-quotes" ? "outline" :
                                  "destructive"
                                }
                                className="ml-1"
                              >
                                {opportunity.sourcingPacket.status.replace("-", " ")}
                              </Badge>
                            )}
                            <ChevronRight className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingRefreshCadence(originalIndex)}
                            className="flex items-center space-x-2"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Refresh Schedule</span>
                            {opportunity.refreshData && (
                              <Badge 
                                variant={
                                  opportunity.refreshData.isOverdue ? "destructive" :
                                  new Date() > new Date(new Date(opportunity.refreshData.nextRefreshDue).getTime() - 2 * 24 * 60 * 60 * 1000) ? "secondary" :
                                  "default"
                                }
                                className="ml-1"
                              >
                                {opportunity.refreshData.isOverdue ? "Overdue" : 
                                 new Date() > new Date(new Date(opportunity.refreshData.nextRefreshDue).getTime() - 2 * 24 * 60 * 60 * 1000) ? "Due Soon" : "On Track"}
                              </Badge>
                            )}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
      
      {/* Refresh Modal */}
      {refreshingOpportunity && (
        <RefreshModal
          opportunity={refreshingOpportunity}
          open={!!refreshingOpportunity}
          onOpenChange={(open) => !open && setRefreshingOpportunity(null)}
          onRefresh={handleRefreshOpportunity}
        />
      )}
    </div>
  );
};

const ComparisonModal = ({ opportunities }: { opportunities: SavedOpportunity[] }) => {
  if (opportunities.length < 2) return null;

  const allCriteria = opportunities[0]?.criteria || [];

  const getBestValue = (criterionId: string, values: number[]) => {
    const isLowerBetter = ['competition', 'barriers', 'seasonality'].includes(criterionId);
    return isLowerBetter ? Math.min(...values) : Math.max(...values);
  };

  const getDisplayValue = (criterion: any) => {
    const normalized = ['competition', 'barriers', 'seasonality'].includes(criterion.id) 
      ? criterion.maxValue - criterion.value 
      : criterion.value;
    return (normalized / criterion.maxValue) * 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success text-success-foreground";
    if (score >= 60) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `auto repeat(${opportunities.length}, 1fr)` }}>
        {/* Header row with product names and scores */}
        <div className="font-medium text-foreground">Product</div>
        {opportunities.map((opportunity, index) => (
          <div key={index} className="text-center space-y-2">
            <h4 className="font-medium text-foreground">{opportunity.productName}</h4>
            <Badge className={cn("text-lg px-3 py-1", getScoreColor(opportunity.finalScore))}>
              {opportunity.finalScore}
            </Badge>
          </div>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Criterion</TableHead>
              {opportunities.map((opportunity, index) => (
                <TableHead key={index} className="text-center font-medium">
                  {opportunity.productName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Overall Score row */}
            <TableRow>
              <TableCell className="font-medium">Overall Score</TableCell>
              {opportunities.map((opportunity, index) => {
                const isBest = opportunity.finalScore === Math.max(...opportunities.map(o => o.finalScore));
                return (
                  <TableCell key={index} className={cn("text-center", isBest && "bg-success/20 font-semibold text-success")}>
                    {opportunity.finalScore}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Criteria rows */}
            {allCriteria.map((criterion) => {
              const values = opportunities.map(opp => {
                const oppCriterion = opp.criteria.find(c => c.id === criterion.id);
                return oppCriterion ? getDisplayValue(oppCriterion) : 0;
              });
              const bestValue = getBestValue(criterion.id, values);

              return (
                <TableRow key={criterion.id}>
                  <TableCell className="font-medium">{criterion.name}</TableCell>
                  {opportunities.map((opportunity, oppIndex) => {
                    const oppCriterion = opportunity.criteria.find(c => c.id === criterion.id);
                    if (!oppCriterion) return <TableCell key={oppIndex} className="text-center">-</TableCell>;

                    const displayValue = getDisplayValue(oppCriterion);
                    const isBest = displayValue === bestValue;

                    return (
                      <TableCell key={oppIndex} className={cn("text-center", isBest && "bg-success/20 font-semibold text-success")}>
                        <div className="space-y-1">
                          <div>{Math.round(displayValue)}%</div>
                          <div className="text-xs text-muted-foreground">
                            {oppCriterion.value.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OpportunitiesList;