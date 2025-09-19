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
  BarChart3
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
    description: "Product research and market analysis for Amazon sellers",
    website: "https://www.junglescout.com/",
    toolUrl: "https://members.junglescout.com/",
    logo: "🦍",
    metrics: [
      {
        name: "Monthly Revenue",
        icon: DollarSign,
        description: "Estimated monthly revenue for top 10 products",
        color: "text-success"
      },
      {
        name: "Search Volume",
        icon: TrendingUp,
        description: "Monthly search volume for keywords",
        color: "text-primary"
      },
      {
        name: "Competition Level",
        icon: Users,
        description: "Number of reviews/competitors in niche",
        color: "text-warning"
      },
      {
        name: "Seasonality",
        icon: Calendar,
        description: "Seasonal trends and variation",
        color: "text-muted-foreground"
      }
    ],
    exportSteps: [
      "Open Jungle Scout Product Database or Opportunity Finder",
      "Set your filters (category, price range, revenue, etc.)",
      "Click 'Export' button in the top right",
      "Choose 'CSV' format",
      "Download will include: ASIN, Title, Price, Revenue, Reviews, etc."
    ],
    exportFormats: ["CSV Export", "Copy Table Data"],
    notes: [
      "Revenue data is most accurate for the scoring system",
      "Use keyword data for demand metrics",
      "Review count indicates competition level"
    ]
  },
  {
    name: "Helium 10",
    description: "Complete Amazon seller toolkit with product research",
    website: "https://www.helium10.com/",
    toolUrl: "https://members.helium10.com/",
    logo: "🎈",
    metrics: [
      {
        name: "Revenue Estimates",
        icon: DollarSign,
        description: "Black Box revenue estimates",
        color: "text-success"
      },
      {
        name: "Search Volume",
        icon: TrendingUp,
        description: "Magnet keyword search volumes",
        color: "text-primary"
      },
      {
        name: "Review Count",
        icon: Users,
        description: "Average reviews in category",
        color: "text-warning"
      },
      {
        name: "Profit Margins",
        icon: Percent,
        description: "Profitability calculator data",
        color: "text-success"
      }
    ],
    exportSteps: [
      "Use Black Box for product research with your filters",
      "Run keyword research in Magnet for search volume data",
      "In Black Box results, click 'Export' button",
      "Select products and export to CSV",
      "For keywords: In Magnet, use 'Export Keywords' option"
    ],
    exportFormats: ["CSV Export", "Excel Export", "Copy to Clipboard"],
    notes: [
      "Black Box provides the most comprehensive revenue data",
      "Magnet keyword data maps to our demand metrics",
      "Use Profitability Calculator for margin inputs"
    ]
  },
  {
    name: "Amazon POE",
    description: "Amazon's own Product Opportunity Explorer for brand owners",
    website: "https://brandanalytics.amazon.com/",
    toolUrl: "https://brandanalytics.amazon.com/",
    logo: "📊",
    metrics: [
      {
        name: "Search Frequency",
        icon: TrendingUp,
        description: "Real Amazon search data",
        color: "text-primary"
      },
      {
        name: "Competition",
        icon: Users,
        description: "Market concentration metrics",
        color: "text-warning"
      },
      {
        name: "Click Share",
        icon: Shield,
        description: "Market share data",
        color: "text-muted-foreground"
      },
      {
        name: "Seasonal Trends",
        icon: Calendar,
        description: "Historical search patterns",
        color: "text-muted-foreground"
      }
    ],
    exportSteps: [
      "Access Product Opportunity Explorer (requires Brand Registry)",
      "Search for your product categories or keywords",
      "View the opportunity metrics table",
      "Click 'Download' or 'Export' button",
      "Select date range and format (usually CSV)"
    ],
    exportFormats: ["CSV Download", "Copy Table"],
    notes: [
      "Most accurate search data since it's from Amazon directly",
      "Requires Amazon Brand Registry access",
      "Search frequency maps directly to our demand metrics"
    ]
  }
];

const Integrations = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Tool Integrations</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect your favorite Amazon research tools with our scoring system. 
              Export data from these platforms and import directly into your analysis.
            </p>
            <Badge variant="outline" className="text-sm">
              No API keys required • CSV & Manual Import • Privacy Focused
            </Badge>
          </div>

          {/* Integration Cards */}
          <div className="space-y-8">
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
                      <Button asChild variant="outline">
                        <a href={tool.toolUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Tool
                        </a>
                      </Button>
                      <Button asChild>
                        <Link to="/import">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Data
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Metrics We Pull */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <Download className="w-5 h-5 mr-2 text-primary" />
                      Metrics We Pull
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
                  </div>

                  {/* How to Export */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-primary" />
                      How to Export Data
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
                        <span className="text-sm font-medium text-foreground">Available formats:</span>
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
    </main>
  );
};

export default Integrations;