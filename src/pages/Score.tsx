import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getBadgeClass, getScoreClass, getProgressClass } from "@/utils/classMap";
import { TrendingUp, Target, AlertCircle, CheckCircle } from "lucide-react";

const Score = () => {
  const scoreData = [
    {
      title: "Market Demand",
      score: 85,
      status: "High",
      description: "Strong search volume and trending keywords",
      icon: TrendingUp,
      color: "success"
    },
    {
      title: "Competition Level",
      score: 65,
      status: "Medium",
      description: "Moderate competition with opportunity gaps",
      icon: Target,
      color: "warning"
    },
    {
      title: "Profit Potential",
      score: 78,
      status: "Good",
      description: "Healthy margins with reasonable costs",
      icon: CheckCircle,
      color: "success"
    },
    {
      title: "Risk Assessment",
      score: 40,
      status: "Low Risk",
      description: "Minimal barriers and regulatory concerns",
      icon: AlertCircle,
      color: "success"
    }
  ];

  const overallScore = Math.round(scoreData.reduce((sum, item) => sum + item.score, 0) / scoreData.length);

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Scoring Configuration</h1>
          <p className="text-muted-foreground mt-2">Configure scoring criteria and weights to evaluate opportunities</p>
        </div>

        <Card className="bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-primary">{overallScore}/100</CardTitle>
            <CardDescription>Overall Product Viability Score</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallScore} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {scoreData.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Card key={index} className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{item.score}</span>
                      <Badge className={getBadgeClass(item.color === "success" ? "proceed" : item.color === "warning" ? "gather-data" : "reject")}>
                        {item.status}
                      </Badge>
                    </div>
                    <Progress value={item.score} className="h-2" />
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
            <CardDescription>Detailed analysis of scoring factors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Positive Factors</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• High search volume growth</li>
                    <li>• Low seasonal variation</li>
                    <li>• Strong profit margins</li>
                    <li>• Market gap identified</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Areas to Monitor</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Emerging competition</li>
                    <li>• Supply chain considerations</li>
                    <li>• Regulatory changes</li>
                    <li>• Brand differentiation needs</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Score;