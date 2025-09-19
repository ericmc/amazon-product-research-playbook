import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Star, TrendingUp, AlertTriangle, Shield } from "lucide-react";

const competitorData = [
  {
    id: 1,
    name: "Brand A Kitchen Set",
    price: 29.99,
    revenue: 45000,
    reviews: 1245,
    rating: 4.5,
    weaknesses: ["Higher price", "Limited color options"],
    strengths: ["Strong brand", "High quality"]
  },
  {
    id: 2,
    name: "EcoUtensils Pro",
    price: 19.99,
    revenue: 28000,
    reviews: 567,
    rating: 4.2,
    weaknesses: ["Poor packaging", "Customer service issues"],
    strengths: ["Eco-friendly", "Good value"]
  },
  {
    id: 3,
    name: "Premium Kitchen Tools",
    price: 34.99,
    revenue: 32000,
    reviews: 892,
    rating: 4.4,
    weaknesses: ["Very expensive", "Heavy weight"],
    strengths: ["Premium materials", "Lifetime warranty"]
  }
];

const marketMetrics = {
  totalMarketSize: 2400000,
  topPlayerMarketShare: 35,
  averagePrice: 27.50,
  priceGap: { min: 15.99, max: 49.99 },
  customerSatisfaction: 4.2,
  reviewVelocity: "12 reviews/week"
};

export default function Analysis() {
  const [selectedTab, setSelectedTab] = useState("competitors");
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Phase 3: Competitive Analysis</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Analyze competitor landscape, identify market gaps, and position your product for success
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
            <TabsTrigger value="market">Market Overview</TabsTrigger>
            <TabsTrigger value="positioning">Product Positioning</TabsTrigger>
          </TabsList>

          <TabsContent value="competitors" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Competitor Cards */}
              <div className="lg:col-span-2 space-y-4">
                {competitorData.map((competitor) => (
                  <Card key={competitor.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{competitor.name}</CardTitle>
                        <Badge variant="outline">${competitor.price}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">${competitor.revenue.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{competitor.reviews}</div>
                          <div className="text-sm text-muted-foreground">Reviews</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{competitor.rating}</div>
                          <div className="text-sm text-muted-foreground">Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success">87%</div>
                          <div className="text-sm text-muted-foreground">Market Share</div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-foreground mb-2 flex items-center">
                            <Shield className="w-4 h-4 mr-1 text-success" />
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {competitor.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-muted-foreground">• {strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1 text-destructive" />
                            Weaknesses
                          </h4>
                          <ul className="space-y-1">
                            {competitor.weaknesses.map((weakness, index) => (
                              <li key={index} className="text-sm text-muted-foreground">• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Analysis Summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Competitive Landscape</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">3</div>
                      <div className="text-sm text-muted-foreground">Major Competitors</div>
                    </div>
                    <Progress value={65} className="w-full" />
                    <div className="text-xs text-muted-foreground">Market concentration: Medium</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Opportunity Score</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="text-4xl font-bold text-success">82/100</div>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      Strong Opportunity
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Market has clear gaps and room for improvement
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span>Market Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="text-2xl font-bold text-foreground">${marketMetrics.totalMarketSize.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Market Size</div>
                    </div>
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{marketMetrics.topPlayerMarketShare}%</div>
                      <div className="text-sm text-muted-foreground">Top Player Share</div>
                    </div>
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="text-2xl font-bold text-foreground">${marketMetrics.averagePrice}</div>
                      <div className="text-sm text-muted-foreground">Average Price</div>
                    </div>
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{marketMetrics.customerSatisfaction}</div>
                      <div className="text-sm text-muted-foreground">Avg Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Price Gap Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Market Range</span>
                      <span>${marketMetrics.priceGap.min} - ${marketMetrics.priceGap.max}</span>
                    </div>
                    <div className="w-full bg-accent rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <h4 className="font-medium text-success mb-2">Sweet Spot Identified</h4>
                    <p className="text-sm text-muted-foreground">
                      Opportunity exists in the $22-$28 range with premium features at competitive pricing.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="positioning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Product Positioning</CardTitle>
                <CardDescription>Based on competitive analysis and market gaps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border border-primary rounded-lg bg-primary/5">
                    <h3 className="font-semibold text-foreground mb-2">Value Proposition</h3>
                    <p className="text-sm text-muted-foreground">
                      Premium quality at mid-market pricing with superior customer experience
                    </p>
                  </div>
                  <div className="p-4 border border-success rounded-lg bg-success/5">
                    <h3 className="font-semibold text-foreground mb-2">Key Differentiators</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Better packaging design</li>
                      <li>• Enhanced customer support</li>
                      <li>• Unique color options</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-warning rounded-lg bg-warning/5">
                    <h3 className="font-semibold text-foreground mb-2">Target Price</h3>
                    <div className="text-2xl font-bold text-foreground">$24.99</div>
                    <p className="text-sm text-muted-foreground">Optimal market position</p>
                  </div>
                </div>
                
                <div className="p-6 bg-accent rounded-lg">
                  <h3 className="font-semibold text-foreground mb-4">Go-to-Market Strategy</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Phase 1: Launch (Months 1-3)</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Competitive pricing at $22.99</li>
                        <li>• Focus on review generation</li>
                        <li>• Target long-tail keywords</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Phase 2: Growth (Months 4-6)</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Price optimization to $24.99</li>
                        <li>• Expand keyword targeting</li>
                        <li>• Introduce product variations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Complete</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Competitive analysis shows strong market opportunity. Ready for final decision phase.
            </p>
            <Button className="bg-primary hover:bg-primary/90">
              Go to Decision Phase →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}