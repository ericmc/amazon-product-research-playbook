import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, TrendingUp, TrendingDown, Eye, RefreshCw, Plus, Edit } from "lucide-react";

interface ProductTracking {
  id: string;
  name: string;
  asin: string;
  status: "researching" | "validated" | "launched" | "monitoring";
  phase: "discovery" | "validation" | "analysis" | "decision" | "sourcing" | "live";
  score: number;
  lastUpdated: string;
  metrics: {
    bsr: number;
    reviews: number;
    rating: number;
    price: number;
    revenue: number;
  };
  competitors: number;
  keywordRank: { keyword: string; rank: number; trend: "up" | "down" | "stable" }[];
}

const trackingData: ProductTracking[] = [
  {
    id: "1",
    name: "Bamboo Kitchen Utensil Set",
    asin: "B08XYZ123",
    status: "validated",
    phase: "analysis",
    score: 87,
    lastUpdated: "2 hours ago",
    metrics: {
      bsr: 1250,
      reviews: 342,
      rating: 4.3,
      price: 24.99,
      revenue: 18500
    },
    competitors: 8,
    keywordRank: [
      { keyword: "bamboo utensils", rank: 15, trend: "up" },
      { keyword: "kitchen utensil set", rank: 28, trend: "stable" },
      { keyword: "eco friendly utensils", rank: 7, trend: "up" }
    ]
  },
  {
    id: "2",
    name: "LED Desk Organizer",
    asin: "B09ABC456",
    status: "researching",
    phase: "validation",
    score: 94,
    lastUpdated: "5 hours ago",
    metrics: {
      bsr: 890,
      reviews: 89,
      rating: 4.7,
      price: 39.99,
      revenue: 25600
    },
    competitors: 12,
    keywordRank: [
      { keyword: "desk organizer", rank: 22, trend: "down" },
      { keyword: "LED organizer", rank: 4, trend: "up" },
      { keyword: "office supplies", rank: 45, trend: "stable" }
    ]
  },
  {
    id: "3",
    name: "Silicone Phone Stand",
    asin: "B07DEF789",
    status: "launched",
    phase: "live",
    score: 72,
    lastUpdated: "1 day ago",
    metrics: {
      bsr: 2100,
      reviews: 156,
      rating: 4.1,
      price: 12.99,
      revenue: 8200
    },
    competitors: 15,
    keywordRank: [
      { keyword: "phone stand", rank: 38, trend: "stable" },
      { keyword: "silicone stand", rank: 12, trend: "up" },
      { keyword: "phone holder", rank: 52, trend: "down" }
    ]
  }
];

const TrackingDashboard = () => {
  const [products] = useState<ProductTracking[]>(trackingData);
  const [selectedProduct, setSelectedProduct] = useState<ProductTracking>(products[0]);
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "launched": return "success";
      case "validated": return "default";
      case "researching": return "warning";
      case "monitoring": return "secondary";
      default: return "outline";
    }
  };

  const getPhaseProgress = (phase: string) => {
    const phases = ["discovery", "validation", "analysis", "decision", "sourcing", "live"];
    return ((phases.indexOf(phase) + 1) / phases.length) * 100;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-success" />;
      case "down": return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <div className="w-4 h-4 bg-muted rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Product Tracking Dashboard</h2>
          <p className="text-muted-foreground">Monitor research progress and product performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{products.length}</div>
                <div className="text-sm text-muted-foreground">Products Tracked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">
                  {products.filter(p => p.status === "validated").length}
                </div>
                <div className="text-sm text-muted-foreground">Validated</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">
                  {products.filter(p => p.status === "researching").length}
                </div>
                <div className="text-sm text-muted-foreground">In Research</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(products.reduce((acc, p) => acc + p.score, 0) / products.length)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Score</div>
              </CardContent>
            </Card>
          </div>

          {/* Product List */}
          <Card>
            <CardHeader>
              <CardTitle>Product Pipeline</CardTitle>
              <CardDescription>Track progress through research phases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-foreground">{product.name}</h3>
                      <Badge variant={getStatusColor(product.status) as any}>
                        {product.status}
                      </Badge>
                      <Badge variant="outline">Score: {product.score}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ASIN:</span>
                      <div className="font-medium">{product.asin}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revenue:</span>
                      <div className="font-medium text-success">${product.metrics.revenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">BSR:</span>
                      <div className="font-medium">{product.metrics.bsr.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reviews:</span>
                      <div className="font-medium">{product.metrics.reviews}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Phase: {product.phase}</span>
                      <span className="text-muted-foreground">Updated {product.lastUpdated}</span>
                    </div>
                    <Progress value={getPhaseProgress(product.phase)} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Product Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Product</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProduct.id} onValueChange={(value) => {
                  const product = products.find(p => p.id === value);
                  if (product) setSelectedProduct(product);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Score</span>
                    <Badge variant="default">{selectedProduct.score}/100</Badge>
                  </div>
                  <Progress value={selectedProduct.score} />
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Key Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-accent rounded-lg">
                    <div className="text-lg font-bold text-foreground">
                      {selectedProduct.metrics.bsr.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">BSR</div>
                  </div>
                  <div className="text-center p-3 bg-accent rounded-lg">
                    <div className="text-lg font-bold text-foreground">
                      {selectedProduct.metrics.reviews}
                    </div>
                    <div className="text-sm text-muted-foreground">Reviews</div>
                  </div>
                  <div className="text-center p-3 bg-accent rounded-lg">
                    <div className="text-lg font-bold text-success">
                      ${selectedProduct.metrics.price}
                    </div>
                    <div className="text-sm text-muted-foreground">Price</div>
                  </div>
                  <div className="text-center p-3 bg-accent rounded-lg">
                    <div className="text-lg font-bold text-warning">
                      {selectedProduct.metrics.rating}/5
                    </div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    ${selectedProduct.metrics.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                </div>
              </CardContent>
            </Card>

            {/* Keyword Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Keyword Rankings</CardTitle>
                <CardDescription>Track keyword position changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedProduct.keywordRank.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{keyword.keyword}</div>
                      <div className="text-sm text-muted-foreground">Rank #{keyword.rank}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(keyword.trend)}
                      <Badge variant="outline" className="text-xs">
                        {keyword.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Research Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Research Notes & Next Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Latest Notes</label>
                  <Input placeholder="Add research notes..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Next Action</label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword-research">Keyword Research</SelectItem>
                      <SelectItem value="competitor-analysis">Competitor Analysis</SelectItem>
                      <SelectItem value="supplier-research">Supplier Research</SelectItem>
                      <SelectItem value="validation-check">Validation Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button className="w-full">
                Save Updates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackingDashboard;