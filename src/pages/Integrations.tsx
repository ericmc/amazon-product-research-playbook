import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Download, 
  Upload,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Shield,
  Percent,
  Copy,
  FileText,
  ArrowRight,
  BarChart3,
  Home,
  Search
} from "lucide-react";

interface MetricInfo {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface IntegrationTool {
  name: string;
  description: string;
  website: string;
  toolUrl: string;
  logo: string;
  metrics: MetricInfo[];
  exportSteps: string[];
  exportFormats: string[];
  notes: string[];
}

const integrationTools: IntegrationTool[] = [
  {
    name: "Jungle Scout",
    description: "Monthly revenue (top 10–15), seasonality, review landscape",
    website: "https://www.junglescout.com/",
    toolUrl: "https://members.junglescout.com/",
    logo: "🦍",
    metrics: [
      {
        name: "Monthly Revenue",
        icon: DollarSign,
        description: "Top 10-15 listings monthly revenue estimates",
        color: "text-success"
      },
      {
        name: "Review Landscape",
        icon: Users,
        description: "Review counts and competitor analysis",
        color: "text-warning"
      },
      {
        name: "Seasonality Trends",
        icon: Calendar,
        description: "Seasonal variation and trend patterns",
        color: "text-muted-foreground"
      }
    ],
    exportSteps: [
      "Export Product Database results or copy table",
      "Sum monthly revenue for top listings",
      "Note seasonality graph patterns",
      "Capture review counts for competition analysis"
    ],
    exportFormats: ["CSV Export", "Copy Table Data"],
    notes: [
      "Focus on top 10-15 products for revenue analysis",
      "Seasonality graph shows market stability",
      "Review counts indicate barrier to entry"
    ]
  },
  {
    name: "Helium 10",
    description: "Keyword demand (search volume), competition signals",
    website: "https://www.helium10.com/",
    toolUrl: "https://members.helium10.com/",
    logo: "🎈",
    metrics: [
      {
        name: "Keyword Demand",
        icon: TrendingUp,
        description: "Magnet/Black Box search volume data",
        color: "text-primary"
      },
      {
        name: "Competition Signals",
        icon: Users,
        description: "Review counts and competitor density",
        color: "text-warning"
      },
      {
        name: "Revenue Potential",
        icon: DollarSign,
        description: "Black Box revenue estimates",
        color: "text-success"
      }
    ],
    exportSteps: [
      "Export or copy Magnet/Black Box results",
      "Capture search volume and competition fields",
      "Note keyword difficulty scores",
      "Record average review counts per niche"
    ],
    exportFormats: ["CSV Export", "Excel Export", "Copy to Clipboard"],
    notes: [
      "Magnet provides most accurate keyword demand data",
      "Black Box competition metrics show market saturation",
      "Keyword difficulty maps to barriers score"
    ]
  },
  {
    name: "Amazon POE",
    description: "Search & purchase trends (12-mo), price bands, review/returns context",
    website: "https://brandanalytics.amazon.com/",
    toolUrl: "https://brandanalytics.amazon.com/",
    logo: "📊",
    metrics: [
      {
        name: "Search & Purchase Trends",
        icon: TrendingUp,
        description: "12-month search and conversion patterns",
        color: "text-primary"
      },
      {
        name: "Price Bands",
        icon: DollarSign,
        description: "Price distribution and sweet spots",
        color: "text-success"
      },
      {
        name: "Review/Returns Context",
        icon: Shield,
        description: "Customer satisfaction indicators",
        color: "text-muted-foreground"
      }
    ],
    exportSteps: [
      "Copy key figures (trends/price/reviews) into our notes",
      "POE may not export CSV - manual data entry required",
      "Focus on 12-month trend data",
      "Note price band concentrations and review patterns"
    ],
    exportFormats: ["Manual Copy", "Screenshot + Notes"],
    notes: [
      "Most accurate Amazon data available",
      "Requires Brand Registry access",
      "Manual data transfer often necessary"
    ]
  }
];

const Integrations = () => {
  // Check for current product/keyword in state or URL params
  const currentProduct = ""; // This would come from global state or URL params
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-16">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">How This Fits The Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  <span>Tool Research</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <span>Import Data</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <span>Score Opportunity</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <span>Decide & Source</span>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/score">
                      <Home className="w-4 h-4 mr-2" />
                      Back to Score
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/opportunities">
                      View Opportunities
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full">
                    <Link to="/import">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Research Tools</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We work with Jungle Scout, Helium 10, and Amazon POE. Export data from these tools and import directly into our scoring system.
              </p>
              <Badge variant="outline" className="text-sm">
                No credentials stored • CSV & clipboard import • Privacy focused
              </Badge>
            </div>

            {/* Integration Cards */}
            <div className="grid lg:grid-cols-1 gap-6">
              {integrationTools.map((tool, index) => (
                <Card key={index} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{tool.logo}</div>
                        <div>
                          <CardTitle className="text-2xl">{tool.name}</CardTitle>
                          <CardDescription className="text-base">
                            {tool.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {currentProduct && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(currentProduct)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy "{currentProduct}"
                          </Button>
                        )}
                        <Button asChild variant="outline">
                          <a href={tool.toolUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Tool
                          </a>
                        </Button>
                        <Button asChild>
                          <Link to={`/import?source=${tool.name.toLowerCase().replace(' ', '')}`}>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Data
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* What We Capture Checklist */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                        <Download className="w-5 h-5 mr-2 text-primary" />
                        What To Capture
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {tool.metrics.map((metric, metricIndex) => (
                          <div key={metricIndex} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                            <metric.icon className={`w-5 h-5 mt-0.5 ${metric.color}`} />
                            <div>
                              <h4 className="font-medium text-foreground">{metric.name}</h4>
                              <p className="text-sm text-muted-foreground">{metric.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Field Mapping */}
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-2">Maps to scoring fields:</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">Revenue</Badge>
                          <Badge variant="secondary" className="text-xs">Demand</Badge>
                          <Badge variant="secondary" className="text-xs">Competition</Badge>
                          <Badge variant="secondary" className="text-xs">Seasonality</Badge>
                          <Badge variant="secondary" className="text-xs">Barriers</Badge>
                          <Badge variant="secondary" className="text-xs">Profitability</Badge>
                        </div>
                      </div>
                    </div>

                    {/* How to Get Data */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-primary" />
                        How to Get the Data
                      </h3>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="space-y-2 mb-4">
                          {tool.exportSteps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start space-x-3">
                              <Badge variant="outline" className="mt-0.5 text-xs">
                                {stepIndex + 1}
                              </Badge>
                              <p className="text-sm text-foreground">{step}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-sm font-medium text-foreground">Export options:</span>
                          {tool.exportFormats.map((format, formatIndex) => (
                            <Badge key={formatIndex} variant="secondary" className="text-xs">
                              <Copy className="w-3 h-3 mr-1" />
                              {format}
                            </Badge>
                          ))}
                        </div>

                        {tool.notes.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-foreground">💡 Pro Tips:</span>
                            {tool.notes.map((note, noteIndex) => (
                              <p key={noteIndex} className="text-xs text-muted-foreground ml-6">
                                • {note}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Export your data → Import here → Start scoring
                    </div>
                    <div className="flex space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={tool.website} target="_blank" rel="noopener noreferrer">
                          Learn More
                        </a>
                      </Button>
                      <Button asChild size="sm">
                        <Link to="/import">
                          Import Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

            {/* Safety Note */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="text-center py-6">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Privacy & Security</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We don't connect accounts or store credentials. We rely on CSV exports or clipboard data that you provide.
                  Your research data stays private and secure.
                </p>
              </CardContent>
            </Card>

            {/* Amazon POE Quick Guide */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="text-3xl">📊</div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Amazon POE Quick Guide</h3>
                  <p className="text-sm text-muted-foreground">When and how to use Product Opportunity Explorer</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* When to Use */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  When to Use POE
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Trend Analysis</p>
                        <p className="text-xs text-muted-foreground">Check if search volume is growing, stable, or declining</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Niche Size Validation</p>
                        <p className="text-xs text-muted-foreground">Confirm market demand is large enough for your goals</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Competition Assessment</p>
                        <p className="text-xs text-muted-foreground">See how concentrated the market is among top brands</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Seasonality Check</p>
                        <p className="text-xs text-muted-foreground">Identify seasonal patterns in search behavior</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field Mapping */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <Copy className="w-4 h-4 mr-2 text-blue-600" />
                  Copy POE Stats to Scoring Fields
                </h4>
                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">POE → Demand</Badge>
                      <div>
                        <p className="text-sm font-medium">Search Frequency Rank</p>
                        <p className="text-xs text-muted-foreground">Copy total search volume or search frequency rank directly to Demand field</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">POE → Competition</Badge>
                      <div>
                        <p className="text-sm font-medium">Market Concentration</p>
                        <p className="text-xs text-muted-foreground">Use "Brand Share %" - higher concentration = higher competition score</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">POE → Seasonality</Badge>
                      <div>
                        <p className="text-sm font-medium">Search Trend Variation</p>
                        <p className="text-xs text-muted-foreground">Calculate coefficient of variation from 12-month trend data</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Pro Tip:</strong> POE data is most valuable for demand validation and seasonality analysis. 
                      For revenue estimates, combine with Jungle Scout or Helium 10 data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Access Link */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Requires Amazon Brand Registry • Most accurate search data available
                </div>
                <Button asChild variant="outline">
                  <a href="https://sellercentral.amazon.com/opportunity-explorer" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open POE in Seller Central
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

            {/* Bottom CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="text-center py-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Import Your Data?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Export your research data from any of these tools and import it directly into our scoring system.
                No API connections needed - just CSV files or copy-paste data.
              </p>
              <div className="flex justify-center space-x-4">
                <Button asChild size="lg">
                  <Link to="/import">
                    <Upload className="w-5 h-5 mr-2" />
                    Import Data
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/score">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Start Scoring
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Integrations;