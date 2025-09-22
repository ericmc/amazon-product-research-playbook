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
import { computeFinalScore, checkGates, getRecommendation } from "@/utils/scoringUtils";

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
  reviews: number;
  rating: number;
  price: number;
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
    demand: 1000,
    competition: 70,
    reviews: 100,
    rating: 4.0,
    price: 15
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

  // Calculate scoring criteria with descriptions
  const criteria: ScoringCriterion[] = [
    {
      id: 'revenue',
      name: 'Revenue Potential',
      value: scoringData.revenue,
      weight: 25,
      maxValue: 50000,
      icon: DollarSign,
      threshold: thresholds.revenue,
      description: 'Monthly revenue indicates market size and demand. Higher revenue suggests proven market viability.',
      suggestion: 'Target products with $5,000+ monthly revenue for sustainable business opportunities.',
      isInverted: false
    },
    {
      id: 'demand',
      name: 'Market Demand',
      value: scoringData.demand,
      weight: 20,
      maxValue: 50000,
      icon: TrendingUp,
      threshold: thresholds.demand,
      description: 'Search volume shows customer interest and market demand. Higher volume = more potential customers.',
      suggestion: 'Look for 1,000+ monthly searches to ensure sufficient market demand.',
      isInverted: false
    },
    {
      id: 'competition',
      name: 'Competition Level',
      value: 100 - scoringData.competition,
      weight: 20,
      maxValue: 100,
      icon: Target,
      threshold: 100 - thresholds.competition,
      description: 'Competition level affects your ability to gain market share. Lower competition = easier entry.',
      suggestion: 'Avoid markets with 70%+ competition unless you have strong differentiation.',
      isInverted: true
    },
    {
      id: 'reviews',
      name: 'Social Proof',
      value: Math.min(scoringData.reviewCount, 5000),
      weight: 15,
      maxValue: 5000,
      icon: Users,
      threshold: thresholds.reviews,
      description: 'Review count indicates product acceptance and market validation. More reviews = proven demand.',
      suggestion: 'Target products with 100+ reviews to ensure market validation.',
      isInverted: false
    },
    {
      id: 'rating',
      name: 'Quality Score',
      value: scoringData.rating * 20,
      weight: 10,
      maxValue: 100,
      icon: CheckCircle,
      threshold: thresholds.rating * 20,
      description: 'Star rating shows product quality and customer satisfaction. Higher ratings = better market position.',
      suggestion: 'Focus on products with 4.0+ star ratings for competitive advantage.',
      isInverted: false
    },
    {
      id: 'price',
      name: 'Price Point',
      value: Math.min(scoringData.price, 100),
      weight: 10,
      maxValue: 100,
      icon: DollarSign,
      threshold: thresholds.price,
      description: 'Price affects profit margins and market positioning. Sweet spot balances margins with volume.',
      suggestion: 'Target $15+ price points for healthy profit margins after fees and costs.',
      isInverted: false
    }
  ];

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
                    <p className="text-xs text-muted-foreground">Monthly searches</p>
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
                    <Label htmlFor="reviews-threshold">Reviews Threshold</Label>
                    <Input
                      id="reviews-threshold"
                      type="number"
                      value={thresholds.reviews}
                      onChange={(e) => saveThresholds({...thresholds, reviews: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min review count</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rating-threshold">Rating Threshold</Label>
                    <Input
                      id="rating-threshold"
                      type="number"
                      step="0.1"
                      value={thresholds.rating}
                      onChange={(e) => saveThresholds({...thresholds, rating: Number(e.target.value)})}
                      className="h-8"
                      max="5"
                    />
                    <p className="text-xs text-muted-foreground">Min star rating</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price-threshold">Price Threshold</Label>
                    <Input
                      id="price-threshold"
                      type="number"
                      value={thresholds.price}
                      onChange={(e) => saveThresholds({...thresholds, price: Number(e.target.value)})}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">Min price ($)</p>
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
                         criterion.id === 'demand' ? `${criterion.value.toLocaleString()} searches` :
                         criterion.id === 'competition' ? `${scoringData.competition}% competitive` :
                         criterion.id === 'reviews' ? `${criterion.value.toLocaleString()} reviews` :
                         criterion.id === 'rating' ? `${scoringData.rating.toFixed(1)} stars` :
                         criterion.id === 'price' ? `$${criterion.value.toFixed(2)}` : 
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
                        criterion.id === 'demand' ? `${criterion.threshold.toLocaleString()} searches` :
                        criterion.id === 'competition' ? `${thresholds.competition}% max` :
                        criterion.id === 'reviews' ? `${criterion.threshold} reviews` :
                        criterion.id === 'rating' ? `${thresholds.rating} stars` :
                        criterion.id === 'price' ? `$${criterion.threshold}` : 
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
            <div className={`flex items-center gap-2 ${gates.margin ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.margin ? 'bg-green-500' : 'bg-red-500'}`} />
              Margin Gate
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};