import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, TrendingUp, Target, AlertCircle, CheckCircle, DollarSign, Users, Settings, Info, ChevronDown, ChevronUp } from "lucide-react";
import { computeFinalScore, checkGates, getRecommendation, calculateH10Score } from "@/utils/scoringUtils";

interface ScoringData {
  productName: string;
  source: string;
  revenue: number;
  demand: number;
  competition: number;
  price: number;
  reviewCount: number;
  rating: number;
}

interface ScoringCriterion {
  id: string;
  name: string;
  value: number;
  weight: number;
  maxValue: number;
  icon: any;
  threshold: number;
  description: string;
  suggestion: string;
  isInverted?: boolean;
}

interface ScoringThresholds {
  revenue: number;
  demand: number;
  competition: number;
  priceValue: number;
  barriers: number;
  logistics: number;
}

interface ScoringPreviewProps {
  scoringData: ScoringData | null;
  onRefresh: () => void;
}

export const ScoringPreview: React.FC<ScoringPreviewProps> = ({ scoringData, onRefresh }) => {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  
  // Default thresholds (suggested values)
  const defaultThresholds: ScoringThresholds = {
    revenue: 5000,
    demand: 30,
    competition: 70,
    priceValue: 60,
    barriers: 40,
    logistics: 50
  };

  const [thresholds, setThresholds] = useState<ScoringThresholds>(defaultThresholds);

  // Load saved thresholds from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scoringThresholds');
    if (saved) {
      try {
        setThresholds(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading thresholds:', error);
      }
    }
  }, []);

  // Save thresholds to localStorage
  const saveThresholds = (newThresholds: ScoringThresholds) => {
    setThresholds(newThresholds);
    localStorage.setItem('scoringThresholds', JSON.stringify(newThresholds));
    toast({
      title: "Thresholds Updated",
      description: "Your scoring criteria have been saved.",
    });
  };

  const resetThresholds = () => {
    saveThresholds(defaultThresholds);
    toast({
      title: "Thresholds Reset",
      description: "Restored to suggested default values.",
    });
  };

  if (!scoringData) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Product to Score</h3>
          <p className="text-muted-foreground">
            Choose a product from the list above to see its scoring preview
          </p>
        </CardContent>
      </Card>
    );
  }

  // Helper functions for criteria mapping
  const getIconForCriteria = (id: string) => {
    switch (id) {
      case 'revenue': return DollarSign;
      case 'demand': return TrendingUp;
      case 'competition': return Target;
      case 'price_value': return DollarSign;
      case 'barriers': return AlertCircle;
      case 'logistics': return Users;
      default: return CheckCircle;
    }
  };

  const getDescriptionForCriteria = (id: string) => {
    switch (id) {
      case 'revenue': return 'ASIN Revenue indicates proven market demand and sales volume. Higher revenue suggests viable business opportunity.';
      case 'demand': return 'Demand growth based on review velocity and market indicators. Shows market momentum and customer interest.';
      case 'competition': return 'Competition level based on review count and quality ratings. Higher competition makes market entry harder.';
      case 'price_value': return 'Price-to-value ratio considering price point and customer satisfaction ratings. Sweet spot balances margins with competitiveness.';
      case 'barriers': return 'Entry barriers based on established competition and quality expectations. Lower barriers = easier market entry.';
      case 'logistics': return 'Logistics complexity based on size, weight, and storage requirements. Simpler logistics = lower operational costs.';
      default: return 'Product evaluation criterion for market viability assessment.';
    }
  };

  const getSuggestionForCriteria = (id: string) => {
    switch (id) {
      case 'revenue': return 'Target products with $5,000+ monthly revenue for sustainable business opportunities.';
      case 'demand': return 'Look for products with growing review count and strong market indicators.';
      case 'competition': return 'Avoid highly competitive markets (70%+) unless you have strong differentiation.';
      case 'price_value': return 'Target $15-$50 price range with good ratings for optimal profit margins.';
      case 'barriers': return 'Choose markets with moderate barriers - high enough to deter casual entrants, low enough to enter.';
      case 'logistics': return 'Prefer products with simple logistics to minimize operational complexity and costs.';
      default: return 'Optimize this criterion for better market positioning.';
    }
  };
  
  // Calculate scoring criteria with H10 field mappings
  const criteria: ScoringCriterion[] = calculateH10Score(scoringData, thresholds).map(criterion => ({
    ...criterion,
    icon: getIconForCriteria(criterion.id),
    description: getDescriptionForCriteria(criterion.id),
    suggestion: getSuggestionForCriteria(criterion.id),
    isInverted: ['competition', 'barriers'].includes(criterion.id)
  }));

  const overallScore = computeFinalScore(criteria);
  const gates = checkGates(criteria);
  const gatesPassed = Object.values(gates).filter(Boolean).length;
  const recommendation = getRecommendation(overallScore, gatesPassed);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'proceed': return 'text-green-600';
      case 'gather-data': return 'text-yellow-600';
      case 'reject': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'proceed': return 'bg-green-100 text-green-800 border-green-200';
      case 'gather-data': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reject': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Header with Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{scoringData.productName}</CardTitle>
              <CardDescription>Quick scoring analysis based on imported data</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Thresholds
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Threshold Settings */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleContent>
            <CardContent className="border-t bg-muted/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Scoring Thresholds</h4>
                  <Button variant="ghost" size="sm" onClick={resetThresholds}>
                    Reset to Defaults
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revenue-threshold">Revenue Threshold</Label>
                    <Input
                      id="revenue-threshold"
                      type="number"
                      value={thresholds.revenue}
                      onChange={(e) => saveThresholds({...thresholds, revenue: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Monthly revenue ($)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="demand-threshold">Demand Threshold</Label>
                    <Input
                      id="demand-threshold"
                      type="number"
                      value={thresholds.demand}
                      onChange={(e) => saveThresholds({...thresholds, demand: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Demand score (0-100)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="competition-threshold">Competition Limit</Label>
                    <Input
                      id="competition-threshold"
                      type="number"
                      value={thresholds.competition}
                      onChange={(e) => saveThresholds({...thresholds, competition: Number(e.target.value)})}
                      className="h-8"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">Max competition (%)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pricevalue-threshold">Price/Value Threshold</Label>
                    <Input
                      id="pricevalue-threshold"
                      type="number"
                      value={thresholds.priceValue}
                      onChange={(e) => saveThresholds({...thresholds, priceValue: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min price/value score</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="barriers-threshold">Barriers Threshold</Label>
                    <Input
                      id="barriers-threshold"
                      type="number"
                      value={thresholds.barriers}
                      onChange={(e) => saveThresholds({...thresholds, barriers: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min barriers score</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logistics-threshold">Logistics Threshold</Label>
                    <Input
                      id="logistics-threshold"
                      type="number"
                      value={thresholds.logistics}
                      onChange={(e) => saveThresholds({...thresholds, logistics: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min logistics score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className={`text-4xl font-bold ${getRecommendationColor(recommendation)}`}>
            {overallScore}/100
          </CardTitle>
          <CardDescription>Overall Product Viability Score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  overallScore >= 80 ? 'bg-green-500' :
                  overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <Badge className={`${getRecommendationBadge(recommendation)} text-sm px-4 py-2`}>
              {recommendation === 'proceed' ? '✅ Proceed' :
               recommendation === 'gather-data' ? '⚠️ Gather More Data' : '❌ Pass'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics with Tooltips */}
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {criteria.map((criterion) => {
            const IconComponent = criterion.icon;
            const normalizedScore = Math.min(100, (criterion.value / criterion.maxValue) * 100);
            const passed = criterion.isInverted ? 
              criterion.value >= criterion.threshold :
              criterion.value >= criterion.threshold;

            return (
              <Tooltip key={criterion.id}>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-md transition-shadow cursor-help">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Badge variant={passed ? "default" : "outline"} className="text-xs">
                          {passed ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{criterion.name}</h4>
                      <div className="text-xs text-muted-foreground mb-2">
                        {criterion.id === 'revenue' ? `$${criterion.value.toLocaleString()}/mo` :
                         criterion.id === 'demand' ? `${criterion.value.toFixed(0)} score` :
                         criterion.id === 'competition' ? `${criterion.value.toFixed(0)} competition` :
                         criterion.id === 'price_value' ? `${criterion.value.toFixed(0)} value score` :
                         criterion.id === 'barriers' ? `${criterion.value.toFixed(0)} barriers` :
                         criterion.id === 'logistics' ? `${criterion.value.toFixed(0)} logistics` : 
                         criterion.value.toLocaleString()}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${normalizedScore}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">{criterion.name}</p>
                    <p className="text-sm">{criterion.description}</p>
                    <p className="text-xs text-muted-foreground italic">{criterion.suggestion}</p>
                    <p className="text-xs border-t pt-2">
                      Threshold: {
                        criterion.id === 'revenue' ? `$${criterion.threshold.toLocaleString()}` :
                        criterion.id === 'demand' ? `${criterion.threshold} score` :
                        criterion.id === 'competition' ? `${criterion.threshold}% max` :
                        criterion.id === 'price_value' ? `${criterion.threshold} value` :
                        criterion.id === 'barriers' ? `${criterion.threshold} barriers` :
                        criterion.id === 'logistics' ? `${criterion.threshold} logistics` : 
                        criterion.threshold.toString()
                      }
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Gates Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Gates</CardTitle>
          <CardDescription>
            Key thresholds for product viability ({gatesPassed}/4 passed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className={`flex items-center gap-2 ${gates.revenue ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.revenue ? 'bg-green-500' : 'bg-red-500'}`} />
              Revenue Gate
            </div>
            <div className={`flex items-center gap-2 ${gates.demand ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.demand ? 'bg-green-500' : 'bg-red-500'}`} />
              Demand Gate
            </div>
            <div className={`flex items-center gap-2 ${gates.competition ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.competition ? 'bg-green-500' : 'bg-red-500'}`} />
              Competition Gate
            </div>
            <div className={`flex items-center gap-2 ${gates.barriers ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.barriers ? 'bg-green-500' : 'bg-red-500'}`} />
              Barriers Gate
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};