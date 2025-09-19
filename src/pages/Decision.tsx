import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Package, Clock } from "lucide-react";

const decisionCriteria = [
  {
    id: 1,
    name: "Revenue Potential",
    weight: 25,
    score: 8.5,
    status: "strong",
    details: "$18-25K monthly potential"
  },
  {
    id: 2,
    name: "Competition Level",
    weight: 20,
    score: 7.2,
    status: "moderate",
    details: "Medium competition, clear differentiators"
  },
  {
    id: 3,
    name: "Market Trend",
    weight: 15,
    score: 9.1,
    status: "strong",
    details: "Growing market, stable demand"
  },
  {
    id: 4,
    name: "Sourcing Feasibility",
    weight: 15,
    score: 8.8,
    status: "strong",
    details: "Multiple reliable suppliers available"
  },
  {
    id: 5,
    name: "Investment Required",
    weight: 15,
    score: 7.8,
    status: "moderate",
    details: "$15K initial investment needed"
  },
  {
    id: 6,
    name: "Risk Level",
    weight: 10,
    score: 8.0,
    status: "strong",
    details: "Low risk, high reward potential"
  }
];

const financialProjections = {
  initialInvestment: 15000,
  monthlyRevenue: 22000,
  grossMargin: 35,
  breakEvenMonths: 4,
  roi12Months: 185
};

const riskFactors = [
  { risk: "Seasonal demand fluctuation", probability: "Low", impact: "Medium", mitigation: "Diversify product line" },
  { risk: "Supplier dependency", probability: "Medium", impact: "High", mitigation: "Multiple supplier contracts" },
  { risk: "Amazon policy changes", probability: "Medium", impact: "Medium", mitigation: "Multi-channel strategy" },
  { risk: "Competitive response", probability: "High", impact: "Medium", mitigation: "Strong brand building" }
];

export default function Decision() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  const weightedScore = decisionCriteria.reduce((total, criteria) => {
    return total + (criteria.score * criteria.weight / 100);
  }, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "strong": return <CheckCircle className="w-4 h-4 text-success" />;
      case "moderate": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "weak": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const getDecisionRecommendation = () => {
    if (weightedScore >= 8.0) return { decision: "GO", color: "success", reason: "Strong opportunity with high potential" };
    if (weightedScore >= 6.5) return { decision: "CONDITIONAL GO", color: "warning", reason: "Good opportunity with manageable risks" };
    return { decision: "NO GO", color: "destructive", reason: "Risks outweigh potential benefits" };
  };

  const recommendation = getDecisionRecommendation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Phase 4: Final Decision</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive evaluation and go/no-go decision based on weighted criteria analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Decision Matrix */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Overall Decision Score</span>
                  <Badge variant={recommendation.color === "success" ? "default" : recommendation.color === "warning" ? "secondary" : "destructive"}>
                    {recommendation.decision}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-foreground">{weightedScore.toFixed(1)}/10</div>
                  <Progress value={weightedScore * 10} className="w-full mt-4" />
                </div>
                <div className="p-4 bg-accent rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Recommendation: {recommendation.decision}</h3>
                  <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                </div>
              </CardContent>
            </Card>

            {/* Criteria Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Decision Criteria Analysis</CardTitle>
                <CardDescription>Weighted evaluation across key decision factors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {decisionCriteria.map((criteria) => (
                  <div key={criteria.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(criteria.status)}
                        <span className="font-medium text-foreground">{criteria.name}</span>
                        <Badge variant="outline">{criteria.weight}% weight</Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{criteria.score}/10</span>
                      </div>
                    </div>
                    <div className="ml-6">
                      <Progress value={criteria.score * 10} className="w-full mb-1" />
                      <p className="text-xs text-muted-foreground">{criteria.details}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Financial Projections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <span>Financial Projections</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <span className="text-sm font-medium">Initial Investment</span>
                      <span className="font-bold text-foreground">${financialProjections.initialInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <span className="text-sm font-medium">Monthly Revenue</span>
                      <span className="font-bold text-success">${financialProjections.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <span className="text-sm font-medium">Gross Margin</span>
                      <span className="font-bold text-foreground">{financialProjections.grossMargin}%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <span className="text-sm font-medium">Break-even</span>
                      <span className="font-bold text-foreground">{financialProjections.breakEvenMonths} months</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <span className="text-sm font-medium">12-Month ROI</span>
                      <span className="font-bold text-success">{financialProjections.roi12Months}%</span>
                    </div>
                    <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
                      <div className="text-lg font-bold text-success">Projected Profit Year 1</div>
                      <div className="text-2xl font-bold text-success">$92,400</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Decision Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-success hover:bg-success/90"
                  onClick={() => setSelectedAction("proceed")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Proceed to Sourcing
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSelectedAction("conditional")}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Proceed with Conditions
                </Button>
                <Button 
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setSelectedAction("revisit")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Revisit in 3 Months
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setSelectedAction("reject")}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Opportunity
                </Button>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Success Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm">Market Growth: 15% YoY</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm">Inventory Turnover: 8x/year</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm">Payback Period: 4 months</span>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskFactors.map((risk, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{risk.risk}</span>
                      <Badge variant="outline" className="text-xs">
                        {risk.probability}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Impact: {risk.impact} | {risk.mitigation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Next Steps */}
            {selectedAction && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedAction === "proceed" && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Recommended actions:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Contact top 3 suppliers</li>
                        <li>• Request product samples</li>
                        <li>• Negotiate pricing & MOQs</li>
                        <li>• Set up trademark search</li>
                      </ul>
                    </div>
                  )}
                  {selectedAction === "conditional" && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Conditions to meet:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Secure 2+ backup suppliers</li>
                        <li>• Test market with smaller MOQ</li>
                        <li>• Validate pricing strategy</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}