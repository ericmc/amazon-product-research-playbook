import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, FileText, Target, BarChart3, Upload, Zap } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Product Opportunity Analyzer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Import, analyze, and score product opportunities to make data-driven decisions for your business.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/import')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>
                Upload product data from Helium 10, Jungle Scout, or CSV files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Start Import
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/score')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score Products
              </CardTitle>
              <CardDescription>
                Analyze and score your imported products for viability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Scoring
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/opportunities')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Opportunities
              </CardTitle>
              <CardDescription>
                Browse and manage your product opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Opportunities
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Platform Features
            </CardTitle>
            <CardDescription>
              Everything you need to analyze product opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <h4 className="font-semibold">Data Import</h4>
                    <p className="text-sm text-muted-foreground">
                      Support for multiple data sources including Helium 10, Jungle Scout, and custom CSV formats
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <h4 className="font-semibold">Advanced Scoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive scoring system based on revenue, competition, demand, and market factors
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <h4 className="font-semibold">Opportunity Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Track and manage your best product opportunities with detailed analysis
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <h4 className="font-semibold">Data Visualization</h4>
                    <p className="text-sm text-muted-foreground">
                      Interactive charts and graphs to visualize trends and performance metrics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;