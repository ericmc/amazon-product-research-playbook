import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Save } from "lucide-react";
import { HelpTooltip } from "@/components/HelpTooltip";
import { safeParse } from "@/utils/safeJson";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExternalTools } from "@/components/ExternalTools";
import { opportunityStorage, SavedOpportunity } from "@/utils/OpportunityStorage";
import { useToast } from "@/hooks/use-toast";
import { FusedCriterion, migrateLegacyCriterion, fuseValues, updateCriterionWithSourceData } from "@/utils/dataFusion";
import ProvenancePopover from "@/components/ProvenancePopover";
import VerifyBadge from "@/components/VerifyBadge";

interface ScoringCriteria {
  id: string;
  name: string;
  weight: number;
  value: number;
  maxValue: number;
  unit: string;
  description: string;
  threshold: number;
  isInverted?: boolean;
  source?: 'jungle_scout' | 'helium_10' | 'amazon_poe' | 'manual';
  guidance: {
    overview: string;
    steps: { tool: string; instruction: string; }[];
    tips: string[];
    examples: string[];
  };
}

interface GateResult {
  id: string;
  name: string;
  passes: boolean;
  currentValue: number;
  threshold: number;
  normalizedScore: number;
  weightedScore: number;
  source: string;
  suggestion: string;
}

interface NextStepsAnalysis {
  gateResults: GateResult[];
  weakestCriteria: GateResult[];
  overallStatus: 'strong' | 'moderate' | 'weak';
  recommendedActions: string[];
}

const defaultCriteria: ScoringCriteria[] = [
  {
    id: "demand",
    name: "Market Demand",
    weight: 25,
    value: 2500,
    maxValue: 10000,
    unit: "searches",
    description: "Monthly search volume for main keywords",
    threshold: 1000,
    guidance: {
      overview: "Assess total search demand by combining volume for main keyword plus related high-intent terms",
      steps: [
        { tool: "Helium 10 Magnet", instruction: "Enter main keyword, get search volume for primary term + top 2-3 related keywords" },
        { tool: "Jungle Scout Keyword Scout", instruction: "Research main keyword family and sum volumes for primary search terms" },
        { tool: "Amazon POE", instruction: "Use Search Frequency data for most accurate Amazon-specific demand (if available)" }
      ],
      tips: [
        "Include related keywords that indicate buying intent",
        "Avoid including overly broad terms that don't represent your specific product",
        "Consider seasonal patterns - use annual average or peak season data"
      ],
      examples: [
        "'Bamboo cutting board': 1,500 + 'eco cutting board': 800 = 2,300 total",
        "Single keyword with 5,000+ volume = strong standalone demand",
        "Multiple small keywords (200-400 each) can add up to meaningful demand"
      ]
    }
  },
  {
    id: "competition",
    name: "Competition Level", 
    weight: 20,
    value: 45,
    maxValue: 100,
    unit: "%",
    description: "Market saturation level (lower is better)",
    threshold: 70,
    isInverted: true,
    guidance: {
      overview: "Measure market saturation by analyzing review counts and number of established sellers",
      steps: [
        { tool: "Jungle Scout", instruction: "Get review counts for top 10 listings, calculate median. Score: 0-300 reviews = 20%, 300-700 = 50%, 700+ = 80%" },
        { tool: "Helium 10", instruction: "Use Black Box to analyze review distribution and competing products count" },
        { tool: "Amazon POE", instruction: "Check competition intensity rating if available" }
      ],
      tips: [
        "Lower competition scores = easier market entry",
        "Look for markets with mix of high and low review products",
        "Consider review velocity (recent vs old reviews) for trend analysis"
      ],
      examples: [
        "Median 150 reviews = 25% competition (low)",
        "Median 800 reviews = 75% competition (high)", 
        "5+ products with >1,000 reviews = very competitive market"
      ]
    }
  },
  {
    id: "margin",
    name: "Profit Margins",
    weight: 20,
    value: 35,
    maxValue: 60,
    unit: "%",
    description: "Expected profit margin percentage",
    threshold: 30,
    guidance: {
      overview: "Calculate realistic profit margins after all costs to ensure sustainable business model",
      steps: [
        { tool: "Helium 10 Profitability Calculator", instruction: "Input estimated: Product cost, Amazon FBA fees, shipping/freight, any duties/tariffs" },
        { tool: "Jungle Scout Sales Estimator", instruction: "Use profit calculator with real supplier quotes and shipping costs" },
        { tool: "Manual Calculation", instruction: "Profit = Selling Price - (COGS + FBA fees + Freight + Duties + Amazon referral fee)" }
      ],
      tips: [
        "Aim for minimum 30% margin for sustainable business",
        "Include all costs: product, shipping, FBA, referral fees, storage, returns",
        "Factor in promotional costs and PPC spending for customer acquisition"
      ],
      examples: [
        "$25 selling price - $8 COGS - $5 FBA - $2 shipping = $10 profit (40%)",
        "Complex electronics often have 15-25% margins due to competition",
        "Simple accessories can achieve 50%+ margins with good sourcing"
      ]
    }
  },
  {
    id: "revenue",
    name: "Revenue Potential",
    weight: 20,
    value: 15000,
    maxValue: 50000,
    unit: "USD",
    description: "Estimated monthly revenue for top 10 products",
    threshold: 10000,
    guidance: {
      overview: "Calculate total revenue potential by analyzing top performing products in your niche",
      steps: [
        { tool: "Jungle Scout Product Database", instruction: "Filter by your category and price range, then sum monthly revenue for top 10-15 listings" },
        { tool: "Helium 10 Black Box", instruction: "Set revenue filters and analyze revenue distribution for similar products" },
        { tool: "Amazon POE", instruction: "Use revenue estimates from POE data if available" }
      ],
      tips: [
        "Exclude extreme outliers (top 1-2 products if they're 5x+ higher than median)",
        "Focus on products with consistent sales patterns, not one-time spikes",
        "Consider seasonal variations - use 12-month average if available"
      ],
      examples: [
        "Kitchen gadgets: $25 price × 500 monthly sales = $12,500 revenue",
        "Top 10 products averaging $15K monthly = strong revenue potential",
        "Niche with only 1-2 high performers = risky revenue concentration"
      ]
    }
  },
  {
    id: "barriers",
    name: "Entry Barriers",
    weight: 10,
    value: 30,
    maxValue: 100,
    unit: "%",
    description: "Market entry difficulty (higher protects you)",
    threshold: 40,
    guidance: {
      overview: "Evaluate barriers that might prevent or slow down new competitors entering the market",
      steps: [
        { tool: "Barrier Checklist", instruction: "Score each: Specialized tooling (20pts), Certifications/FDA (25pts), Hazmat/Oversized (15pts), High MOQ requirements (20pts), Fragile/Complex shipping (10pts), Patent risks (10pts)" },
        { tool: "Supplier Research", instruction: "Contact 3-5 suppliers to understand minimum orders, lead times, and complexity" },
        { tool: "Regulatory Check", instruction: "Research if product requires special approvals, testing, or compliance" }
      ],
      tips: [
        "Higher barriers protect your market position after entry",
        "Some barriers protect you after entry, others just slow you down",
        "Consider barriers that competitors also face vs. barriers unique to new entrants"
      ],
      examples: [
        "Simple product, no certifications needed = 20%",
        "FDA approval required = 60%",
        "Custom tooling + certifications = 80%"
      ]
    }
  },
  {
    id: "seasonality",
    name: "Seasonality Risk",
    weight: 5,
    value: 20,
    maxValue: 100,
    unit: "%",
    description: "Demand fluctuation risk (lower is better)",
    threshold: 50,
    isInverted: true,
    guidance: {
      overview: "Analyze how much demand fluctuates throughout the year to assess cash flow risk",
      steps: [
        { tool: "Jungle Scout", instruction: "Check seasonality graph for main keywords, look for consistent vs. spiky patterns" },
        { tool: "Helium 10 Trendster", instruction: "Analyze 12-month search trends for seasonal volatility" },
        { tool: "Amazon POE", instruction: "Check seasonal trends in POE data if available" }
      ],
      tips: [
        "Lower seasonality scores = more stable cash flow",
        "Steady year-round demand = low seasonality risk",
        "Products with predictable seasons can still be profitable with proper planning"
      ],
      examples: [
        "Kitchen essentials: consistent demand = 15%",
        "Christmas decorations: extreme seasonal = 85%",
        "Fitness equipment: January spike but steady otherwise = 35%"
      ]
    }
  }
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const ScoringSystem = () => {
  const [criteria, setCriteria] = useState<FusedCriterion[]>([]);
  const [productName, setProductName] = useState("Bamboo Kitchen Utensil Set");
  const [expandedGuidance, setExpandedGuidance] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasAdjusted, setHasAdjusted] = useState(false);
  const [initialOpportunityScore, setInitialOpportunityScore] = useState<number | null>(null);
  const { toast } = useToast();

  // Initialize with migrated legacy criteria
  React.useEffect(() => {
    const migrated = defaultCriteria.map(criterion => migrateLegacyCriterion(criterion));
    setCriteria(migrated);

    // Load initial opportunity score (from H10 preview) if available
    const raw = sessionStorage.getItem('initialOpportunityScore');
    if (raw) {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n)) setInitialOpportunityScore(n);
    }
  }, []);

  // Check for prefilled data from Data Intake
  React.useEffect(() => {
    const prefilledData = sessionStorage.getItem('prefilledScoringData');
    if (prefilledData && criteria.length > 0) {
      const data = safeParse<any>(prefilledData, {});
      setProductName(data.productName || "");
      
      // Update criteria with imported values and source tracking
      setCriteria(prev => prev.map(criterion => {
        if (data[criterion.id] !== undefined) {
          return updateCriterionWithSourceData(
            criterion,
            data.source || 'manual',
            data[criterion.id],
            0.8,
            'Imported from data intake'
          );
        }
        return criterion;
      }));
      
      // Clear the session storage after use
      sessionStorage.removeItem('prefilledScoringData');
    }
  }, [criteria.length]);

  const generateActionableSuggestion = (criterion: FusedCriterion): string => {
    const isInverted = criterion.isInverted || false;
    const value = criterion.fusedValue;
    
    switch (criterion.id) {
      case 'revenue':
        if (value < criterion.threshold) {
          const needed = criterion.threshold - value;
          return `Revenue $${value.toLocaleString()} → increase target market by $${Math.round(needed/1000)}K/mo or explore higher-priced variants`;
        }
        return `Strong revenue potential at $${value.toLocaleString()}/month`;
        
      case 'demand':
        if (value < criterion.threshold) {
          const needed = criterion.threshold - value;
          return `Search volume ${value} → research ${Math.round(needed/100)}+ additional related keywords or consider broader market`;
        }
        return `Solid demand with ${value.toLocaleString()} monthly searches`;
        
      case 'competition':
        if (value > criterion.threshold) {
          return `Competition ${value}% → focus on underserved sub-niches or improve differentiation strategy`;
        }
        return `Manageable competition at ${value}%`;
        
      case 'margin':
        if (value < criterion.threshold) {
          const needed = criterion.threshold - value;
          return `Margin ${value}% → test +$${Math.round(needed * 0.5)} price increase or reduce freight costs by $${(needed * 0.01).toFixed(2)}/unit`;
        }
        return `Healthy margins at ${value}%`;
        
      case 'barriers':
        if (value < criterion.threshold) {
          return `Low barriers ${value}% → consider products requiring certifications, custom tooling, or specialized expertise`;
        }
        return `Good protective barriers at ${value}%`;
        
      case 'seasonality':
        if (value > criterion.threshold) {
          return `High seasonality ${value}% → plan inventory cycles or bundle with complementary year-round products`;
        }
        return `Stable year-round demand (${value}% variation)`;
        
      default:
        return 'Review and optimize this metric';
    }
  };

  const getSourceLabel = (criterion: FusedCriterion): string => {
    const sources = Object.keys(criterion.bySource);
    if (sources.length === 0) return 'Manual';
    if (sources.length === 1) {
      const source = sources[0];
      switch (source) {
        case 'jungle_scout': return 'JS';
        case 'helium_10': return 'H10';
        case 'amazon_poe': return 'POE';
        case 'validation': return 'Val';
        case 'manual': return 'Manual';
        default: return 'Manual';
      }
    }
    return `${sources.length} sources`;
  };

  const evaluateGates = (): NextStepsAnalysis => {
    const gateResults: GateResult[] = criteria.map(criterion => {
      const isInverted = criterion.isInverted || false;
      const value = criterion.fusedValue;
      const normalizedValue = isInverted ? criterion.maxValue - value : value;
      const normalizedScore = (normalizedValue / criterion.maxValue) * 100;
      const weightedScore = (normalizedScore * criterion.weight) / 100;
      
      // Use conservative fusion for gates when disagreement is high
      let gateValue = value;
      if (['margin', 'seasonality'].includes(criterion.id) && criterion.fusionMetadata.disagreementIndex > 20) {
        const sources = Object.values(criterion.bySource).filter(s => s !== undefined);
        if (sources.length > 1) {
          const values = sources.map(s => s!.value);
          if (isInverted) {
            gateValue = Math.max(...values); // More conservative for inverted criteria
          } else {
            gateValue = Math.min(...values); // More conservative for normal criteria
          }
        }
      }
      
      let passes = false;
      if (isInverted) {
        passes = gateValue <= criterion.threshold;
      } else {
        passes = gateValue >= criterion.threshold;
      }

      return {
        id: criterion.id,
        name: criterion.name,
        passes,
        currentValue: gateValue,
        threshold: criterion.threshold,
        normalizedScore,
        weightedScore,
        source: getSourceLabel(criterion),
        suggestion: generateActionableSuggestion(criterion)
      };
    });

    // Find two weakest criteria by weighted score
    const weakestCriteria = [...gateResults]
      .sort((a, b) => a.weightedScore - b.weightedScore)
      .slice(0, 2);

    const passedGates = gateResults.filter(g => g.passes).length;
    const totalGates = gateResults.length;
    
    let overallStatus: 'strong' | 'moderate' | 'weak' = 'weak';
    if (passedGates >= totalGates - 1) overallStatus = 'strong';
    else if (passedGates >= totalGates / 2) overallStatus = 'moderate';

    const recommendedActions = [];
    if (overallStatus === 'strong') {
      recommendedActions.push('✅ Strong opportunity - proceed to competitive analysis');
      recommendedActions.push('📊 Set up tracking dashboard for key metrics');
      recommendedActions.push('🎯 Begin sourcing and supplier outreach');
    } else if (overallStatus === 'moderate') {
      recommendedActions.push('⚠️ Address weak criteria before proceeding');
      recommendedActions.push('🔍 Gather additional market research');
      recommendedActions.push('💡 Consider product modifications or positioning changes');
    } else {
      recommendedActions.push('❌ High risk - significant improvements needed');
      recommendedActions.push('🔄 Reassess market selection or product concept');
      recommendedActions.push('📈 Focus on top 2 improvement areas first');
    }

    return {
      gateResults,
      weakestCriteria,
      overallStatus,
      recommendedActions
    };
  };

  const updateCriteriaValue = (id: string, value: number) => {
    setHasAdjusted(true);
    setCriteria(prev => 
      prev.map(criterion => 
        criterion.id === id 
          ? updateCriterionWithSourceData(criterion, 'manual', value, 0.9, 'User input')
          : criterion
      )
    );
  };

  const saveOpportunity = async () => {
    setIsSaving(true);
    try {
      const opportunity: SavedOpportunity = {
        id: crypto.randomUUID(),
        productName,
        criteria: criteria, // Store fused criteria
        finalScore,
        createdAt: new Date().toISOString(),
        status: 'scored',
        source: 'manual'
      };
      
      await opportunityStorage.saveOpportunity(opportunity);
      
      toast({
        title: "Opportunity Saved",
        description: `"${productName}" has been saved to your opportunities list.`,
      });

      // Navigate to opportunities page
      window.location.href = '/opportunities';
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      toast({
        title: "Save Failed",
        description: "Could not save opportunity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateScore = () => {
    // Use same calculation as ScoringPreview (computeFinalScore in scoringUtils.ts)
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = criteria.reduce((sum, criterion) => {
      const isInverted = criterion.isInverted || false;
      const normalizedValue = isInverted ? criterion.maxValue - criterion.fusedValue : criterion.fusedValue;
      const normalizedScore = (normalizedValue / criterion.maxValue) * 100;
      return sum + (normalizedScore * criterion.weight);
    }, 0);
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  };

  const getRecommendation = (score: number) => {
    const gateAnalysis = evaluateGates();
    const passedGates = gateAnalysis.gateResults.filter(g => g.passes).length;
    const totalGates = gateAnalysis.gateResults.length;

    if (score >= 80 && passedGates === totalGates) {
      return { text: "Excellent", icon: CheckCircle, color: "success" };
    } else if (score >= 60 && passedGates >= 2) {
      return { text: "Good", icon: TrendingUp, color: "warning" };
    } else {
      return { text: "Needs Work", icon: AlertTriangle, color: "destructive" };
    }
  };

  const calculated = calculateScore();
  const finalScore = hasAdjusted || initialOpportunityScore === null ? calculated : initialOpportunityScore;
  const recommendation = getRecommendation(finalScore);
  const gateAnalysis = evaluateGates();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Criteria */}
        <div className="lg:w-2/3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Scoring System
                  </CardTitle>
                  <CardDescription>
                    Multi-source data fusion with provenance tracking
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  V2 Fusion
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <label htmlFor="product-name" className="text-sm font-medium">
                  Product Name
                </label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name..."
                />
              </div>

              <Separator />

              {/* Criteria */}
              <div className="space-y-4">
                {criteria.map((criterion) => (
                  <Card key={criterion.id} className="relative">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{criterion.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {criterion.weight}%
                              </Badge>
                              <ProvenancePopover criterion={criterion} />
                              <VerifyBadge disagreementIndex={criterion.fusionMetadata.disagreementIndex} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {criterion.description}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {criterion.unit === '%' && `${criterion.fusedValue}%`}
                              {criterion.unit === 'USD' && `$${criterion.fusedValue.toLocaleString()}`}
                              {criterion.unit === 'searches' && criterion.fusedValue.toLocaleString()}
                              {!['%', 'USD', 'searches'].includes(criterion.unit) && `${criterion.fusedValue}${criterion.unit}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getSourceLabel(criterion)}
                            </div>
                          </div>
                        </div>

                        {/* Slider */}
                        <div className="space-y-2">
                          <Slider
                            value={[criterion.fusedValue]}
                            onValueChange={([value]) => updateCriteriaValue(criterion.id, value)}
                            max={criterion.maxValue}
                            step={criterion.unit === '%' ? 1 : criterion.maxValue / 100}
                            className="flex-1"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0{criterion.unit}</span>
                            <span>{criterion.maxValue}{criterion.unit}</span>
                          </div>
                        </div>

                        {/* Guidance Toggle */}
                        <Collapsible open={expandedGuidance === criterion.id} onOpenChange={(open) => setExpandedGuidance(open ? criterion.id : '')}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between">
                              <span className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Research Guidance
                              </span>
                              {expandedGuidance === criterion.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 pt-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-sm mb-3">{criterion.guidance.overview}</p>
                              
                              <div className="space-y-2">
                                <h6 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Research Steps</h6>
                                {criterion.guidance.steps.map((step, i) => (
                                  <div key={i} className="text-xs">
                                    <span className="font-medium text-primary">{step.tool}:</span> {step.instruction}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* External Tools */}
          <ExternalTools />
        </div>

        {/* Right column - Results */}
        <div className="lg:w-1/3 space-y-6">
          {/* Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <recommendation.icon className="h-5 w-5" />
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {finalScore}
                  </div>
                  <Badge 
                    variant={recommendation.color === "success" ? "default" : recommendation.color === "warning" ? "secondary" : "destructive"}
                    className="text-sm"
                  >
                    {recommendation.text}
                  </Badge>
                </div>

                <Progress value={finalScore} className="h-2" />

                <div className="text-center">
                  <Button 
                    onClick={saveOpportunity}
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Opportunity"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gate Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Gate Analysis</CardTitle>
              <CardDescription>
                {gateAnalysis.gateResults.filter(g => g.passes).length} of {gateAnalysis.gateResults.length} gates passed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gateAnalysis.gateResults.map((gate) => (
                  <div key={gate.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {gate.passes ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{gate.name}</span>
                    </div>
                    <div className="text-right text-xs">
                      <div className={gate.passes ? "text-green-600" : "text-red-600"}>
                        {gate.currentValue.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">
                        vs {gate.threshold.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gateAnalysis.recommendedActions.map((action, i) => (
                  <div key={i} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScoringSystem;