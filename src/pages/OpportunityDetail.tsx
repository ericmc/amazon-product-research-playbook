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
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, DollarSign, Users, Star, Calendar, ExternalLink, Plus, Trash2 } from "lucide-react";
import { opportunityStorage, SavedOpportunity } from "@/utils/OpportunityStorage";
import { useToast } from "@/hooks/use-toast";

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SavedOpportunity | null>(null);
  const [loading, setLoading] = useState(true);

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

  const applyToProfitability = async () => {
    if (!opportunity?.validation?.checklist?.marginCalculation?.computedMargin) return;

    const updatedCriteria = opportunity.criteria.map(criterion => {
      if (criterion.name === 'profitability') {
        return {
          ...criterion,
          value: opportunity.validation.checklist.marginCalculation.computedMargin
        };
      }
      return criterion;
    });

    // Recalculate score (simplified calculation)
    const totalValue = updatedCriteria.reduce((sum, c) => sum + (c.value * (c.weight || 1)), 0);
    const totalWeight = updatedCriteria.reduce((sum, c) => sum + (c.weight || 1), 0);
    const newScore = Math.round(totalValue / totalWeight);

    const updatedOpportunity = {
      ...opportunity,
      criteria: updatedCriteria,
      finalScore: newScore,
      recommendation: getRecommendation(newScore),
      history: [
        ...(opportunity.history || []),
        {
          date: new Date().toISOString(),
          summary: `Applied margin calculation (${opportunity.validation.checklist.marginCalculation.computedMargin}%) to profitability criterion`,
          type: 'score_update' as const
        }
      ]
    };

    try {
      await opportunityStorage.saveOpportunity(updatedOpportunity);
      setOpportunity(updatedOpportunity);
      toast({
        title: "Updated",
        description: "Profitability criterion updated and score recalculated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profitability.",
        variant: "destructive",
      });
    }
  };

  const applyToBarriers = async () => {
    if (!opportunity?.validation?.checklist?.operationalRisks?.risks) return;

    const risks = opportunity.validation.checklist.operationalRisks.risks;
    const riskCount = Object.values(risks).filter(Boolean).length;
    const barrierScore = Math.max(0, Math.min(100, riskCount * 15)); // Scale risk count to 0-100

    const updatedCriteria = opportunity.criteria.map(criterion => {
      if (criterion.id === 'barriers') {
        return { ...criterion, value: barrierScore };
      }
      return criterion;
    });

    // Recalculate score
    const totalScore = updatedCriteria.reduce((sum, criterion) => {
      const normalized = ['competition', 'barriers', 'seasonality'].includes(criterion.id) 
        ? criterion.maxValue - criterion.value 
        : criterion.value;
      const percentage = (normalized / criterion.maxValue) * 100;
      return sum + (percentage * criterion.weight) / 100;
    }, 0);

    const updatedOpportunity = {
      ...opportunity,
      criteria: updatedCriteria,
      finalScore: Math.round(totalScore),
      history: [
        ...(opportunity.history || []),
        {
          date: new Date().toISOString(),
          summary: `Applied operational risks to barriers score (${barrierScore})`,
          type: 'validation' as const,
        }
      ]
    };

    try {
      await opportunityStorage.saveOpportunity(updatedOpportunity);
      setOpportunity(updatedOpportunity);
      toast({
        title: "Applied to Barriers",
        description: `Barriers score updated to ${barrierScore} based on operational risks.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply barriers update.",
        variant: "destructive",
      });
    }
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
            {/* Confidence Meter */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence Level</span>
                    <span>{opportunity.validation?.confidenceScore || 0}%</span>
                  </div>
                  <Progress value={opportunity.validation?.confidenceScore || 0} className="h-3" />
                  <div className="text-sm text-muted-foreground">
                    {(opportunity.validation?.confidenceScore || 0) >= 80 ? 'High Confidence' :
                     (opportunity.validation?.confidenceScore || 0) >= 60 ? 'Medium Confidence' : 'Low Confidence'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Checklist */}
            <div className="grid gap-6">
              {/* Demand Proof */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="demand-proof"
                      checked={opportunity.validation?.checklist?.demandProof?.completed || false}
                      onCheckedChange={(checked) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            demandProof: {
                              ...opportunity.validation?.checklist?.demandProof,
                              completed: !!checked,
                            }
                          }
                        });
                      }}
                    />
                    <Label htmlFor="demand-proof" className="text-base font-medium">
                      Demand Proof
                    </Label>
                  </div>
                  <CardDescription>
                    Attach JS/H10/POE references; note seasonality observations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="demand-notes">Notes</Label>
                    <Textarea
                      id="demand-notes"
                      placeholder="Document your demand validation findings..."
                      value={opportunity.validation?.checklist?.demandProof?.notes || ''}
                      onChange={(e) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            demandProof: {
                              ...opportunity.validation?.checklist?.demandProof,
                              notes: e.target.value,
                            }
                          }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="demand-links">Reference Links</Label>
                    <Input
                      id="demand-links"
                      placeholder="https://..."
                      value={opportunity.validation?.checklist?.demandProof?.links || ''}
                      onChange={(e) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            demandProof: {
                              ...opportunity.validation?.checklist?.demandProof,
                              links: e.target.value,
                            }
                          }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Margin Calculation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="margin-calc"
                        checked={opportunity.validation?.checklist?.marginCalculation?.completed || false}
                        onCheckedChange={(checked) => {
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              marginCalculation: {
                                ...opportunity.validation?.checklist?.marginCalculation,
                                completed: !!checked,
                              }
                            }
                          });
                        }}
                      />
                      <Label htmlFor="margin-calc" className="text-base font-medium">
                        Margin Calculation
                      </Label>
                    </div>
                    {opportunity.validation?.checklist?.marginCalculation?.computedMargin && (
                      <Button
                        size="sm"
                        onClick={applyToProfitability}
                        className="ml-2"
                      >
                        Apply to Profitability
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    COGS, FBA fee, freight/unit, duty % → computed margin %
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cogs">COGS ($)</Label>
                      <Input
                        id="cogs"
                        type="number"
                        step="0.01"
                        value={opportunity.validation?.checklist?.marginCalculation?.cogs || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const margin = opportunity.validation?.checklist?.marginCalculation;
                          const selling = 20; // Default selling price, should be configurable
                          const totalCosts = value + (margin?.fbaFee || 0) + (margin?.freight || 0) + (margin?.duty || 0);
                          const computedMargin = Math.max(0, Math.round(((selling - totalCosts) / selling) * 100));
                          
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              marginCalculation: {
                                ...margin,
                                cogs: value,
                                computedMargin,
                              }
                            }
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fba-fee">FBA Fee ($)</Label>
                      <Input
                        id="fba-fee"
                        type="number"
                        step="0.01"
                        value={opportunity.validation?.checklist?.marginCalculation?.fbaFee || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const margin = opportunity.validation?.checklist?.marginCalculation;
                          const selling = 20; // Default selling price
                          const totalCosts = (margin?.cogs || 0) + value + (margin?.freight || 0) + (margin?.duty || 0);
                          const computedMargin = Math.max(0, Math.round(((selling - totalCosts) / selling) * 100));
                          
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              marginCalculation: {
                                ...margin,
                                fbaFee: value,
                                computedMargin,
                              }
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="freight">Freight/Unit ($)</Label>
                      <Input
                        id="freight"
                        type="number"
                        step="0.01"
                        value={opportunity.validation?.checklist?.marginCalculation?.freight || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const margin = opportunity.validation?.checklist?.marginCalculation;
                          const selling = 20; // Default selling price
                          const totalCosts = (margin?.cogs || 0) + (margin?.fbaFee || 0) + value + (margin?.duty || 0);
                          const computedMargin = Math.max(0, Math.round(((selling - totalCosts) / selling) * 100));
                          
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              marginCalculation: {
                                ...margin,
                                freight: value,
                                computedMargin,
                              }
                            }
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="duty">Duty (%)</Label>
                      <Input
                        id="duty"
                        type="number"
                        step="0.1"
                        value={opportunity.validation?.checklist?.marginCalculation?.duty || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const margin = opportunity.validation?.checklist?.marginCalculation;
                          const selling = 20; // Default selling price
                          const dutyAmount = selling * (value / 100);
                          const totalCosts = (margin?.cogs || 0) + (margin?.fbaFee || 0) + (margin?.freight || 0) + dutyAmount;
                          const computedMargin = Math.max(0, Math.round(((selling - totalCosts) / selling) * 100));
                          
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              marginCalculation: {
                                ...margin,
                                duty: value,
                                computedMargin,
                              }
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                  {opportunity.validation?.checklist?.marginCalculation?.computedMargin !== undefined && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">
                        Computed Margin: {opportunity.validation.checklist.marginCalculation.computedMargin}%
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="margin-notes">Notes</Label>
                    <Textarea
                      id="margin-notes"
                      placeholder="Additional margin calculation notes..."
                      value={opportunity.validation?.checklist?.marginCalculation?.notes || ''}
                      onChange={(e) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            marginCalculation: {
                              ...opportunity.validation?.checklist?.marginCalculation,
                              notes: e.target.value,
                            }
                          }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Landscape */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="competitive-landscape"
                        checked={opportunity.validation?.checklist?.competitiveLandscape?.completed || false}
                        onCheckedChange={(checked) => {
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              competitiveLandscape: {
                                ...opportunity.validation?.checklist?.competitiveLandscape,
                                completed: !!checked,
                              }
                            }
                          });
                        }}
                      />
                      <Label htmlFor="competitive-landscape" className="text-base font-medium">
                        Competitive Landscape
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const competitors = opportunity.validation?.checklist?.competitiveLandscape?.competitors || [];
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            competitiveLandscape: {
                              ...opportunity.validation?.checklist?.competitiveLandscape,
                              competitors: [...competitors, { asin: '', price: 0, reviews: 0 }]
                            }
                          }
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Competitor
                    </Button>
                  </div>
                  <CardDescription>
                    Table of up to 10 competitors: ASIN, price, reviews, monthly revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {opportunity.validation?.checklist?.competitiveLandscape?.competitors?.map((competitor, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center p-2 border rounded">
                      <Input
                        placeholder="ASIN"
                        value={competitor.asin}
                        onChange={(e) => {
                          const competitors = [...(opportunity.validation?.checklist?.competitiveLandscape?.competitors || [])];
                          competitors[index] = { ...competitor, asin: e.target.value };
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              competitiveLandscape: {
                                ...opportunity.validation?.checklist?.competitiveLandscape,
                                competitors
                              }
                            }
                          });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={competitor.price || ''}
                        onChange={(e) => {
                          const competitors = [...(opportunity.validation?.checklist?.competitiveLandscape?.competitors || [])];
                          competitors[index] = { ...competitor, price: parseFloat(e.target.value) || 0 };
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              competitiveLandscape: {
                                ...opportunity.validation?.checklist?.competitiveLandscape,
                                competitors
                              }
                            }
                          });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Reviews"
                        value={competitor.reviews || ''}
                        onChange={(e) => {
                          const competitors = [...(opportunity.validation?.checklist?.competitiveLandscape?.competitors || [])];
                          competitors[index] = { ...competitor, reviews: parseInt(e.target.value) || 0 };
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              competitiveLandscape: {
                                ...opportunity.validation?.checklist?.competitiveLandscape,
                                competitors
                              }
                            }
                          });
                        }}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const competitors = [...(opportunity.validation?.checklist?.competitiveLandscape?.competitors || [])];
                          competitors.splice(index, 1);
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              competitiveLandscape: {
                                ...opportunity.validation?.checklist?.competitiveLandscape,
                                competitors
                              }
                            }
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Label htmlFor="competitive-notes">Notes</Label>
                    <Textarea
                      id="competitive-notes"
                      placeholder="Competitive analysis notes..."
                      value={opportunity.validation?.checklist?.competitiveLandscape?.notes || ''}
                      onChange={(e) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            competitiveLandscape: {
                              ...opportunity.validation?.checklist?.competitiveLandscape,
                              notes: e.target.value,
                            }
                          }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Differentiation Plan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="differentiation-plan"
                      checked={opportunity.validation?.checklist?.differentiationPlan?.completed || false}
                      onCheckedChange={(checked) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            differentiationPlan: {
                              ...opportunity.validation?.checklist?.differentiationPlan,
                              completed: !!checked,
                            }
                          }
                        });
                      }}
                    />
                    <Label htmlFor="differentiation-plan" className="text-base font-medium">
                      Differentiation Plan
                    </Label>
                  </div>
                  <CardDescription>
                    Bundle/design/material/branding; require at least 2 levers to mark complete
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Differentiation Levers</Label>
                    {['Bundle', 'Design', 'Material', 'Branding', 'Price', 'Features'].map((lever) => (
                      <div key={lever} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lever-${lever}`}
                          checked={opportunity.validation?.checklist?.differentiationPlan?.levers?.includes(lever) || false}
                          onCheckedChange={(checked) => {
                            const currentLevers = opportunity.validation?.checklist?.differentiationPlan?.levers || [];
                            const newLevers = checked 
                              ? [...currentLevers, lever]
                              : currentLevers.filter(l => l !== lever);
                            updateValidation({
                              checklist: {
                                ...opportunity.validation?.checklist,
                                differentiationPlan: {
                                  ...opportunity.validation?.checklist?.differentiationPlan,
                                  levers: newLevers,
                                }
                              }
                            });
                          }}
                        />
                        <Label htmlFor={`lever-${lever}`}>{lever}</Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="differentiation-notes">Notes</Label>
                    <Textarea
                      id="differentiation-notes"
                      placeholder="Differentiation strategy notes..."
                      value={opportunity.validation?.checklist?.differentiationPlan?.notes || ''}
                      onChange={(e) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            differentiationPlan: {
                              ...opportunity.validation?.checklist?.differentiationPlan,
                              notes: e.target.value,
                            }
                          }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Operational Risks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="operational-risks"
                        checked={opportunity.validation?.checklist?.operationalRisks?.completed || false}
                        onCheckedChange={(checked) => {
                          updateValidation({
                            checklist: {
                              ...opportunity.validation?.checklist,
                              operationalRisks: {
                                ...opportunity.validation?.checklist?.operationalRisks,
                                completed: !!checked,
                              }
                            }
                          });
                        }}
                      />
                      <Label htmlFor="operational-risks" className="text-base font-medium">
                        Operational Risks
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={applyToBarriers}
                      disabled={!opportunity.validation?.checklist?.operationalRisks?.risks}
                    >
                      Apply to Barriers
                    </Button>
                  </div>
                  <CardDescription>
                    Barriers: tooling, certifications, hazmat/oversize/fragile/MOQ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Risk Factors</Label>
                    {['tooling', 'certifications', 'hazmat', 'oversize', 'fragile', 'moq'].map((risk) => (
                      <div key={risk} className="flex items-center space-x-2">
                        <Checkbox
                          id={`risk-${risk}`}
                          checked={opportunity.validation?.checklist?.operationalRisks?.risks?.[risk as keyof typeof opportunity.validation.checklist.operationalRisks.risks] || false}
                          onCheckedChange={(checked) => {
                            updateValidation({
                              checklist: {
                                ...opportunity.validation?.checklist,
                                operationalRisks: {
                                  ...opportunity.validation?.checklist?.operationalRisks,
                                  risks: {
                                    ...opportunity.validation?.checklist?.operationalRisks?.risks,
                                    [risk]: !!checked,
                                  }
                                }
                              }
                            });
                          }}
                        />
                        <Label htmlFor={`risk-${risk}`} className="capitalize">{risk}</Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="operational-notes">Notes</Label>
                    <Textarea
                      id="operational-notes"
                      placeholder="Operational risk notes..."
                      value={opportunity.validation?.checklist?.operationalRisks?.notes || ''}
                      onChange={(e) => {
                        updateValidation({
                          checklist: {
                            ...opportunity.validation?.checklist,
                            operationalRisks: {
                              ...opportunity.validation?.checklist?.operationalRisks,
                              notes: e.target.value,
                            }
                          }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change History</CardTitle>
              </CardHeader>
              <CardContent>
                {opportunity.history && opportunity.history.length > 0 ? (
                  <div className="space-y-4">
                    {opportunity.history.map((entry, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{entry.summary}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleString()} • {entry.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No history entries yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OpportunityDetail;