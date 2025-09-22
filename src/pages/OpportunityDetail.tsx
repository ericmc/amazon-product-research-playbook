import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, DollarSign, Users, Star, Calendar, ExternalLink, Plus, Trash2, RefreshCw, AlertTriangle, X } from "lucide-react";
import { opportunityStorage, SavedOpportunity } from "@/utils/OpportunityStorage";
import { useToast } from "@/hooks/use-toast";
import { isStale, getStalenessDays } from "@/utils/refreshUtils";
import RefreshModal from "@/components/RefreshModal";
import HistoryTab from "@/components/HistoryTab";

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SavedOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [showStalenessBanner, setShowStalenessBanner] = useState(true);

  useEffect(() => {
    const loadOpportunity = async () => {
      if (!id) return;
      try {
        const opp = await opportunityStorage.getOpportunityById(id);
        setOpportunity(opp);
      } catch (error) {
        console.error('Failed to load opportunity:', error);
        toast({
          title: "Error",
          description: "Failed to load opportunity details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOpportunity();
  }, [id, toast]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Poor";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRecommendation = (score: number) => {
    if (score >= 80) return "Proceed with sourcing";
    if (score >= 60) return "Further validation recommended";
    return "High risk - reconsider";
  };

  const updateValidation = async (updates: Partial<SavedOpportunity['validation']>) => {
    if (!opportunity) return;

    const validation = {
      checklist: {
        demandProof: { completed: false, notes: '', links: '' },
        marginCalculation: { completed: false, notes: '', cogs: 0, fbaFee: 0, freight: 0, duty: 0, computedMargin: 0 },
        competitiveLandscape: { completed: false, notes: '', competitors: [] },
        differentiationPlan: { completed: false, notes: '', levers: [] },
        operationalRisks: { completed: false, notes: '', risks: { tooling: false, certifications: false, hazmat: false, oversize: false, fragile: false, moq: false } },
      },
      confidenceScore: 0,
      ...opportunity.validation,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    // Calculate confidence score
    const checklistItems = Object.values(validation.checklist || {});
    const completedItems = checklistItems.filter(item => item?.completed).length;
    validation.confidenceScore = Math.round((completedItems / checklistItems.length) * 100);

    const updatedOpportunity = {
      ...opportunity,
      validation,
    };

    try {
      await opportunityStorage.saveOpportunity(updatedOpportunity);
      setOpportunity(updatedOpportunity);
      toast({
        title: "Saved",
        description: "Validation data updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save validation data.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshOpportunity = async (updatedOpportunity: SavedOpportunity) => {
    try {
      await opportunityStorage.saveOpportunity(updatedOpportunity);
      setOpportunity(updatedOpportunity);
      setShowRefreshModal(false);
      setShowStalenessBanner(false);
      toast({
        title: "Opportunity refreshed",
        description: "Data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh opportunity.",
        variant: "destructive",
      });
    }
  };

  const snoozeStalenessBanner = () => {
    setShowStalenessBanner(false);
    // Could also set a localStorage flag with 7-day expiry
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Opportunity not found</h2>
          <Button asChild>
            <Link to="/opportunities">Back to Opportunities</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/opportunities">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/opportunities/${opportunity.id}/decision`}>
              Go to Decision
            </Link>
          </Button>
        </div>

        {/* Summary Strip */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{opportunity.productName}</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getScoreColor(opportunity.finalScore)}`} />
                    <Badge variant="secondary">
                      {opportunity.finalScore}/100 - {getScoreLabel(opportunity.finalScore)}
                    </Badge>
                  </div>
                  <Badge variant="outline">
                    {opportunity.recommendation || getRecommendation(opportunity.finalScore)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {opportunity.source && (
                    <span>Source: {opportunity.source}</span>
                  )}
                  {opportunity.importedAt && (
                    <span>Imported: {new Date(opportunity.importedAt).toLocaleDateString()}</span>
                  )}
                  <span>Updated: {new Date(opportunity.updatedAt || opportunity.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Staleness Banner */}
        {opportunity && isStale(opportunity) && showStalenessBanner && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">
                      Data is {getStalenessDays(opportunity)} days old
                    </p>
                    <p className="text-sm text-orange-600">
                      Consider refreshing market data to ensure accuracy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setShowRefreshModal(true)}
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={snoozeStalenessBanner}
                  >
                    Snooze (7 days)
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowStalenessBanner(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="validation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scoring Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunity.criteria.map((criterion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{criterion.name}</div>
                        <div className="text-sm text-muted-foreground">{criterion.value}{criterion.unit || ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {criterion.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{criterion.passed ? 'Pass' : 'Fail'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Checklist</CardTitle>
                <CardDescription>
                  Complete these validation steps to increase confidence in your opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{opportunity.validation?.confidenceScore || 0}%</span>
                  </div>
                  <Progress value={opportunity.validation?.confidenceScore || 0} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryTab opportunity={opportunity} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Refresh Modal */}
      {showRefreshModal && opportunity && (
        <RefreshModal
          opportunity={opportunity}
          open={showRefreshModal}
          onOpenChange={setShowRefreshModal}
          onRefresh={handleRefreshOpportunity}
        />
      )}
    </div>
  );
};

export default OpportunityDetail;