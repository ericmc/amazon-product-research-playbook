import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExternalTools } from "@/components/ExternalTools";

interface ScoringCriteria {
  id: string;
  name: string;
  weight: number;
  value: number;
  maxValue: number;
  description: string;
  threshold: number;
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
    id: "revenue",
    name: "Monthly Revenue Potential",
    weight: 25,
    value: 15000,
    maxValue: 50000,
    description: "Estimated monthly revenue for top 10 products",
    threshold: 10000,
    guidance: {
      overview: "Calculate total revenue potential by analyzing top performing products in your niche",
      steps: [
        { tool: "Jungle Scout Product Database", instruction: "Filter by your category and price range, then sum monthly revenue for top 10-15 listings" },
        { tool: "Helium 10 Black Box", instruction: "Set revenue filters and analyze revenue distribution for similar products" },
        { tool: "Manual Research", instruction: "Use (Price × Monthly Sales) for top products, exclude clear outliers" }
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
    id: "competition",
    name: "Competition Level",
    weight: 20,
    value: 65,
    maxValue: 100,
    description: "Lower score = less competition (inverted)",
    threshold: 70,
    guidance: {
      overview: "Measure market saturation by analyzing review counts and number of established sellers",
      steps: [
        { tool: "Jungle Scout", instruction: "Get review counts for top 10 listings, calculate median. Count how many have >1,000 reviews" },
        { tool: "Helium 10", instruction: "Use Black Box to analyze review distribution and competing products count" },
        { tool: "Amazon Search", instruction: "Search your main keyword, count products with >500 reviews on first 2 pages" }
      ],
      tips: [
        "Lower review counts = easier entry (this field is inverted - lower input = higher score)",
        "Look for markets with mix of high and low review products",
        "Consider review velocity (recent vs old reviews) for trend analysis"
      ],
      examples: [
        "Median 150 reviews = score ~85 (low competition)",
        "Median 800 reviews = score ~40 (high competition)", 
        "5+ products with >1,000 reviews = very competitive market"
      ]
    }
  },
  {
    id: "demand",
    name: "Market Demand",
    weight: 20,
    value: 2500,
    maxValue: 10000,
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
    id: "barriers",
    name: "Entry Barriers",
    weight: 15,
    value: 30,
    maxValue: 100,
    description: "Lower score = easier entry (inverted)",
    threshold: 60,
    guidance: {
      overview: "Evaluate barriers that might prevent or slow down new competitors entering the market",
      steps: [
        { tool: "Barrier Checklist", instruction: "Score each: Specialized tooling (20pts), Certifications/FDA (25pts), Hazmat/Oversized (15pts), High MOQ requirements (20pts), Fragile/Complex shipping (10pts), Patent risks (10pts)" },
        { tool: "Supplier Research", instruction: "Contact 3-5 suppliers to understand minimum orders, lead times, and complexity" },
        { tool: "Regulatory Check", instruction: "Research if product requires special approvals, testing, or compliance" }
      ],
      tips: [
        "This field is inverted - higher barriers = lower input score = higher final score",
        "Some barriers protect you after entry, others just slow you down",
        "Consider barriers that competitors also face vs. barriers unique to new entrants"
      ],
      examples: [
        "Simple product, no certifications needed = 20 barrier score",
        "FDA approval required = 60+ barrier score",
        "Custom tooling + certifications = 80+ barrier score"
      ]
    }
  },
  {
    id: "seasonality",
    name: "Seasonality Risk",
    weight: 10,
    value: 20,
    maxValue: 100,
    description: "Lower score = less seasonal (inverted)",
    threshold: 50,
    guidance: {
      overview: "Analyze how much demand fluctuates throughout the year to assess cash flow risk",
      steps: [
        { tool: "Jungle Scout", instruction: "Check seasonality graph for main keywords, look for consistent vs. spiky patterns" },
        { tool: "Helium 10 Trendster", instruction: "Analyze 12-month search trends for seasonal volatility" },
        { tool: "Google Trends", instruction: "Compare year-over-year patterns to identify seasonal sensitivity" }
      ],
      tips: [
        "This field is inverted - higher seasonality = lower input score = higher final score",
        "Steady year-round demand = low seasonality risk",
        "Products with predictable seasons can still be profitable with proper planning"
      ],
      examples: [
        "Kitchen essentials: consistent demand = 15 seasonality score",
        "Christmas decorations: extreme seasonal = 85 seasonality score",
        "Fitness equipment: January spike but steady otherwise = 35 seasonality score"
      ]
    }
  },
  {
    id: "profitability",
    name: "Profit Margins",
    weight: 10,
    value: 35,
    maxValue: 60,
    description: "Expected profit margin percentage",
    threshold: 25,
    guidance: {
      overview: "Calculate realistic profit margins after all costs to ensure sustainable business model",
      steps: [
        { tool: "Helium 10 Profitability Calculator", instruction: "Input estimated: Product cost, Amazon FBA fees, shipping/freight, any duties/tariffs" },
        { tool: "Manual Calculation", instruction: "Profit = Selling Price - (COGS + FBA fees + Freight + Duties + Amazon referral fee)" },
        { tool: "Supplier Quotes", instruction: "Get actual quotes for MOQ pricing, shipping costs, and any tooling/setup fees" }
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
  }
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const ScoringSystem = () => {
  const [criteria, setCriteria] = useState<ScoringCriteria[]>(defaultCriteria);
  const [productName, setProductName] = useState("Bamboo Kitchen Utensil Set");
  const [expandedGuidance, setExpandedGuidance] = useState<string>('');

  // Check for prefilled data from Data Intake
  React.useEffect(() => {
    const prefilledData = sessionStorage.getItem('prefilledScoringData');
    if (prefilledData) {
      try {
        const data = JSON.parse(prefilledData);
        setProductName(data.productName || "");
        
        // Update criteria with imported values and source tracking
        setCriteria(prev => prev.map(criterion => {
          let updatedCriterion = { ...criterion };
          
          switch (criterion.id) {
            case 'revenue':
              if (data.revenue !== undefined) {
                updatedCriterion.value = data.revenue;
                updatedCriterion.source = data.source || 'manual';
              }
              break;
            case 'competition':
              if (data.competition !== undefined) {
                updatedCriterion.value = data.competition;
                updatedCriterion.source = data.source || 'manual';
              }
              break;
            case 'demand':
              if (data.demand !== undefined) {
                updatedCriterion.value = data.demand;
                updatedCriterion.source = data.source || 'manual';
              }
              break;
            case 'barriers':
              if (data.barriers !== undefined) {
                updatedCriterion.value = data.barriers;
                updatedCriterion.source = data.source || 'manual';
              }
              break;
            case 'seasonality':
              if (data.seasonality !== undefined) {
                updatedCriterion.value = data.seasonality;
                updatedCriterion.source = data.source || 'manual';
              }
              break;
            case 'profitability':
              if (data.profitability !== undefined) {
                updatedCriterion.value = data.profitability;
                updatedCriterion.source = data.source || 'manual';
              }
              break;
          }
          
          return updatedCriterion;
        }));
        
        // Clear the session storage after use
        sessionStorage.removeItem('prefilledScoringData');
      } catch (error) {
        console.error('Error parsing prefilled data:', error);
      }
    }
  }, []);

  const generateActionableSuggestion = (criterion: ScoringCriteria): string => {
    const isInverted = ['competition', 'barriers', 'seasonality'].includes(criterion.id);
    const normalizedValue = isInverted ? criterion.maxValue - criterion.value : criterion.value;
    
    switch (criterion.id) {
      case 'revenue':
        if (criterion.value < criterion.threshold) {
          const needed = criterion.threshold - criterion.value;
          return `Revenue ${criterion.value.toLocaleString()} → increase target market by ${Math.round(needed/1000)}K/mo or explore higher-priced variants`;
        }
        return `Strong revenue potential at $${criterion.value.toLocaleString()}/month`;
        
      case 'demand':
        if (criterion.value < criterion.threshold) {
          const needed = criterion.threshold - criterion.value;
          return `Search volume ${criterion.value} → research ${Math.round(needed/100)}+ additional related keywords or consider broader market`;
        }
        return `Solid demand with ${criterion.value.toLocaleString()} monthly searches`;
        
      case 'competition':
        if (criterion.value > criterion.threshold) {
          return `Competition ${criterion.value} reviews → focus on underserved sub-niches or improve differentiation strategy`;
        }
        return `Manageable competition with ${criterion.value} median reviews`;
        
      case 'barriers':
        if (criterion.value < criterion.threshold) {
          return `Low barriers ${criterion.value}/100 → consider products requiring certifications, custom tooling, or specialized expertise`;
        }
        return `Good protective barriers at ${criterion.value}/100`;
        
      case 'seasonality':
        if (criterion.value > criterion.threshold) {
          return `High seasonality ${criterion.value}% → plan inventory cycles or bundle with complementary year-round products`;
        }
        return `Stable year-round demand (${criterion.value}% variation)`;
        
      case 'profitability':
        if (criterion.value < criterion.threshold) {
          const needed = criterion.threshold - criterion.value;
          return `Margin ${criterion.value}% → test +$${Math.round(needed * 0.5)} price increase or reduce freight costs by $${(needed * 0.01).toFixed(2)}/unit`;
        }
        return `Healthy margins at ${criterion.value}%`;
        
      default:
        return 'Review and optimize this metric';
    }
  };

  const getSourceLabel = (source?: string): string => {
    switch (source) {
      case 'jungle_scout': return 'JS';
      case 'helium_10': return 'H10';
      case 'amazon_poe': return 'POE';
      case 'manual': return 'Manual';
      default: return 'Manual';
    }
  };

  const evaluateGates = (): NextStepsAnalysis => {
    const gateResults: GateResult[] = criteria.map(criterion => {
      const isInverted = ['competition', 'barriers', 'seasonality'].includes(criterion.id);
      const normalizedValue = isInverted ? criterion.maxValue - criterion.value : criterion.value;
      const normalizedScore = (normalizedValue / criterion.maxValue) * 100;
      const weightedScore = (normalizedScore * criterion.weight) / 100;
      
      let passes = false;
      if (isInverted) {
        passes = criterion.value <= criterion.threshold;
      } else {
        passes = criterion.value >= criterion.threshold;
      }

      return {
        id: criterion.id,
        name: criterion.name,
        passes,
        currentValue: criterion.value,
        threshold: criterion.threshold,
        normalizedScore,
        weightedScore,
        source: getSourceLabel(criterion.source),
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
    setCriteria(prev => 
      prev.map(criterion => 
        criterion.id === id ? { ...criterion, value } : criterion
      )
    );
  };

  const saveOpportunity = () => {
    const entry = {
      productName,
      criteria,
      finalScore,
      createdAt: new Date().toISOString()
    };
    const key = "amazon-research-opportunities";
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
    localStorage.setItem(key, JSON.stringify([entry, ...existing]));
  };

  const calculateScore = () => {
    let totalScore = 0;
    
    criteria.forEach(criterion => {
      let normalizedValue = criterion.value;
      
      // Invert competition, barriers, and seasonality (lower is better)
      if (['competition', 'barriers', 'seasonality'].includes(criterion.id)) {
        normalizedValue = criterion.maxValue - criterion.value;
      }
      
      const score = (normalizedValue / criterion.maxValue) * 100;
      const weightedScore = (score * criterion.weight) / 100;
      totalScore += weightedScore;
    });
    
    return Math.round(totalScore);
  };

  const getRecommendation = (score: number) => {
    if (score >= 80) return { text: "Strong Opportunity - Proceed to Analysis", icon: CheckCircle, color: "success" };
    if (score >= 60) return { text: "Moderate Opportunity - Review Carefully", icon: AlertTriangle, color: "warning" };
    return { text: "Weak Opportunity - Consider Alternatives", icon: AlertTriangle, color: "destructive" };
  };

  const finalScore = calculateScore();
  const recommendation = getRecommendation(finalScore);
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const gateAnalysis = evaluateGates();
  
  const scoreColorMap = {
    excellent: "bg-success text-success-foreground",
    good: "bg-warning text-warning-foreground",
    poor: "bg-destructive text-destructive-foreground"
  };

  const getScoreIntentClass = (score: number) => {
    if (score >= 80) return scoreColorMap.excellent;
    if (score >= 60) return scoreColorMap.good;
    return scoreColorMap.poor;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Product Scoring System</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Quantitative framework to score and rank product opportunities
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scoring Criteria */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span>Product Analysis</span>
              </CardTitle>
              <CardDescription>
                Adjust the values based on your research data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="product-name" className="text-sm font-medium text-foreground">Product Name</label>
                <Input 
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="mt-1"
                  aria-describedby="product-name-description"
                />
              </div>
            </CardContent>
          </Card>

          {criteria.map((criterion) => {
            const normalizedValue = ['competition', 'barriers', 'seasonality'].includes(criterion.id) 
              ? criterion.maxValue - criterion.value
              : criterion.value;
            const percentage = (normalizedValue / criterion.maxValue) * 100;
            const meetsThreshold = criterion.value >= criterion.threshold || 
              (['competition', 'barriers', 'seasonality'].includes(criterion.id) && criterion.value <= criterion.threshold);

            return (
              <Card key={criterion.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{criterion.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={meetsThreshold ? "default" : "destructive"}>
                        {criterion.weight}% weight
                      </Badge>
                      {criterion.source && (
                        <Badge variant="outline" className="text-xs">
                          {getSourceLabel(criterion.source)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription id={`${criterion.id}-description`}>{criterion.description}</CardDescription>
                  
                  {/* Guidance Toggle */}
                  <Collapsible 
                    open={expandedGuidance === criterion.id} 
                    onOpenChange={() => setExpandedGuidance(expandedGuidance === criterion.id ? '' : criterion.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-fit p-0 h-auto text-xs text-primary hover:text-primary/80"
                      >
                        <HelpCircle className="w-3 h-3 mr-1" />
                        <span>How do I fill this?</span>
                        {expandedGuidance === criterion.id ? (
                          <ChevronUp className="w-3 h-3 ml-1" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <Card className="bg-muted/30">
                        <CardContent className="p-4 space-y-4">
                          {/* Overview */}
                          <div>
                            <p className="text-sm text-foreground">{criterion.guidance.overview}</p>
                          </div>

                          <Separator />

                          {/* Steps by Tool */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium">Step-by-Step Instructions</h5>
                            {criterion.guidance.steps.map((step, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-start space-x-2">
                                  <Badge variant="outline" className="text-xs min-w-fit">
                                    {step.tool}
                                  </Badge>
                                  <p className="text-xs text-foreground">{step.instruction}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          {/* Pro Tips */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">💡 Pro Tips</h5>
                            <div className="space-y-1">
                              {criterion.guidance.tips.map((tip, index) => (
                                <p key={index} className="text-xs text-muted-foreground">
                                  • {tip}
                                </p>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Examples */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">📋 Examples</h5>
                            <div className="space-y-1">
                              {criterion.guidance.examples.map((example, index) => (
                                <p key={index} className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                                  {example}
                                </p>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Input
                      type="number"
                      value={criterion.value}
                      onChange={(e) => updateCriteriaValue(criterion.id, clamp(Number(e.target.value), 0, criterion.maxValue))}
                      className="w-32"
                      aria-label={`${criterion.name} value`}
                      aria-describedby={`${criterion.id}-description`}
                    />
                    <div className="flex-1">
                      <Slider
                        value={[criterion.value]}
                        onValueChange={(value) => updateCriteriaValue(criterion.id, value[0])}
                        max={criterion.maxValue}
                        step={criterion.id === 'revenue' ? 1000 : 1}
                        className="flex-1"
                        aria-label={`${criterion.name} slider`}
                        aria-describedby={`${criterion.id}-description`}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground w-20">
                      0 - {criterion.maxValue.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Threshold: {criterion.threshold.toLocaleString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Progress value={percentage} className="w-20" />
                      <span className="text-sm font-medium">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Score Summary */}
        <div className="space-y-6">
          {/* External Tools */}
          <ExternalTools 
            productName={productName}
            context="scoring"
          />
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {totalWeight !== 100 && (
                <p className="text-sm text-amber-600">Heads up: weights sum to {totalWeight}. Consider adjusting to 100 for a true % score.</p>
              )}
              <div className="text-6xl font-bold text-foreground">{finalScore}</div>
              <Progress value={finalScore} className="w-full" />
              <Badge 
                className={cn("text-lg px-4 py-2", getScoreIntentClass(finalScore))}
              >
                {finalScore >= 80 ? "Excellent" : finalScore >= 60 ? "Good" : "Poor"}
              </Badge>
            </CardContent>
          </Card>

          {/* Gate Analysis & Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-foreground" />
                <span>Gate Analysis & Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Status */}
              <div className={cn(
                "p-4 rounded-lg border-2",
                gateAnalysis.overallStatus === 'strong' ? 'bg-success/10 border-success' :
                gateAnalysis.overallStatus === 'moderate' ? 'bg-warning/10 border-warning' :
                'bg-destructive/10 border-destructive'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {gateAnalysis.overallStatus === 'strong' ? '🎯 Strong Opportunity' :
                     gateAnalysis.overallStatus === 'moderate' ? '⚠️ Moderate Opportunity' :
                     '❌ Weak Opportunity'}
                  </h4>
                  <Badge variant={
                    gateAnalysis.overallStatus === 'strong' ? 'default' :
                    gateAnalysis.overallStatus === 'moderate' ? 'secondary' : 'destructive'
                  }>
                    {gateAnalysis.gateResults.filter(g => g.passes).length}/{gateAnalysis.gateResults.length} Gates Passed
                  </Badge>
                </div>
                <div className="space-y-1">
                  {gateAnalysis.recommendedActions.map((action, index) => (
                    <p key={index} className="text-sm">{action}</p>
                  ))}
                </div>
              </div>

              {/* Gate Results */}
              <div className="space-y-2">
                <h5 className="font-medium">Criteria Gate Status</h5>
                <div className="grid gap-2">
                  {gateAnalysis.gateResults.map((gate) => (
                    <div key={gate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {gate.passes ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        <div>
                          <span className="text-sm font-medium">{gate.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {gate.source}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {gate.currentValue} {gate.passes ? '≥' : '<'} {gate.threshold}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={gate.passes ? "default" : "destructive"} className="text-xs">
                        {Math.round(gate.weightedScore)}/25
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weakest Criteria Focus */}
              <div className="space-y-3">
                <h5 className="font-medium">🎯 Top 2 Improvement Areas</h5>
                {gateAnalysis.weakestCriteria.map((weak, index) => (
                  <Card key={weak.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{weak.name}</span>
                          <Badge variant="secondary" className="text-xs">{weak.source}</Badge>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {Math.round(weak.weightedScore)}/25 pts
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground bg-background p-3 rounded border-l-4 border-primary">
                        💡 {weak.suggestion}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {(() => {
                  const Icon = recommendation.icon;
                  return <Icon className="w-5 h-5 text-foreground" />;
                })()}
                <span>Recommendation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {recommendation.text}
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Next Steps:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {finalScore >= 80 ? (
                    <>
                      <li>• Proceed to competitive analysis</li>
                      <li>• Research top competitors</li>
                      <li>• Analyze keyword gaps</li>
                    </>
                  ) : finalScore >= 60 ? (
                    <>
                      <li>• Review weak criteria</li>
                      <li>• Gather more data</li>
                      <li>• Consider improvements</li>
                    </>
                  ) : (
                    <>
                      <li>• Find alternative products</li>
                      <li>• Reassess market selection</li>
                      <li>• Review search criteria</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Criteria Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criteria.map((criterion) => {
                const normalizedValue = ['competition', 'barriers', 'seasonality'].includes(criterion.id) 
                  ? criterion.maxValue - criterion.value
                  : criterion.value;
                const percentage = (normalizedValue / criterion.maxValue) * 100;
                const weightedScore = (percentage * criterion.weight) / 100;
                
                return (
                  <div key={criterion.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{criterion.name}</span>
                      <span className="font-medium">{Math.round(weightedScore)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={saveOpportunity}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Save Score & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScoringSystem;