import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { opportunityStorage, SavedOpportunity } from "@/utils/OpportunityStorage";
import { useToast } from "@/hooks/use-toast";

const Decision = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SavedOpportunity | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<'proceed' | 'gather-data' | 'reject'>('gather-data');
  const [reason, setReason] = useState('');
  const [sourcingChecklist, setSourcingChecklist] = useState({
    quotes: false,
    samples: false,
    compliance: false
  });
  const [targetedTasks, setTargetedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOpportunity = async () => {
      if (!id) return;
      
      try {
        const opp = await opportunityStorage.getOpportunityById(id);
        if (opp) {
          setOpportunity(opp);
          
          // Auto-select branch based on gates and score
          const gates = calculateGates(opp);
          const passedGatesCount = Object.values(gates).filter(Boolean).length;
          
          if (opp.finalScore >= 80 && passedGatesCount === 4) {
            setSelectedBranch('proceed');
          } else if (opp.finalScore >= 60 && passedGatesCount >= 2) {
            setSelectedBranch('gather-data');
            generateTargetedTasks(opp);
          } else {
            setSelectedBranch('reject');
          }
        }
      } catch (error) {
        console.error('Error loading opportunity:', error);
        toast({
          title: "Error",
          description: "Failed to load opportunity data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOpportunity();
  }, [id, toast]);

  const calculateGates = (opp: SavedOpportunity) => {
    const criteria = opp.criteria || [];
    const demandCriterion = criteria.find(c => c.name?.toLowerCase().includes('demand'));
    const marginCriterion = criteria.find(c => c.name?.toLowerCase().includes('margin') || c.name?.toLowerCase().includes('profit'));
    const competitionCriterion = criteria.find(c => c.name?.toLowerCase().includes('competition'));
    const barriersCriterion = criteria.find(c => c.name?.toLowerCase().includes('barrier'));

    return {
      demand: demandCriterion ? demandCriterion.value >= 7 : false,
      margin: marginCriterion ? marginCriterion.value >= 20 : false,
      competition: competitionCriterion ? competitionCriterion.value <= 6 : false,
      barriers: barriersCriterion ? barriersCriterion.value <= 5 : false
    };
  };

  const getWeakestCriteria = (opp: SavedOpportunity) => {
    const criteria = opp.criteria || [];
    return criteria
      .sort((a, b) => a.value - b.value)
      .slice(0, 2)
      .map(c => c.name);
  };

  const generateTargetedTasks = (opp: SavedOpportunity) => {
    const weakest = getWeakestCriteria(opp);
    const tasks = [];
    
    weakest.forEach(criterion => {
      if (criterion?.toLowerCase().includes('margin')) {
        tasks.push('Re-check margin with ocean freight and updated COGS');
      } else if (criterion?.toLowerCase().includes('demand')) {
        tasks.push('Validate trend seasonality with additional data sources');
      } else if (criterion?.toLowerCase().includes('competition')) {
        tasks.push('Analyze top 10 competitors in detail');
      } else if (criterion?.toLowerCase().includes('barrier')) {
        tasks.push('Research regulatory and operational barriers');
      } else {
        tasks.push(`Gather more data for ${criterion}`);
      }
    });
    
    setTargetedTasks(tasks);
  };

  const handleSaveDecision = async () => {
    if (!opportunity || !id) return;

    try {
      const gates = calculateGates(opportunity);
      const weakestCriteria = getWeakestCriteria(opportunity);
      
      const updatedOpportunity: SavedOpportunity = {
        ...opportunity,
        status: selectedBranch === 'proceed' ? 'sourcing' : 
                selectedBranch === 'gather-data' ? 'analyzing' : 'archived',
        decision: {
          branch: selectedBranch,
          reason: selectedBranch === 'reject' ? reason : undefined,
          decidedAt: new Date().toISOString(),
          gates,
          weakestCriteria
        },
        updatedAt: new Date().toISOString(),
        history: [
          ...(opportunity.history || []),
          {
            date: new Date().toISOString(),
            summary: `Decision: ${selectedBranch === 'proceed' ? 'Proceed to Sourcing' : 
                     selectedBranch === 'gather-data' ? 'Gather More Data' : 'Rejected/Archived'}`,
            type: 'decision' as const
          }
        ]
      };

      await opportunityStorage.saveOpportunity(updatedOpportunity);
      
      toast({
        title: "Decision Saved",
        description: `Opportunity status updated to ${updatedOpportunity.status}`,
      });

      navigate(`/opportunities/${id}`);
    } catch (error) {
      console.error('Error saving decision:', error);
      toast({
        title: "Error",
        description: "Failed to save decision",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Opportunity Not Found</h1>
          <Link to="/opportunities">
            <Button>Back to Opportunities</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gates = calculateGates(opportunity);
  const weakestCriteria = getWeakestCriteria(opportunity);
  const passedGatesCount = Object.values(gates).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to={`/opportunities/${id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunity
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Decision Tree</h1>
          <p className="text-muted-foreground">{opportunity.productName}</p>
        </div>

        {/* Decision Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Decision Summary
            </CardTitle>
            <CardDescription>
              Based on gates analysis and scoring criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                {gates.demand ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                <span className="text-sm">Demand Gate</span>
              </div>
              <div className="flex items-center gap-2">
                {gates.margin ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                <span className="text-sm">Margin Gate</span>
              </div>
              <div className="flex items-center gap-2">
                {gates.competition ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                <span className="text-sm">Competition Gate</span>
              </div>
              <div className="flex items-center gap-2">
                {gates.barriers ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                <span className="text-sm">Barriers Gate</span>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Analysis:</p>
              <p className="text-sm text-muted-foreground">
                Score: {opportunity.finalScore}/100 • Gates Passed: {passedGatesCount}/4
              </p>
              <p className="text-sm text-muted-foreground">
                Weakest Areas: {weakestCriteria.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Decision Options */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Decision</CardTitle>
            <CardDescription>
              Choose the recommended path forward for this opportunity
            </CardDescription>
          </CardHeader>
          <CardContent data-tour="btn-decision">
            <RadioGroup 
              value={selectedBranch} 
              onValueChange={(value) => setSelectedBranch(value as any)}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="proceed" id="proceed" />
                <Label htmlFor="proceed" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Proceed to Sourcing</span>
                      <p className="text-sm text-muted-foreground">Ready for supplier outreach and samples</p>
                    </div>
                    <Badge variant={opportunity.finalScore >= 80 && passedGatesCount === 4 ? "default" : "secondary"}>
                      Recommended
                    </Badge>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gather-data" id="gather-data" />
                <Label htmlFor="gather-data" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Gather More Data</span>
                      <p className="text-sm text-muted-foreground">Additional research needed before proceeding</p>
                    </div>
                    <Badge variant={opportunity.finalScore >= 60 && passedGatesCount >= 2 ? "default" : "secondary"}>
                      {opportunity.finalScore >= 60 && passedGatesCount >= 2 ? "Recommended" : "Option"}
                    </Badge>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reject" id="reject" />
                <Label htmlFor="reject" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Reject / Archive</span>
                      <p className="text-sm text-muted-foreground">Not viable, move to archive</p>
                    </div>
                    <Badge variant={opportunity.finalScore < 60 || passedGatesCount < 2 ? "destructive" : "secondary"}>
                      {opportunity.finalScore < 60 || passedGatesCount < 2 ? "Recommended" : "Option"}
                    </Badge>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Branch-Specific Content */}
        {selectedBranch === 'proceed' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sourcing Checklist</CardTitle>
              <CardDescription>
                Next steps to move forward with this opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="quotes"
                  checked={sourcingChecklist.quotes}
                  onCheckedChange={(checked) => 
                    setSourcingChecklist(prev => ({ ...prev, quotes: !!checked }))
                  }
                />
                <Label htmlFor="quotes">Request quotes from suppliers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="samples"
                  checked={sourcingChecklist.samples}
                  onCheckedChange={(checked) => 
                    setSourcingChecklist(prev => ({ ...prev, samples: !!checked }))
                  }
                />
                <Label htmlFor="samples">Order samples for testing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="compliance"
                  checked={sourcingChecklist.compliance}
                  onCheckedChange={(checked) => 
                    setSourcingChecklist(prev => ({ ...prev, compliance: !!checked }))
                  }
                />
                <Label htmlFor="compliance">Complete compliance checks</Label>
              </div>
              <div className="pt-4">
                <Link to={`/opportunities/${id}/packet`}>
                  <Button variant="outline" className="w-full" data-tour="btn-packet">
                    Generate Sourcing Packet
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedBranch === 'gather-data' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Targeted Research Tasks</CardTitle>
              <CardDescription>
                Focus areas based on your weakest criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {targetedTasks.map((task, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{task}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedBranch === 'reject' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rejection Reason</CardTitle>
              <CardDescription>
                Please provide a brief explanation for archiving this opportunity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Explain why this opportunity is not viable..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-20"
                required
              />
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSaveDecision}
            disabled={selectedBranch === 'reject' && !reason.trim()}
            className="flex-1"
          >
            Save Decision
          </Button>
          <Link to={`/opportunities/${id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Decision;