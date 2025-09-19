import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Check, X, Star, DollarSign, Zap, Target } from "lucide-react";

const tools = [
  {
    id: 1,
    name: "Jungle Scout",
    category: "Product Research",
    price: "$49/month",
    rating: 4.8,
    features: ["Product Database", "Keyword Scout", "Rank Tracker", "Listing Builder"],
    pros: ["Largest product database", "Accurate sales estimates", "Chrome extension"],
    cons: ["Higher cost", "Learning curve"],
    bestFor: "Discovery & initial research",
    setupCompleted: false,
    essential: true
  },
  {
    id: 2,
    name: "Helium 10",
    category: "All-in-One Suite",
    price: "$37/month",
    rating: 4.7,
    features: ["Black Box", "Cerebro", "Magnet", "Frankenstein", "Scribbles"],
    pros: ["Comprehensive toolkit", "Advanced keyword research", "PPC optimization"],
    cons: ["Complex interface", "Feature overload"],
    bestFor: "Advanced research & optimization",
    setupCompleted: false,
    essential: true
  },
  {
    id: 3,
    name: "AMZScout",
    category: "Market Analysis",
    price: "$25/month",
    rating: 4.5,
    features: ["Product Tracker", "Keyword Tracker", "Stock Stats"],
    pros: ["Affordable pricing", "Good for beginners", "Clean interface"],
    cons: ["Limited database", "Basic features"],
    bestFor: "Budget-conscious validation",
    setupCompleted: false,
    essential: false
  },
  {
    id: 4,
    name: "Viral Launch",
    category: "Market Intelligence",
    price: "$59/month",
    rating: 4.6,
    features: ["Market Intelligence", "Keyword Research", "Listing Dossier"],
    pros: ["Detailed market insights", "Split testing", "Kinetic PPC"],
    cons: ["Expensive", "Steep learning curve"],
    bestFor: "Market intelligence & PPC",
    setupCompleted: false,
    essential: false
  }
];

const setupSteps = [
  { id: 1, tool: "Jungle Scout", task: "Create account and verify email", completed: false },
  { id: 2, tool: "Jungle Scout", task: "Install Chrome extension", completed: false },
  { id: 3, tool: "Jungle Scout", task: "Complete profile setup", completed: false },
  { id: 4, tool: "Helium 10", task: "Sign up for account", completed: false },
  { id: 5, tool: "Helium 10", task: "Install Chrome extension", completed: false },
  { id: 6, tool: "Helium 10", task: "Complete training modules", completed: false },
];

const ToolsetOverview = () => {
  const [checkedSteps, setCheckedSteps] = useState(setupSteps);
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  
  const completedSteps = checkedSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / checkedSteps.length) * 100;
  
  const toggleStep = (id: number) => {
    setCheckedSteps(prev => 
      prev.map(step => 
        step.id === id ? { ...step, completed: !step.completed } : step
      )
    );
  };
  
  const getToolsByCategory = (category: string) => {
    return tools.filter(tool => tool.category === category);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Amazon Research Toolset</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master the essential tools for product research, keyword analysis, and market validation
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Progress value={progressPercentage} className="w-64" />
          <span className="text-sm text-muted-foreground">
            {completedSteps}/{checkedSteps.length} setup steps completed
          </span>
        </div>
      </div>

      <Tabs defaultValue="comparison" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Tool Comparison</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tool List */}
            <div className="space-y-4">
              {tools.map((tool) => (
                <Card 
                  key={tool.id}
                  className={`cursor-pointer transition-all ${
                    selectedTool.id === tool.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTool(tool)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <Badge variant={tool.essential ? "default" : "secondary"}>
                        {tool.essential ? "Essential" : "Optional"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{tool.category}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span>{tool.rating}</span>
                      </div>
                      <span className="font-medium text-success">{tool.price}</span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Tool Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedTool.name}
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Site
                  </Button>
                </CardTitle>
                <CardDescription>{selectedTool.bestFor}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Key Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTool.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-success mb-2 flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      Pros
                    </h4>
                    <ul className="text-sm space-y-1">
                      {selectedTool.pros.map((pro, index) => (
                        <li key={index} className="text-muted-foreground">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-destructive mb-2 flex items-center">
                      <X className="w-4 h-4 mr-2" />
                      Cons
                    </h4>
                    <ul className="text-sm space-y-1">
                      {selectedTool.cons.map((con, index) => (
                        <li key={index} className="text-muted-foreground">• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="font-medium">{selectedTool.price}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span>{selectedTool.rating}/5</span>
                      </div>
                    </div>
                    <Button size="sm">
                      Start Free Trial
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Setup Checklist</CardTitle>
              <CardDescription>Complete these steps to get your toolset ready</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkedSteps.map((step) => (
                <div key={step.id} className="flex items-start space-x-3 p-3 bg-accent rounded-lg">
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={() => toggleStep(step.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {step.task}
                      </span>
                      <Badge variant="outline">{step.tool}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Discovery Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Jungle Scout → Product Database</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Helium 10 → Black Box filters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">3</span>
                    <span>AMZScout → Validation check</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-success" />
                  Keyword Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Helium 10 → Cerebro reverse ASIN</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Magnet → Keyword expansion</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs">3</span>
                    <span>Jungle Scout → Keyword Scout</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ToolsetOverview;