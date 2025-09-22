import React, { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, TrendingUp, CheckCircle } from "lucide-react";
import { AutoMappedProduct } from "@/lib/normalizeBlackBox";
import { ProductWithKeywords } from "@/lib/matchKeyword";

interface MagnetImporterProps {
  products: AutoMappedProduct[];
  onEnriched: (enrichedProducts: ProductWithKeywords[]) => void;
  isProcessing: boolean;
  enrichmentSummary: {enriched: number, total: number, keywords: number} | null;
}

export const MagnetImporter: React.FC<MagnetImporterProps> = ({
  products,
  onEnriched,
  isProcessing,
  enrichmentSummary
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { parseMagnetCSV } = await import('@/lib/parseMagnet');
        const { mergeMagnetWithProducts } = await import('@/lib/mergeMagnet');
        
        const magnetData = await parseMagnetCSV(file);
        const result = mergeMagnetWithProducts(products, magnetData);
        
        onEnriched(result.products);
      } catch (error) {
        console.error('Magnet import error:', error);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Helium 10 Magnet/Cerebro Import
        </CardTitle>
        <CardDescription>
          Upload your Magnet or Cerebro CSV export for keyword analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enrichmentSummary ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={triggerFileSelect}
            >
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drop your Magnet/Cerebro CSV here to enrich with keyword data
              </p>
              <Button variant="outline" disabled={isProcessing || products.length === 0}>
                {isProcessing ? "Processing..." : "Select Keyword File"}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Auto-matches keywords to your {products.length} products</p>
              <p>• Fills in Search Volume and Competing Products</p>
              <p>• Suggests Primary Keywords for each product</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Keyword Enhancement Complete</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Products Enhanced</p>
                <p className="text-2xl font-bold">{enrichmentSummary.enriched}/{enrichmentSummary.total}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Keywords Processed</p>
                <p className="text-2xl font-bold">{enrichmentSummary.keywords}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Match Rate</p>
                <Badge variant="outline">
                  {Math.round((enrichmentSummary.enriched / enrichmentSummary.total) * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};