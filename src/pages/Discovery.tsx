import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, TrendingUp, DollarSign, Package } from "lucide-react";

const discoveryChecklist = [
  { id: 1, task: "Set target price range ($15-$50)", completed: false },
  { id: 2, task: "Define weight/size constraints (FBA friendly)", completed: false },
  { id: 3, task: "Identify target categories", completed: false },
  { id: 4, task: "Set minimum monthly search volume (1000+)", completed: false },
  { id: 5, task: "Define competition level criteria", completed: false },
];

const toolsNeeded = [
  { name: "Jungle Scout", purpose: "Product database search", status: "required" },
  { name: "Helium 10 Black Box", purpose: "Advanced filtering", status: "required" },
  { name: "AMZScout", purpose: "Secondary validation", status: "optional" },
];

export default function Discovery() {
  const [checklist, setChecklist] = useState(discoveryChecklist);
  const [searchQuery, setSearchQuery] = useState("");
  
  const completedTasks = checklist.filter(item => item.completed).length;
  const progressPercentage = (completedTasks / checklist.length) * 100;

  const toggleChecklistItem = (id: number) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Phase 1: Product Discovery</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Use systematic filtering to identify potential product opportunities that meet your investment criteria
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Progress value={progressPercentage} className="w-64" />
            <span className="text-sm text-muted-foreground">
              {completedTasks}/{checklist.length} tasks completed
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Workflow */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <span>Search Criteria Setup</span>
                </CardTitle>
                <CardDescription>
                  Configure your initial product search parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Price Range</label>
                    <div className="flex space-x-2 mt-1">
                      <Input placeholder="Min ($15)" />
                      <Input placeholder="Max ($50)" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Monthly Revenue</label>
                    <div className="flex space-x-2 mt-1">
                      <Input placeholder="Min ($5,000)" />
                      <Input placeholder="Max ($50,000)" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Weight (lbs)</label>
                    <Input placeholder="Max 3 lbs" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Review Count</label>
                    <Input placeholder="10-500 reviews" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Target Categories</label>
                  <Input 
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Home & Kitchen", "Sports & Outdoors", "Pet Supplies", "Beauty", "Automotive"].map((category) => (
                      <Badge key={category} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Search className="w-4 h-4 mr-2" />
                  Start Product Search
                </Button>
              </CardContent>
            </Card>

            {/* Key Metrics to Track */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <span>Key Discovery Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <DollarSign className="w-8 h-8 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">$25-45</div>
                    <div className="text-sm text-muted-foreground">Optimal Price Range</div>
                  </div>
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">&lt;3 lbs</div>
                    <div className="text-sm text-muted-foreground">Max Weight</div>
                  </div>
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <TrendingUp className="w-8 h-8 text-warning mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">1000+</div>
                    <div className="text-sm text-muted-foreground">Monthly Searches</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Discovery Checklist</CardTitle>
                <CardDescription>Complete these steps before moving to validation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="mt-1"
                    />
                    <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Required Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Required Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {toolsNeeded.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{tool.name}</div>
                      <div className="text-sm text-muted-foreground">{tool.purpose}</div>
                    </div>
                    <Badge variant={tool.status === "required" ? "default" : "secondary"}>
                      {tool.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you've identified 10-20 potential products, proceed to validation phase.
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={progressPercentage < 100}
                >
                  Go to Validation →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}