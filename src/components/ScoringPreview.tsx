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
import { computeFinalScore, checkGates, getRecommendation, calculateH10Score, getOpportunityRecommendation } from "@/utils/scoringUtils";

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
  gate?: boolean;
  gateDescription?: string;
}

interface ScoringThresholds {
  revenue: number;
  momentum: number;
  competition: number;
  barriers: number;
  logistics: number;
  lifecycle: number;
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
    revenue: 60,
    momentum: 60,
    competition: 60,
    barriers: 50,
    logistics: 60,
    lifecycle: 50
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
      case 'revenue_potential': return DollarSign;
      case 'sales_momentum': return TrendingUp;
      case 'competition': return Target;
      case 'price_signals': return DollarSign;
      case 'barriers': return AlertCircle;
      case 'logistics': return Users;
      case 'lifecycle': return RotateCcw;
      default: return CheckCircle;
    }
  };

  const getDescriptionForCriteria = (id: string) => {
    switch (id) {
      case 'revenue_potential': return 'Revenue indicates market size and demand validation. Higher revenue shows proven customer willingness to pay and market viability for sustainable business growth.';
      case 'sales_momentum': return 'Sales momentum shows market growth trajectory. Positive trends indicate expanding demand, while declining trends suggest market saturation or declining interest.';
      case 'competition': return 'Competition level affects market entry difficulty. Lower review counts and fewer active sellers indicate less saturated markets with better opportunities.';
      case 'barriers': return 'Entry barriers determine how difficult it is to compete. Fewer product variations and images suggest lower complexity and investment requirements for market entry.';
      case 'logistics': return 'Logistics burden impacts operational costs and complexity. Lighter, smaller items with lower storage fees reduce overhead and improve profit margins.';
      case 'lifecycle': return 'Product lifecycle and seasonality affect long-term stability. Mature products (12+ months) with consistent sales patterns offer more predictable business models.';
      default: return 'Product evaluation criterion for market viability assessment.';
    }
  };

  const getSuggestionForCriteria = (id: string) => {
    switch (id) {
      case 'revenue_potential': return 'Target products with ≥$5,000/month revenue to ensure sufficient market size for profitable business operations.';
      case 'sales_momentum': return 'Look for positive 90-day growth trends and increasing review velocity indicating expanding market demand.';
      case 'competition': return 'Choose markets with <500 reviews and ≤5 active sellers to minimize competitive pressure and entry barriers.';
      case 'barriers': return 'Prefer products with fewer variations and simpler listings to reduce complexity and initial investment requirements.';
      case 'logistics': return 'Select lighter, smaller items with lower storage fees to optimize operational costs and improve profit margins.';
      case 'lifecycle': return 'Target products with ≥12 months market presence and non-seasonal sales patterns for business stability.';
      default: return 'Optimize this criterion for better market positioning.';
    }
  };

  // Generate top signals based on product data
  const generateTopSignals = (data: ScoringData, criteria: ScoringCriterion[]) => {
    const signals = [];
    
    // Revenue signal
    if (data.revenue >= 10000) {
      signals.push(`Strong revenue at $${data.revenue.toLocaleString()}/month indicates proven market demand`);
    } else if (data.revenue >= 5000) {
      signals.push(`Solid revenue of $${data.revenue.toLocaleString()}/month meets minimum threshold`);
    }
    
    // Competition signal  
    if (data.reviewCount < 300) {
      signals.push(`Low competition with ${data.reviewCount} reviews creates easier market entry`);
    } else if (data.reviewCount < 500) {
      signals.push(`Moderate competition at ${data.reviewCount} reviews still allows market entry`);
    }
    
    // Rating/Quality signal
    if (data.rating >= 4.5) {
      signals.push(`High customer satisfaction (${data.rating} stars) shows strong product-market fit`);
    } else if (data.rating >= 4.0) {
      signals.push(`Good ratings (${data.rating} stars) indicate customer acceptance`);
    }
    
    // Price signal
    if (data.price >= 25 && data.price <= 75) {
      signals.push(`Optimal price point ($${data.price}) balances margins with accessibility`);
    }
    
    // Momentum signal
    if (data.reviewCount >= 100 && data.rating >= 4.0) {
      signals.push(`Growing market momentum with ${data.reviewCount} reviews and ${data.rating} rating`);
    }
    
    return signals.slice(0, 3);
  };

  // Generate top risks based on product data
  const generateTopRisks = (data: ScoringData, criteria: ScoringCriterion[]) => {
    const risks = [];
    
    // Revenue risk
    if (data.revenue < 5000) {
      risks.push(`Revenue below threshold at $${data.revenue.toLocaleString()}/month may indicate limited market size`);
    }
    
    // Competition risk
    if (data.reviewCount >= 1000) {
      risks.push(`High competition with ${data.reviewCount} reviews makes market entry difficult`);
    } else if (data.reviewCount >= 500) {
      risks.push(`Moderate-high competition (${data.reviewCount} reviews) requires strong differentiation`);
    }
    
    // Quality risk
    if (data.rating < 3.5) {
      risks.push(`Low ratings (${data.rating} stars) suggest product quality or market fit issues`);
    } else if (data.rating < 4.0) {
      risks.push(`Below-average ratings (${data.rating} stars) indicate customer satisfaction concerns`);
    }
    
    // Price risk
    if (data.price < 15) {
      risks.push(`Low price point ($${data.price}) may limit profit margins after fees and costs`);
    } else if (data.price > 100) {
      risks.push(`High price ($${data.price}) suggests oversized item with storage fee concerns`);
    }
    
    // Market maturity risk
    if (data.reviewCount < 50) {
      risks.push(`Limited market validation with only ${data.reviewCount} reviews may indicate new/risky market`);
    }
    
    // Seasonal/lifecycle risk
    if (data.reviewCount > 2000) {
      risks.push(`Mature market with ${data.reviewCount} reviews may have limited growth potential`);
    }
    
    return risks.slice(0, 3);
  };
  
  // Calculate scoring criteria with H10 field mappings
  const criteria: ScoringCriterion[] = calculateH10Score(scoringData, thresholds).map(criterion => ({
    ...criterion,
    icon: getIconForCriteria(criterion.id),
    description: getDescriptionForCriteria(criterion.id),
    suggestion: getSuggestionForCriteria(criterion.id),
    isInverted: false
  }));

  const overallScore = computeFinalScore(criteria);
  const gateResults = checkGates(criteria, scoringData);
  const { gates, failures } = gateResults;
  const opportunityRecommendation = getOpportunityRecommendation(overallScore, gateResults);
  const gatesPassed = Object.values(gates).filter(Boolean).length;

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Proceed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Monitor / Gather Data': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Reject': return 'bg-red-100 text-red-800 border-red-200';
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
              <CardDescription>Advanced scoring configuration • Product: {scoringData.productName}</CardDescription>
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
                    <Label htmlFor="revenue-threshold">Revenue Potential</Label>
                    <Input
                      id="revenue-threshold"
                      type="number"
                      value={thresholds.revenue}
                      onChange={(e) => saveThresholds({...thresholds, revenue: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min score (0-100)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="momentum-threshold">Sales Momentum</Label>
                    <Input
                      id="momentum-threshold"
                      type="number"
                      value={thresholds.momentum}
                      onChange={(e) => saveThresholds({...thresholds, momentum: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min score (0-100)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="competition-threshold">Competition</Label>
                    <Input
                      id="competition-threshold"
                      type="number"
                      value={thresholds.competition}
                      onChange={(e) => saveThresholds({...thresholds, competition: Number(e.target.value)})}
                      className="h-8"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">Min score (0-100)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="barriers-threshold">Barriers to Entry</Label>
                    <Input
                      id="barriers-threshold"
                      type="number"
                      value={thresholds.barriers}
                      onChange={(e) => saveThresholds({...thresholds, barriers: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min score (0-100)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logistics-threshold">Logistics Burden</Label>
                    <Input
                      id="logistics-threshold"
                      type="number"
                      value={thresholds.logistics}
                      onChange={(e) => saveThresholds({...thresholds, logistics: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min score (0-100)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lifecycle-threshold">Lifecycle & Seasonality</Label>
                    <Input
                      id="lifecycle-threshold"
                      type="number"
                      value={thresholds.lifecycle}
                      onChange={(e) => saveThresholds({...thresholds, lifecycle: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min score (0-100)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Opportunity Score & Recommendation */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className={`text-4xl font-bold ${opportunityRecommendation.color}`}>
            {overallScore}/100
          </CardTitle>
          <CardDescription>Opportunity Score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  overallScore >= 75 ? 'bg-green-500' :
                  overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <div className="space-y-2">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
                onClick={() => {
                  // Save opportunity logic here
                  toast({
                    title: "Opportunity Saved",
                    description: `${scoringData.productName} has been saved to your opportunities.`,
                  });
                }}
              >
                Save Opportunity
              </Button>
              <p className="text-sm text-muted-foreground">{opportunityRecommendation.description}</p>
              <p className="text-xs font-medium">{opportunityRecommendation.action}</p>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <strong>Weighted Score:</strong> Revenue (20%) + Sales Momentum (20%) + Competition (20%) + Barriers (15%) + Logistics (15%) + Lifecycle (10%)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Scoring Criteria */}
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-full mb-2">
            <h3 className="text-lg font-semibold">Scoring Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Individual criteria scores for {scoringData.productName} • Click cards for detailed explanations
            </p>
          </div>
          {criteria.map((criterion) => {
            const IconComponent = criterion.icon;
            const normalizedScore = Math.min(100, (criterion.value / criterion.maxValue) * 100);
            const passed = criterion.gate || (criterion.value >= criterion.threshold);

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
                        <div className="flex items-center gap-2">
                          <Badge variant={passed ? "default" : "outline"} className="text-xs">
                            {passed ? "✓" : "✗"}
                          </Badge>
                          <span className="text-xs font-medium">({criterion.weight}%)</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{criterion.name}</h4>
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <span>{criterion.value.toFixed(0)} score</span>
                        {criterion.gateDescription && (
                          <span className={`px-1.5 py-0.5 rounded text-xs ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Gate: {criterion.gateDescription}
                          </span>
                        )}
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
                    {criterion.gateDescription && (
                      <p className="text-xs border-t pt-2">
                        <strong>Gate:</strong> {criterion.gateDescription}
                      </p>
                    )}
                    <p className="text-xs border-t pt-2">
                      Score Threshold: {criterion.threshold}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Gates Status with Failure Reasons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Critical Gates Analysis</CardTitle>
          <CardDescription>
            Key thresholds for opportunity viability ({gatesPassed}/{Object.keys(gates).length} passed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(gates).map(([gateId, passed]) => {
                const criterion = criteria.find(c => c.id === gateId);
                if (!criterion) return null;
                
                return (
                  <div key={gateId} className={`flex items-start gap-3 p-3 rounded-lg border ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className={`w-3 h-3 rounded-full mt-0.5 ${passed ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${passed ? 'text-green-800' : 'text-red-800'}`}>
                        {criterion.name}
                      </div>
                      <div className={`text-xs mt-1 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                        {criterion.gateDescription}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Failure Reasons */}
            {failures.length > 0 && (
              <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-3">Reasons for Concern:</h4>
                <ul className="space-y-2">
                  {failures.map((failure, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{failure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* IPS Opportunity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5" />
            IPS Opportunity Summary
          </CardTitle>
          <CardDescription>
            Intelligent Product Selection analysis for {scoringData.productName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Signals */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Top Signals
              </h4>
              <div className="space-y-2">
                {generateTopSignals(scoringData, criteria).map((signal, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Risks */}
            <div className="space-y-3">
              <h4 className="font-medium text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Top Risks
              </h4>
              <div className="space-y-2">
                {generateTopRisks(scoringData, criteria).map((risk, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* IPS Context */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-muted-foreground mb-3">IPS Selection Context</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-blue-700">Market Entry</div>
                <p className="text-muted-foreground">
                  Low barriers (reviews, variations, sellers) = easier entry with less competition and complexity
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-purple-700">Operational Efficiency</div>
                <p className="text-muted-foreground">
                  Favorable logistics (weight, size tier, storage fees) = better landed cost and profit margins
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-emerald-700">Revenue Stability</div>
                <p className="text-muted-foreground">
                  Consistent revenue growth = stronger opportunity with predictable demand patterns
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};