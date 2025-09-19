import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";

interface RefreshData {
  lastRefreshed: string;
  nextRefreshDue: string;
  refreshFrequency: number; // days
  isOverdue: boolean;
  trendNotes: Array<{
    date: string;
    oldScore: number;
    newScore: number;
    note: string;
    keyChanges: string[];
  }>;
  checklist: {
    dataRetrieved: boolean;
    scoreRecalculated: boolean;
    trendsAnalyzed: boolean;
    notesLogged: boolean;
    competitorsChecked: boolean;
  };
}

interface SavedOpportunity {
  productName: string;
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
    value: number;
    maxValue: number;
    threshold: number;
  }>;
  finalScore: number;
  createdAt: string;
  refreshData?: RefreshData;
}

interface RefreshCadenceProps {
  opportunityIndex: number;
  productName: string;
  opportunity: SavedOpportunity;
  onUpdate: (refreshData: RefreshData) => void;
}

const RefreshCadence: React.FC<RefreshCadenceProps> = ({
  opportunityIndex,
  productName,
  opportunity,
  onUpdate
}) => {
  const [refreshData, setRefreshData] = useState<RefreshData>(
    opportunity.refreshData || {
      lastRefreshed: "",
      nextRefreshDue: "",
      refreshFrequency: 7,
      isOverdue: false,
      trendNotes: [],
      checklist: {
        dataRetrieved: false,
        scoreRecalculated: false,
        trendsAnalyzed: false,
        notesLogged: false,
        competitorsChecked: false
      }
    }
  );

  const [newTrendNote, setNewTrendNote] = useState("");
  const [newCriteriaValues, setNewCriteriaValues] = useState<Record<string, number>>({});

  const updateRefreshData = (updates: Partial<RefreshData>) => {
    const updatedData = { ...refreshData, ...updates };
    setRefreshData(updatedData);
    onUpdate(updatedData);
  };

  const checklistItems = [
    { key: "dataRetrieved", label: "Data retrieved from Jungle Scout/Helium 10" },
    { key: "scoreRecalculated", label: "Opportunity score recalculated" },
    { key: "trendsAnalyzed", label: "Trends analyzed and compared" },
    { key: "competitorsChecked", label: "Competitor landscape reviewed" },
    { key: "notesLogged", label: "Trend notes documented" }
  ];

  const handleChecklistChange = (key: keyof RefreshData['checklist'], checked: boolean) => {
    updateRefreshData({
      checklist: {
        ...refreshData.checklist,
        [key]: checked
      }
    });
  };

  const calculateNextRefreshDate = (fromDate: string, frequency: number) => {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + frequency);
    return date.toISOString().split('T')[0];
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  };

  const markRefreshComplete = () => {
    const now = new Date().toISOString().split('T')[0];
    const nextDue = calculateNextRefreshDate(now, refreshData.refreshFrequency);
    
    updateRefreshData({
      lastRefreshed: now,
      nextRefreshDue: nextDue,
      isOverdue: false,
      checklist: {
        dataRetrieved: false,
        scoreRecalculated: false,
        trendsAnalyzed: false,
        notesLogged: false,
        competitorsChecked: false
      }
    });
  };

  const recalculateScore = () => {
    // Calculate new score with updated criteria values
    let totalWeightedScore = 0;
    let totalWeight = 0;

    const updatedCriteria = opportunity.criteria.map(criterion => {
      const newValue = newCriteriaValues[criterion.id] ?? criterion.value;
      
      // Normalize values (reverse for competition, barriers, seasonality)
      const normalized = ['competition', 'barriers', 'seasonality'].includes(criterion.id) 
        ? criterion.maxValue - newValue 
        : newValue;
      
      const percentage = Math.min((normalized / criterion.maxValue) * 100, 100);
      const weightedScore = (percentage * criterion.weight) / 100;
      
      totalWeightedScore += weightedScore;
      totalWeight += criterion.weight;
      
      return { ...criterion, value: newValue };
    });

    const newScore = Math.round(totalWeightedScore / totalWeight * 100);
    const oldScore = opportunity.finalScore;

    // Add trend note
    const keyChanges = Object.entries(newCriteriaValues)
      .filter(([_, value]) => value !== undefined)
      .map(([criterionId, newValue]) => {
        const criterion = opportunity.criteria.find(c => c.id === criterionId);
        if (criterion && criterion.value !== newValue) {
          const change = newValue > criterion.value ? "increased" : "decreased";
          return `${criterion.name} ${change} from ${criterion.value.toLocaleString()} to ${newValue.toLocaleString()}`;
        }
        return null;
      })
      .filter(Boolean) as string[];

    const trendNote = {
      date: new Date().toISOString().split('T')[0],
      oldScore,
      newScore,
      note: newTrendNote || "Score recalculated with updated data",
      keyChanges
    };

    updateRefreshData({
      trendNotes: [trendNote, ...refreshData.trendNotes],
      checklist: {
        ...refreshData.checklist,
        scoreRecalculated: true
      }
    });

    // Clear inputs
    setNewTrendNote("");
    setNewCriteriaValues({});

    // Update opportunity score (this would need to be passed back to parent)
    // For now, just show the calculation
    return { newScore, updatedCriteria };
  };

  const getCompletionRate = () => {
    const completed = Object.values(refreshData.checklist).filter(Boolean).length;
    return Math.round((completed / checklistItems.length) * 100);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const daysUntilRefresh = (dueDate: string) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const refreshStatus = refreshData.nextRefreshDue ? 
    (isOverdue(refreshData.nextRefreshDue) ? "overdue" : 
     daysUntilRefresh(refreshData.nextRefreshDue)! <= 2 ? "due-soon" : "on-track") : "not-scheduled";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5" />
                <span>Refresh Cadence: {productName}</span>
              </CardTitle>
              <CardDescription>
                Track data refresh schedule and monitor trends
              </CardDescription>
            </div>
            <Badge 
              variant={
                refreshStatus === "overdue" ? "destructive" :
                refreshStatus === "due-soon" ? "secondary" :
                refreshStatus === "on-track" ? "default" : "outline"
              }
            >
              {refreshStatus === "overdue" ? "Overdue" :
               refreshStatus === "due-soon" ? "Due Soon" :
               refreshStatus === "on-track" ? "On Track" : "Not Scheduled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Refresh Frequency (days)</Label>
              <Input
                type="number"
                value={refreshData.refreshFrequency}
                onChange={(e) => updateRefreshData({ refreshFrequency: parseInt(e.target.value) || 7 })}
                min="1"
                max="365"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Refreshed</Label>
              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(refreshData.lastRefreshed)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Next Refresh Due</Label>
              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(refreshData.nextRefreshDue)}</span>
                {refreshData.nextRefreshDue && (
                  <span className="text-xs text-muted-foreground">
                    ({daysUntilRefresh(refreshData.nextRefreshDue)} days)
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Refresh Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Refresh Checklist</h4>
              <Badge variant="outline">{getCompletionRate()}% Complete</Badge>
            </div>
            <div className="grid gap-3">
              {checklistItems.map((item) => (
                <div key={item.key} className="flex items-center space-x-3">
                  <Checkbox
                    checked={refreshData.checklist[item.key as keyof RefreshData['checklist']]}
                    onCheckedChange={(checked) => handleChecklistChange(item.key as keyof RefreshData['checklist'], checked as boolean)}
                  />
                  <span className="text-sm">{item.label}</span>
                  {refreshData.checklist[item.key as keyof RefreshData['checklist']] && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Update Data */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Update Criteria Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunity.criteria.map((criterion) => (
                <div key={criterion.id} className="space-y-2">
                  <Label>{criterion.name}</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder={`Current: ${criterion.value.toLocaleString()}`}
                      value={newCriteriaValues[criterion.id] || ""}
                      onChange={(e) => setNewCriteriaValues({
                        ...newCriteriaValues,
                        [criterion.id]: parseFloat(e.target.value) || 0
                      })}
                    />
                    <span className="text-xs text-muted-foreground min-w-0">
                      Was: {criterion.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>Trend Note</Label>
              <Textarea
                placeholder="What changed and why? Market conditions, new competitors, etc..."
                value={newTrendNote}
                onChange={(e) => setNewTrendNote(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={recalculateScore} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalculate Score & Log Trend
            </Button>
          </div>

          <Separator />

          {/* Trend History */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Trend History</h4>
            {refreshData.trendNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trend data yet</p>
            ) : (
              <div className="space-y-3">
                {refreshData.trendNotes.slice(0, 5).map((trend, index) => {
                  const scoreDiff = trend.newScore - trend.oldScore;
                  const isPositive = scoreDiff > 0;
                  
                  return (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : scoreDiff < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm font-medium">{formatDate(trend.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{trend.oldScore}</span>
                          <span className="text-sm">→</span>
                          <span className="text-sm font-medium">{trend.newScore}</span>
                          <Badge 
                            variant={isPositive ? "default" : scoreDiff < 0 ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{trend.note}</p>
                      {trend.keyChanges.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Key changes:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {trend.keyChanges.map((change, i) => (
                              <li key={i}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={markRefreshComplete}
              disabled={getCompletionRate() < 100}
            >
              Mark Refresh Complete
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const now = new Date().toISOString().split('T')[0];
                const nextDue = calculateNextRefreshDate(now, refreshData.refreshFrequency);
                updateRefreshData({ nextRefreshDue: nextDue });
              }}
            >
              Schedule Next Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefreshCadence;