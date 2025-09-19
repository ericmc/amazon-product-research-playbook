import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, TrendingUp, Users, Star, DollarSign } from "lucide-react";
import ScoringSystem from "@/components/ScoringSystem";

const validationCriteria = [
  { 
    id: 1, 
    name: "Search Volume Trend", 
    status: "pending",
    metric: "1,200/month",
    target: ">1,000/month",
    passed: true 
  },
  { 
    id: 2, 
    name: "Seasonality Check", 
    status: "pending",
    metric: "Stable year-round",
    target: "<50% variation",
    passed: true 
  },
  { 
    id: 3, 
    name: "Keyword Difficulty", 
    status: "pending",
    metric: "42/100",
    target: "<60/100",
    passed: true 
  },
  { 
    id: 4, 
    name: "Patent Check", 
    status: "pending",
    metric: "Clear",
    target: "No conflicts",
    passed: true 
  },
  { 
    id: 5, 
    name: "Supplier Availability", 
    status: "pending",
    metric: "15+ suppliers",
    target: ">5 suppliers",
    passed: true 
  },
];

const sampleProducts = [
  {
    id: 1,
    name: "Bamboo Kitchen Utensil Set",
    price: 24.99,
    monthlyRevenue: 18500,
    reviews: 342,
    rating: 4.3,
    validationScore: 87,
    status: "strong"
  },
  {
    id: 2,
    name: "Silicone Phone Stand",
    price: 12.99,
    monthlyRevenue: 8200,
    reviews: 156,
    rating: 4.1,
    validationScore: 72,
    status: "moderate"
  },
  {
    id: 3,
    name: "LED Desk Organizer",
    price: 39.99,
    monthlyRevenue: 25600,
    reviews: 89,
    rating: 4.7,
    validationScore: 94,
    status: "strong"
  }
];

export default function Validation() {
  const [selectedProduct, setSelectedProduct] = useState(sampleProducts[0]);
  const [criteria] = useState(validationCriteria);
  
  const passedCriteria = criteria.filter(c => c.passed).length;
  const validationProgress = (passedCriteria / criteria.length) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "strong": return "success";
      case "moderate": return "warning";
      case "weak": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Phase 2: Market Validation</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Deep-dive analysis to validate demand, competition, and market opportunity for shortlisted products
          </p>
        </div>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Product Analysis</TabsTrigger>
            <TabsTrigger value="scoring">Scoring System</TabsTrigger>
            <TabsTrigger value="tracking">Progress Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Product Analysis */}
              <div className="lg:col-span-2 space-y-6">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Product Under Analysis</CardTitle>
                <CardDescription>Select a product from your discovery phase to validate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {sampleProducts.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedProduct.id === product.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-sm text-muted-foreground">${product.price}</div>
                        <Badge variant={getStatusColor(product.status) as any}>
                          Score: {product.validationScore}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Validation Results: {selectedProduct.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      {criterion.passed ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{criterion.name}</div>
                        <div className="text-sm text-muted-foreground">Target: {criterion.target}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{criterion.metric}</div>
                      <Badge variant={criterion.passed ? "default" : "destructive"}>
                        {criterion.passed ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Market Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <span className="font-medium">Monthly Revenue</span>
                      </div>
                      <span className="font-bold text-success">${selectedProduct.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="font-medium">Review Count</span>
                      </div>
                      <span className="font-bold text-foreground">{selectedProduct.reviews}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-warning" />
                        <span className="font-medium">Average Rating</span>
                      </div>
                      <span className="font-bold text-foreground">{selectedProduct.rating}/5.0</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-success" />
                        <span className="font-medium">Price Point</span>
                      </div>
                      <span className="font-bold text-success">${selectedProduct.price}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Validation Score */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-4xl font-bold text-foreground">{selectedProduct.validationScore}/100</div>
                <Progress value={selectedProduct.validationScore} className="w-full" />
                <Badge 
                  variant={getStatusColor(selectedProduct.status) as any}
                  className="text-lg px-4 py-2"
                >
                  {selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)} Opportunity
                </Badge>
              </CardContent>
            </Card>

            {/* Validation Checklist Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Criteria Passed</span>
                  <span className="text-sm font-medium">{passedCriteria}/{criteria.length}</span>
                </div>
                <Progress value={validationProgress} />
                <div className="text-xs text-muted-foreground">
                  {validationProgress >= 80 ? "Ready for analysis phase" : "Continue validation"}
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Competition Level</span>
                  <Badge variant="secondary">Medium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Seasonality Risk</span>
                  <Badge variant="default">Low</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Patent Risk</span>
                  <Badge variant="default">Low</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Supply Chain</span>
                  <Badge variant="default">Stable</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Product shows strong validation signals. Proceed to competitive analysis.
                </p>
                <Button className="w-full">
                  Go to Analysis →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="scoring">
        <ScoringSystem />
      </TabsContent>

      <TabsContent value="tracking" className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Validation Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Criteria Passed</span>
                <span className="text-sm font-medium">{passedCriteria}/{criteria.length}</span>
              </div>
              <Progress value={validationProgress} />
              <div className="text-xs text-muted-foreground">
                {validationProgress >= 80 ? "Ready for analysis phase" : "Continue validation"}
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Competition Level</span>
                <Badge variant="secondary">Medium</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Seasonality Risk</span>
                <Badge variant="default">Low</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Patent Risk</span>
                <Badge variant="default">Low</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Supply Chain</span>
                <Badge variant="default">Stable</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
      </div>
    </div>
  );
}