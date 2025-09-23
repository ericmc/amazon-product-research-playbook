import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Plus, X } from "lucide-react";
import jsPDF from "jspdf";

interface SourcingPacketData {
  keywords: string[];
  competitorASINs: string[];
  differentiation: string;
  screenshots: string[];
  links: string[];
  status: "requested-quotes" | "samples" | "in-tooling" | "not-started";
  notes: string;
}

interface SavedOpportunity {
  productName: string;
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
    value: number;
    maxValue: number;
    threshold: number;
  }>;
  finalScore: number;
  createdAt: string;
  sourcingPacket?: SourcingPacketData;
}

interface SourcingPacketProps {
  opportunityIndex: number;
  productName: string;
  opportunity: SavedOpportunity;
  onUpdate: (packet: SourcingPacketData) => void;
}

const SourcingPacket: React.FC<SourcingPacketProps> = ({
  opportunityIndex,
  productName,
  opportunity,
  onUpdate
}) => {
  const [packet, setPacket] = useState<SourcingPacketData>(
    opportunity.sourcingPacket || {
      keywords: [],
      competitorASINs: [],
      differentiation: "",
      screenshots: [],
      links: [],
      status: "not-started",
      notes: ""
    }
  );

  const [newKeyword, setNewKeyword] = useState("");
  const [newASIN, setNewASIN] = useState("");
  const [newLink, setNewLink] = useState("");

  const statusOptions = [
    { value: "not-started", label: "Not Started", color: "bg-gray-500" },
    { value: "requested-quotes", label: "Requested Quotes", color: "bg-blue-500" },
    { value: "samples", label: "Samples Ordered", color: "bg-amber-500" },
    { value: "in-tooling", label: "In Tooling", color: "bg-green-500" }
  ];

  const updatePacket = (updates: Partial<SourcingPacketData>) => {
    const updatedPacket = { ...packet, ...updates };
    setPacket(updatedPacket);
    onUpdate(updatedPacket);
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      updatePacket({ keywords: [...packet.keywords, newKeyword.trim()] });
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    updatePacket({ keywords: packet.keywords.filter((_, i) => i !== index) });
  };

  const addASIN = () => {
    if (newASIN.trim()) {
      updatePacket({ competitorASINs: [...packet.competitorASINs, newASIN.trim()] });
      setNewASIN("");
    }
  };

  const removeASIN = (index: number) => {
    updatePacket({ competitorASINs: packet.competitorASINs.filter((_, i) => i !== index) });
  };

  const addLink = () => {
    if (newLink.trim()) {
      updatePacket({ links: [...packet.links, newLink.trim()] });
      setNewLink("");
    }
  };

  const removeLink = (index: number) => {
    updatePacket({ links: packet.links.filter((_, i) => i !== index) });
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Sourcing Packet: ${productName}`, 20, yPosition);
    yPosition += 20;

    // Opportunity Score
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Opportunity Score: ${opportunity.finalScore}/100`, 20, yPosition);
    yPosition += 15;

    // Status
    const currentStatus = statusOptions.find(s => s.value === packet.status);
    pdf.text(`Status: ${currentStatus?.label || "Not Started"}`, 20, yPosition);
    yPosition += 20;

    // Metrics Summary
    pdf.setFont("helvetica", "bold");
    pdf.text("Metrics Summary", 20, yPosition);
    yPosition += 10;
    pdf.setFont("helvetica", "normal");
    
    opportunity.criteria.forEach(criterion => {
      const text = `${criterion.name}: ${(criterion.value || 0).toLocaleString()}`;
      pdf.text(text, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 10;

    // Keywords
    if (packet.keywords.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Top Keywords", 20, yPosition);
      yPosition += 10;
      pdf.setFont("helvetica", "normal");
      
      packet.keywords.forEach(keyword => {
        pdf.text(`• ${keyword}`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Competitor ASINs
    if (packet.competitorASINs.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Competitor ASINs", 20, yPosition);
      yPosition += 10;
      pdf.setFont("helvetica", "normal");
      
      packet.competitorASINs.forEach(asin => {
        pdf.text(`• ${asin}`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Differentiation Notes
    if (packet.differentiation) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Differentiation Strategy", 20, yPosition);
      yPosition += 10;
      pdf.setFont("helvetica", "normal");
      
      const splitText = pdf.splitTextToSize(packet.differentiation, pageWidth - 40);
      pdf.text(splitText, 25, yPosition);
      yPosition += splitText.length * 6 + 10;
    }

    // Links
    if (packet.links.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Reference Links", 20, yPosition);
      yPosition += 10;
      pdf.setFont("helvetica", "normal");
      
      packet.links.forEach(link => {
        pdf.text(`• ${link}`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Notes
    if (packet.notes) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Additional Notes", 20, yPosition);
      yPosition += 10;
      pdf.setFont("helvetica", "normal");
      
      const splitNotes = pdf.splitTextToSize(packet.notes, pageWidth - 40);
      pdf.text(splitNotes, 25, yPosition);
    }

    // Footer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, pdf.internal.pageSize.height - 10);

    // Save the PDF
    pdf.save(`${productName.replace(/[^a-z0-9]/gi, '_')}_sourcing_packet.pdf`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Sourcing Packet: {productName}</span>
              </CardTitle>
              <CardDescription>
                Compile all research data for supplier outreach
              </CardDescription>
            </div>
            <Button onClick={generatePDF} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <Label>Project Status</Label>
            <Select value={packet.status} onValueChange={(value: any) => updatePacket({ status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Metrics Summary (Read-only) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Opportunity Metrics</Label>
            <div className="grid grid-cols-2 gap-4">
              {opportunity.criteria.map(criterion => (
                <div key={criterion.id} className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">{criterion.name}</span>
                  <span className="text-sm font-medium">{(criterion.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Keywords */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Top Keywords</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                aria-label="Add new keyword"
              />
              <Button onClick={addKeyword} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {packet.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{keyword}</span>
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeKeyword(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Competitor ASINs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Competitor ASINs</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add ASIN..."
                value={newASIN}
                onChange={(e) => setNewASIN(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addASIN()}
              />
              <Button onClick={addASIN} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {packet.competitorASINs.map((asin, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1">
                  <span>{asin}</span>
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeASIN(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Differentiation Notes */}
          <div className="space-y-2">
            <Label htmlFor="differentiation">Differentiation Strategy</Label>
            <Textarea
              id="differentiation"
              placeholder="How will your product differentiate from competitors?"
              value={packet.differentiation}
              onChange={(e) => updatePacket({ differentiation: e.target.value })}
              rows={4}
            />
          </div>

          {/* Reference Links */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Reference Links</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add link..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLink()}
              />
              <Button onClick={addLink} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {packet.links.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <a 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {link}
                  </a>
                  <X 
                    className="w-4 h-4 cursor-pointer hover:text-destructive ml-2" 
                    onClick={() => removeLink(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information for suppliers..."
              value={packet.notes}
              onChange={(e) => updatePacket({ notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SourcingPacket;