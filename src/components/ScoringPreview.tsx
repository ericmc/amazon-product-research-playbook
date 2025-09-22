import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, TrendingUp, Target, AlertCircle, CheckCircle, DollarSign, Users } from "lucide-react";
import { computeFinalScore, checkGates, getRecommendation } from "@/utils/scoringUtils";

interface ScoringData {
  productName: string;
  source: string;
  revenue: number;
  demand: number;
  competition: number;
  price: number;
  reviewCount: number;
  rating: number;
}

interface ScoringPreviewProps {
  scoringData: ScoringData | null;
  onRefresh: () => void;
}

export const ScoringPreview: React.FC<ScoringPreviewProps> = ({ scoringData, onRefresh }) => {
  const { toast } = useToast();

  if (!scoringData) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Product to Score</h3>
          <p className="text-muted-foreground">
            Choose a product from the list above to see its scoring preview
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate quick scoring preview based on the data
  const criteria = [
    {
      id: 'revenue',
      name: 'Revenue Potential',
      value: scoringData.revenue,
      weight: 25,
      maxValue: 50000,
      icon: DollarSign,
      threshold: 5000
    },
    {
      id: 'demand',
      name: 'Market Demand', 
      value: scoringData.demand,
      weight: 20,
      maxValue: 50000,
      icon: TrendingUp,
      threshold: 1000
    },
    {
      id: 'competition',
      name: 'Competition Level',
      value: 100 - scoringData.competition, // Invert for scoring (lower competition = higher score)
      weight: 20,
      maxValue: 100,
      icon: Target,
      threshold: 30,
      isInverted: true
    },
    {
      id: 'reviews',
      name: 'Social Proof',
      value: Math.min(scoringData.reviewCount, 5000), // Cap at 5000 for scoring
      weight: 15,
      maxValue: 5000,
      icon: Users,
      threshold: 100
    },
    {
      id: 'rating',
      name: 'Quality Score',
      value: scoringData.rating * 20, // Convert 5-star to 100-point scale
      weight: 10,
      maxValue: 100,
      icon: CheckCircle,
      threshold: 80
    },
    {
      id: 'price',
      name: 'Price Point',
      value: Math.min(scoringData.price, 100), // Cap at $100 for scoring
      weight: 10,
      maxValue: 100,
      icon: DollarSign,
      threshold: 15
    }
  ];

  const overallScore = computeFinalScore(criteria);
  const gates = checkGates(criteria);
  const gatesPassed = Object.values(gates).filter(Boolean).length;
  const recommendation = getRecommendation(overallScore, gatesPassed);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'proceed': return 'text-green-600';
      case 'gather-data': return 'text-yellow-600';
      case 'reject': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'proceed': return 'bg-green-100 text-green-800 border-green-200';
      case 'gather-data': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reject': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{scoringData.productName}</CardTitle>
              <CardDescription>Quick scoring analysis based on imported data</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className={`text-4xl font-bold ${getRecommendationColor(recommendation)}`}>
            {overallScore}/100
          </CardTitle>
          <CardDescription>Overall Product Viability Score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  overallScore >= 80 ? 'bg-green-500' :
                  overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <Badge className={`${getRecommendationBadge(recommendation)} text-sm px-4 py-2`}>
              {recommendation === 'proceed' ? '✅ Proceed' :
               recommendation === 'gather-data' ? '⚠️ Gather More Data' : '❌ Pass'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {criteria.map((criterion) => {
          const IconComponent = criterion.icon;
          const normalizedScore = Math.min(100, (criterion.value / criterion.maxValue) * 100);
          const passed = criterion.isInverted ? 
            criterion.value >= criterion.threshold :
            criterion.value >= criterion.threshold;

          return (
            <Card key={criterion.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={passed ? "default" : "outline"} className="text-xs">
                    {passed ? "✓" : "✗"}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm mb-1">{criterion.name}</h4>
                <div className="text-xs text-muted-foreground mb-2">
                  {criterion.id === 'revenue' ? `$${criterion.value.toLocaleString()}/mo` :
                   criterion.id === 'demand' ? `${criterion.value.toLocaleString()} searches` :
                   criterion.id === 'competition' ? `${scoringData.competition}% competitive` :
                   criterion.id === 'reviews' ? `${criterion.value.toLocaleString()} reviews` :
                   criterion.id === 'rating' ? `${scoringData.rating.toFixed(1)} stars` :
                   criterion.id === 'price' ? `$${criterion.value.toFixed(2)}` : 
                   criterion.value.toLocaleString()}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${normalizedScore}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gates Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Gates</CardTitle>
          <CardDescription>
            Key thresholds for product viability ({gatesPassed}/4 passed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className={`flex items-center gap-2 ${gates.revenue ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.revenue ? 'bg-green-500' : 'bg-red-500'}`} />
              Revenue Gate
            </div>
            <div className={`flex items-center gap-2 ${gates.demand ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.demand ? 'bg-green-500' : 'bg-red-500'}`} />
              Demand Gate
            </div>
            <div className={`flex items-center gap-2 ${gates.competition ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.competition ? 'bg-green-500' : 'bg-red-500'}`} />
              Competition Gate
            </div>
            <div className={`flex items-center gap-2 ${gates.margin ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${gates.margin ? 'bg-green-500' : 'bg-red-500'}`} />
              Margin Gate
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};