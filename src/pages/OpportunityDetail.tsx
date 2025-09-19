import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, DollarSign, Users, Star } from "lucide-react";

const OpportunityDetail = () => {
  const { id } = useParams();

  // Mock data - in real app this would come from API/database
  const opportunity = {
    id: id,
    title: "Wireless Earbuds - Premium Segment",
    category: "Electronics",
    score: 87,
    status: "High Potential",
    description: "Premium wireless earbuds with active noise cancellation targeting fitness enthusiasts",
    metrics: {
      monthlySearches: "45,000",
      averagePrice: "$89.99",
      competitorCount: 23,
      profitMargin: "42%"
    },
    analysis: {
      marketDemand: 92,
      competition: 68,
      profitability: 85,
      barriers: 45
    },
    keyInsights: [
      "Growing trend in fitness and wellness market",
      "Gap in premium features under $100 price point",
      "High customer satisfaction scores for current leaders",
      "Opportunity for better battery life positioning"
    ],
    risks: [
      "Established brand dominance",
      "Rapid technology changes",
      "Supply chain complexity"
    ]
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/opportunities">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
                    <CardDescription className="mt-2">{opportunity.description}</CardDescription>
                  </div>
                  <Badge variant="default" className="shrink-0">
                    {opportunity.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">{opportunity.score}/100</div>
                  <div className="flex-1">
                    <Progress value={opportunity.score} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Market Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Market Demand</span>
                        <span>{opportunity.analysis.marketDemand}%</span>
                      </div>
                      <Progress value={opportunity.analysis.marketDemand} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Profitability</span>
                        <span>{opportunity.analysis.profitability}%</span>
                      </div>
                      <Progress value={opportunity.analysis.profitability} className="h-2" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Competition Level</span>
                        <span>{opportunity.analysis.competition}%</span>
                      </div>
                      <Progress value={opportunity.analysis.competition} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Entry Barriers</span>
                        <span>{opportunity.analysis.barriers}%</span>
                      </div>
                      <Progress value={opportunity.analysis.barriers} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Opportunities</h4>
                    <ul className="space-y-2">
                      {opportunity.keyInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 text-success mt-0.5 shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Risk Factors</h4>
                    <ul className="space-y-2">
                      {opportunity.risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <div className="h-3 w-3 bg-warning rounded-full mt-0.5 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Quick Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Monthly Searches</span>
                  </div>
                  <span className="font-medium">{opportunity.metrics.monthlySearches}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Average Price</span>
                  </div>
                  <span className="font-medium">{opportunity.metrics.averagePrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Competitors</span>
                  </div>
                  <span className="font-medium">{opportunity.metrics.competitorCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Profit Margin</span>
                  </div>
                  <span className="font-medium text-success">{opportunity.metrics.profitMargin}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="w-full justify-center">
                  {opportunity.category}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetail;