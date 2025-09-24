import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, BarChart3, TrendingUp, ArrowRight } from "lucide-react";
import StickyXScrollbar from "@/components/StickyxScrollbar";

const phases = [
  {
    id: 1,
    title: "Discovery",
    description: "Identify profitable product opportunities using systematic filtering",
    icon: Search,
    link: "/discovery",
    duration: "2-3 days"
  },
  {
    id: 2,
    title: "Validation",
    description: "Deep-dive market validation and demand analysis",
    icon: CheckCircle,
    link: "/validation",
    duration: "3-5 days"
  },
  {
    id: 3,
    title: "Analysis",
    description: "Competitive landscape and positioning strategy",
    icon: BarChart3,
    link: "/analysis",
    duration: "2-3 days"
  },
  {
    id: 4,
    title: "Decision",
    description: "Final go/no-go decision with financial projections",
    icon: TrendingUp,
    link: "/decision",
    duration: "1 day"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <h1 className="text-5xl font-bold text-foreground">
            Amazon Product Research Playbook
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A systematic, repeatable process to identify profitable product opportunities on Amazon. 
            From discovery to sourcing - make data-driven decisions with confidence.
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto opacity-75">
            Professional research tool by IPS • Independent software, not affiliated with Amazon
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <Link to="/discovery">
              Start Your Research <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Process Overview */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">4-Phase Research Process</h2>
            <p className="text-muted-foreground">Complete systematic approach to product research and validation</p>
          </div>
          
          <StickyXScrollbar maxHeight="75vh" barHeight={14}>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {phases.map((phase, index) => (
                <Card key={phase.id} className="relative group hover:shadow-lg transition-all">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                      <phase.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-business text-business-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {phase.id}
                    </div>
                    <CardTitle className="text-xl">{phase.title}</CardTitle>
                    <Badge variant="secondary">{phase.duration}</Badge>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <CardDescription className="text-sm">
                      {phase.description}
                    </CardDescription>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground" asChild>
                      <Link to={phase.link}>
                        Start Phase {phase.id}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </StickyXScrollbar>
        </div>

        {/* Key Benefits */}
        <div className="bg-accent rounded-lg p-8">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">What You'll Achieve</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">80%</div>
              <div className="text-sm text-muted-foreground">Reduction in failed product launches</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-success">$25K+</div>
              <div className="text-sm text-muted-foreground">Average monthly revenue potential</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-warning">7 Days</div>
              <div className="text-sm text-muted-foreground">Complete research cycle</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
