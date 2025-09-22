import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PrinterIcon, ArrowLeftIcon, EditIcon } from 'lucide-react';
import { opportunityStorage, SavedOpportunity } from '@/utils/OpportunityStorage';
import { useToast } from '@/hooks/use-toast';

interface PacketHeaderProps {
  opportunity: SavedOpportunity;
}

const PacketHeader: React.FC<PacketHeaderProps> = ({ opportunity }) => {
  const gates = opportunity.decision?.gates || {};
  const gateCount = Object.values(gates).filter(Boolean).length;
  
  return (
    <div className="print:mb-4 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 print:text-2xl">
            {opportunity.productName}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={opportunity.status === 'sourcing' ? 'default' : 'secondary'} className="capitalize">
              {opportunity.status}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {opportunity.finalScore}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {opportunity.finalScore >= 80 ? 'Excellent' : 
                 opportunity.finalScore >= 60 ? 'Good' : 'Needs Work'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Gates:</span>
              <span className="text-sm font-medium">{gateCount}/4 ✓</span>
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground print:hidden">
          {opportunity.decision?.decidedAt && (
            <div>Decided: {new Date(opportunity.decision.decidedAt).toLocaleDateString()}</div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded print:bg-transparent print:border print:p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><strong>ID:</strong> {opportunity.id.slice(-8)}</div>
          <div><strong>Source:</strong> {opportunity.source || '—'}</div>
          <div><strong>Created:</strong> {new Date(opportunity.createdAt).toLocaleDateString()}</div>
          <div><strong>Updated:</strong> {opportunity.updatedAt ? new Date(opportunity.updatedAt).toLocaleDateString() : '—'}</div>
        </div>
      </div>
    </div>
  );
};

interface PacketMetricsTableProps {
  opportunity: SavedOpportunity;
}

const PacketMetricsTable: React.FC<PacketMetricsTableProps> = ({ opportunity }) => {
  const getCriteriaValue = (name: string) => {
    const criteria = opportunity.criteria?.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
    return criteria?.value || 0;
  };

  const getMarginPercentage = () => {
    const margin = opportunity.validation?.checklist?.marginCalculation;
    return margin?.computedMargin ? `${margin.computedMargin.toFixed(1)}%` : '—';
  };

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div className="font-medium mb-1">Monthly Revenue</div>
        <div>{getCriteriaValue('revenue') || '—'} USD/mo</div>
      </div>
      <div>
        <div className="font-medium mb-1">Demand</div>
        <div>{getCriteriaValue('demand') || '—'} searches/mo</div>
      </div>
      <div>
        <div className="font-medium mb-1">Competition (0-100)</div>
        <div>{getCriteriaValue('competition') || '—'}</div>
      </div>
      <div>
        <div className="font-medium mb-1">Seasonality Risk (0-100)</div>
        <div>{getCriteriaValue('seasonality') || '—'}</div>
      </div>
      <div>
        <div className="font-medium mb-1">Barriers (0-100)</div>
        <div>{getCriteriaValue('barriers') || '—'}</div>
      </div>
      <div>
        <div className="font-medium mb-1">Profitability</div>
        <div>{getMarginPercentage()}</div>
      </div>
    </div>
  );
};

interface PacketCompetitorsTableProps {
  opportunity: SavedOpportunity;
}

const PacketCompetitorsTable: React.FC<PacketCompetitorsTableProps> = ({ opportunity }) => {
  const competitors = opportunity.validation?.checklist?.competitiveLandscape?.competitors || [];
  
  if (competitors.length === 0) {
    return <div className="text-sm text-muted-foreground">No competitor data available</div>;
  }

  return (
    <div className="print:break-inside-avoid">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 font-medium">ASIN</th>
              <th className="text-left p-2 font-medium">Price</th>
              <th className="text-left p-2 font-medium">Reviews</th>
              <th className="text-left p-2 font-medium">Revenue/mo</th>
            </tr>
          </thead>
          <tbody>
            {competitors.slice(0, 6).map((comp, index) => (
              <tr key={index} className="border-b last:border-b-0">
                <td className="p-2 font-mono">{comp.asin}</td>
                <td className="p-2">${comp.price?.toFixed(2) || '—'}</td>
                <td className="p-2">{comp.reviews?.toLocaleString() || '—'}</td>
                <td className="p-2">{comp.revenue ? `$${comp.revenue.toLocaleString()}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SourcingPacket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SavedOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSummary, setEditingSummary] = useState(false);
  const [customSummary, setCustomSummary] = useState('');

  useEffect(() => {
    loadOpportunity();
  }, [id]);

  const loadOpportunity = async () => {
    if (!id) return;
    
    try {
      const opp = await opportunityStorage.getOpportunityById(id);
      if (opp) {
        setOpportunity(opp);
        setCustomSummary(opp.notes || generateAutoSummary(opp));
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

  const generateAutoSummary = (opp: SavedOpportunity) => {
    const gates = opp.decision?.gates || {};
    const gateCount = Object.values(gates).filter(Boolean).length;
    const score = opp.finalScore;
    
    let summary = '';
    
    if (score >= 80 && gateCount === 4) {
      summary = 'Strong opportunity with all gates passed. ';
    } else if (score >= 60) {
      summary = 'Promising opportunity with some validation needed. ';
    } else {
      summary = 'Challenging opportunity requiring significant improvements. ';
    }

    const differentiationLevers = opp.validation?.checklist?.differentiationPlan?.levers || [];
    if (differentiationLevers.length >= 2) {
      summary += `Differentiation planned via ${differentiationLevers.slice(0, 2).join(' and ')}.`;
    }

    return summary;
  };

  const handlePrint = () => {
    window.print();
  };

  const saveSummary = async () => {
    if (!opportunity) return;
    
    try {
      const updated = {
        ...opportunity,
        notes: customSummary,
        updatedAt: new Date().toISOString()
      };
      await opportunityStorage.saveOpportunity(updated);
      setOpportunity(updated);
      setEditingSummary(false);
      toast({
        title: "Summary updated",
        description: "Opportunity summary has been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save summary",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading sourcing packet...</div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Opportunity not found</h1>
          <p className="text-muted-foreground mb-4">The requested opportunity could not be loaded.</p>
          <Link to="/opportunities">
            <Button>Back to Opportunities</Button>
          </Link>
        </div>
      </div>
    );
  }

  const differentiationLevers = opportunity.validation?.checklist?.differentiationPlan?.levers || [];
  const operationalRisks = opportunity.validation?.checklist?.operationalRisks?.risks || {
    tooling: false,
    certifications: false,
    hazmat: false,
    oversize: false,
    fragile: false,
    moq: false
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Print-hidden header */}
      <div className="print:hidden bg-background border-b px-4 py-3">
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/opportunities/${id}/decision`}>
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Decision
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Sourcing Packet</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSummary(!editingSummary)}
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Edit Summary
            </Button>
            <Button onClick={handlePrint} size="sm">
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center py-2 border-b">
        <div className="text-sm font-medium">Amazon Product Research Sourcing Packet</div>
        <div className="text-xs text-muted-foreground">Generated on {new Date().toLocaleDateString()}</div>
      </div>

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-4 py-6 print:px-0 print:py-4">
        <PacketHeader opportunity={opportunity} />
        
        <div className="space-y-6 print:space-y-4">
          {/* Opportunity Summary */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg print:text-base">Opportunity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {editingSummary ? (
                <div className="space-y-3">
                  <Textarea
                    value={customSummary}
                    onChange={(e) => setCustomSummary(e.target.value)}
                    placeholder="Enter opportunity summary..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveSummary} size="sm">Save</Button>
                    <Button variant="outline" onClick={() => setEditingSummary(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed print:text-xs">
                  {customSummary || generateAutoSummary(opportunity)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Target Spec & Differentiation */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg print:text-base">Target Spec & Differentiation</CardTitle>
            </CardHeader>
            <CardContent>
              {differentiationLevers.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-2">Differentiation Strategy:</div>
                  <ul className="text-sm space-y-1 print:text-xs">
                    {differentiationLevers.map((lever, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{lever}</span>
                      </li>
                    ))}
                  </ul>
                  {opportunity.validation?.checklist?.differentiationPlan?.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-muted-foreground print:text-xs">
                        {opportunity.validation.checklist.differentiationPlan.notes}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground print:text-xs">
                  No differentiation strategy defined yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg print:text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <PacketMetricsTable opportunity={opportunity} />
            </CardContent>
          </Card>

          {/* Competitive Snapshot */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg print:text-base">Competitive Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <PacketCompetitorsTable opportunity={opportunity} />
            </CardContent>
          </Card>

          {/* Compliance & Operational Notes */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg print:text-base">Compliance & Operational Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm print:text-xs">
                <div>
                  <div className="font-medium mb-2">Operational Risk Factors:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>• Tooling Required: {operationalRisks.tooling ? 'Yes' : 'No'}</div>
                    <div>• Certifications: {operationalRisks.certifications ? 'Required' : 'None'}</div>
                    <div>• Hazmat/Oversize: {operationalRisks.hazmat || operationalRisks.oversize ? 'Yes' : 'No'}</div>
                    <div>• Fragile Handling: {operationalRisks.fragile ? 'Required' : 'Standard'}</div>
                    <div>• High MOQ Risk: {operationalRisks.moq ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                
                {opportunity.validation?.checklist?.operationalRisks?.notes && (
                  <div className="pt-2 border-t">
                    <div className="font-medium mb-1">Additional Notes:</div>
                    <div className="text-muted-foreground">
                      {opportunity.validation.checklist.operationalRisks.notes}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Actions */}
          <Card className="print:shadow-none print:border print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg print:text-base">Next Actions Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm print:text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border border-muted-foreground rounded"></span>
                  <span>Request quotes (MOQ, lead time, EXW/FOB pricing)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border border-muted-foreground rounded"></span>
                  <span>Order product samples for evaluation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border border-muted-foreground rounded"></span>
                  <span>Prepare packaging brief and design requirements</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border border-muted-foreground rounded"></span>
                  <span>Gather branding assets and product photography</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center py-2 border-t bg-background text-xs text-muted-foreground">
        <div>Page 1 of 1 • Generated from Amazon Product Research Playbook • {new Date().toLocaleDateString()}</div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0.5in;
              size: letter;
            }
            
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .print\\:break-inside-avoid {
              break-inside: avoid;
            }
            
            .print\\:break-before-page {
              break-before: page;
            }
            
            table {
              break-inside: avoid;
            }
            
            th, td {
              break-inside: avoid;
            }
          }
        `
      }} />
    </div>
  );
};

export default SourcingPacket;