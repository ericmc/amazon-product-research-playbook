import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ScoringCriteria {
  id: string;
  name: string;
  weight: number;
  value: number;
  maxValue: number;
  description: string;
  threshold: number;
  guidance: {
    overview: string;
    steps: { tool: string; instruction: string; }[];
    tips: string[];
    examples: string[];
  };
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
const prettyNumber = (n: number) => n.toLocaleString();
const prettyMoney = (n: number) => n.toLocaleString(undefined, {style: "currency", currency: "USD"});

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
        
        // Update criteria with imported values
        setCriteria(prev => prev.map(criterion => {
          switch (criterion.id) {
            case 'revenue':
              return { ...criterion, value: data.revenue || criterion.value };
            case 'competition':
              return { ...criterion, value: data.competition || criterion.value };
            case 'demand':
              return { ...criterion, value: data.demand || criterion.value };
            case 'barriers':
              return { ...criterion, value: data.barriers || criterion.value };
            case 'seasonality':
              return { ...criterion, value: data.seasonality || criterion.value };
            case 'profitability':
              return { ...criterion, value: data.profitability || criterion.value };
            default:
              return criterion;
          }
        }));
        
        // Clear the session storage after use
        sessionStorage.removeItem('prefilledScoringData');
      } catch (error) {
        console.error('Error parsing prefilled data:', error);
      }
    }
  }, []);

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  };

  const getRecommendation = (score: number) => {
    if (score >= 80) return { text: "Strong Opportunity - Proceed to Analysis", icon: CheckCircle, color: "success" };
    if (score >= 60) return { text: "Moderate Opportunity - Review Carefully", icon: AlertTriangle, color: "warning" };
    return { text: "Weak Opportunity - Consider Alternatives", icon: AlertTriangle, color: "destructive" };
  };

  const finalScore = calculateScore();
  const recommendation = getRecommendation(finalScore);
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  
  const weakest = [...criteria]
    .map(c => {
      const normalized = ['competition','barriers','seasonality'].includes(c.id) ? c.maxValue - c.value : c.value;
      const pct = (normalized / c.maxValue) * 100;
      const weighted = (pct * c.weight) / 100;
      return {id: c.id, name: c.name, weighted};
    })
    .sort((a, b) => a.weighted - b.weighted)
    .slice(0, 3);
  
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
                    <Badge variant={meetsThreshold ? "default" : "destructive"}>
                      {criterion.weight}% weight
                    </Badge>
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