import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, X } from 'lucide-react';
import { SavedOpportunity } from '@/utils/OpportunityStorage';
import { useToast } from '@/hooks/use-toast';

interface RefreshModalProps {
  opportunity: SavedOpportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: (updatedOpportunity: SavedOpportunity) => void;
}

interface CriteriaValue {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  weight: number;
  description: string;
}

const RefreshModal: React.FC<RefreshModalProps> = ({
  opportunity,
  open,
  onOpenChange,
  onRefresh
}) => {
  const { toast } = useToast();
  const [refreshSource, setRefreshSource] = useState<string>('manual');
  const [refreshNotes, setRefreshNotes] = useState('');
  const [criteriaValues, setCriteriaValues] = useState<CriteriaValue[]>(
    opportunity.criteria?.map(c => ({
      id: c.id,
      name: c.name,
      value: c.value,
      maxValue: c.maxValue,
      weight: c.weight,
      description: c.description
    })) || []
  );

  const calculateScore = (criteria: CriteriaValue[]) => {
    let totalScore = 0;
    let totalWeight = 0;

    criteria.forEach(criterion => {
      const normalized = ['competition', 'barriers', 'seasonality'].includes(criterion.id) 
        ? criterion.maxValue - criterion.value 
        : criterion.value;
      const percentage = (normalized / criterion.maxValue) * 100;
      const weightedScore = (percentage * criterion.weight) / 100;
      
      totalScore += weightedScore;
      totalWeight += criterion.weight;
    });

    return Math.round(totalScore);
  };

  const updateCriteriaValue = (id: string, value: number) => {
    setCriteriaValues(prev => 
      prev.map(c => c.id === id ? { ...c, value } : c)
    );
  };

  const calculateGates = (criteria: CriteriaValue[]) => {
    const revenueGate = criteria.find(c => c.id === 'revenue')?.value >= 5000;
    const demandGate = criteria.find(c => c.id === 'demand')?.value >= 1000;
    const competitionGate = (criteria.find(c => c.id === 'competition')?.value || 0) <= 70;
    const marginGate = (opportunity.validation?.checklist?.marginCalculation?.computedMargin || 0) >= 20;

    return {
      revenue: revenueGate,
      demand: demandGate,
      competition: competitionGate,
      margin: marginGate
    };
  };

  const generateChangeSummary = () => {
    const changes: string[] = [];
    const oldScore = opportunity.finalScore;
    const newScore = calculateScore(criteriaValues);
    
    if (oldScore !== newScore) {
      const delta = newScore - oldScore;
      changes.push(`Score ${delta > 0 ? '+' : ''}${delta} pts`);
    }

    criteriaValues.forEach(newCrit => {
      const oldCrit = opportunity.criteria?.find(c => c.id === newCrit.id);
      if (oldCrit && oldCrit.value !== newCrit.value) {
        const delta = newCrit.value - oldCrit.value;
        const percentage = Math.round((delta / oldCrit.maxValue) * 100);
        changes.push(`${newCrit.name} ${delta > 0 ? '+' : ''}${percentage}%`);
      }
    });

    return changes.length > 0 ? changes.join(', ') : 'No significant changes';
  };

  const handleRefresh = () => {
    const oldScore = opportunity.finalScore;
    const newScore = calculateScore(criteriaValues);
    const gates = calculateGates(criteriaValues);
    const changeSummary = generateChangeSummary();

    // Calculate recommendation based on new score and gates
    const gatesPassedCount = Object.values(gates).filter(Boolean).length;

    // Calculate recommendation based on new score and gates
    const passedGatesCount = Object.values(gates).filter(Boolean).length;
    let recommendation = '';
    
    if (newScore >= 80 && passedGatesCount === 4) {
      recommendation = 'proceed';
    } else if (newScore >= 60 && gatesPassedCount >= 2) {
      recommendation = 'gather-data';
    } else {
      recommendation = 'reject';
    }

    const now = new Date().toISOString();
    
    const updatedOpportunity: SavedOpportunity = {
      ...opportunity,
      criteria: criteriaValues,
      finalScore: newScore,
      recommendation,
      lastRefreshedAt: now,
      updatedAt: now,
      history: [
        ...(opportunity.history || []),
        {
          date: now,
          summary: changeSummary,
          type: 'refresh',
          source: refreshSource,
          notes: refreshNotes,
          scoreChange: newScore - oldScore,
          oldScore,
          newScore
        }
      ]
    };

    onRefresh(updatedOpportunity);
    onOpenChange(false);
    
    toast({
      title: "Opportunity refreshed",
      description: `Score updated to ${newScore}. ${changeSummary}`,
    });
  };

  const newScore = calculateScore(criteriaValues);
  const gates = calculateGates(criteriaValues);
  const passedGatesCount = Object.values(gates).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Refresh Opportunity Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{opportunity.productName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Score:</span>
                  <Badge className="ml-2">{opportunity.finalScore}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">New Score:</span>
                  <Badge variant={newScore !== opportunity.finalScore ? "default" : "secondary"} className="ml-2">
                    {newScore}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Criteria Updates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Criteria Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {criteriaValues.map(criterion => (
                  <div key={criterion.id} className="space-y-2">
                    <Label htmlFor={criterion.id} className="text-sm font-medium">
                      {criterion.name}
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id={criterion.id}
                        type="number"
                        min="0"
                        max={criterion.maxValue}
                        value={criterion.value}
                        onChange={(e) => updateCriteriaValue(criterion.id, parseInt(e.target.value) || 0)}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {criterion.maxValue}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (Weight: {criterion.weight}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gates Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Decision Gates ({passedGatesCount}/4)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Revenue ≥ $5k/mo</span>
                  <Badge variant={gates.revenue ? "default" : "secondary"}>
                    {gates.revenue ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Demand ≥ 1k searches</span>
                  <Badge variant={gates.demand ? "default" : "secondary"}>
                    {gates.demand ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Competition ≤ 70</span>
                  <Badge variant={gates.competition ? "default" : "secondary"}>
                    {gates.competition ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Margin ≥ 20%</span>
                  <Badge variant={gates.margin ? "default" : "secondary"}>
                    {gates.margin ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refresh Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Refresh Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="source">Data Source</Label>
                <Select value={refreshSource} onValueChange={setRefreshSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jungle-scout">Jungle Scout</SelectItem>
                    <SelectItem value="helium-10">Helium 10</SelectItem>
                    <SelectItem value="product-opportunity-explorer">Product Opportunity Explorer</SelectItem>
                    <SelectItem value="manual">Manual Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Refresh Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={refreshNotes}
                  onChange={(e) => setRefreshNotes(e.target.value)}
                  placeholder="Note any key changes, market shifts, or insights..."
                  className="h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Save Refresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefreshModal;