import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, ArrowRight, TrendingUp } from "lucide-react";
import { BlackBoxImporter } from "@/components/import/BlackBoxImporter";
import { MagnetImporter } from "@/components/import/MagnetImporter";
import { KeywordReviewPanel } from "@/components/import/KeywordReviewPanel";
import { parseCSVFile } from "@/lib/parseCsv";
import { processBlackBoxData, AutoMappedProduct } from "@/lib/normalizeBlackBox";
import { ProductWithKeywords } from "@/lib/matchKeyword";

const DataIntakeV2 = () => {
  const [products, setProducts] = useState<AutoMappedProduct[] | null>(null);
  const [enrichedProducts, setEnrichedProducts] = useState<ProductWithKeywords[] | null>(null);
  const [importSummary, setImportSummary] = useState<{count: number, revenueSource: string} | null>(null);
  const [enrichmentSummary, setEnrichmentSummary] = useState<{enriched: number, total: number, keywords: number} | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImport = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const parsed = await parseCSVFile(file);
      const { products: processedProducts, revenueSource } = processBlackBoxData(parsed);
      
      setProducts(processedProducts);
      setImportSummary({ count: processedProducts.length, revenueSource });
      
      toast({
        title: "Import Complete",
        description: `Successfully processed ${processedProducts.length} products`
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Error processing CSV file. Please check the format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMagnetEnrichment = (enhanced: ProductWithKeywords[]) => {
    setEnrichedProducts(enhanced);
    
    // Calculate enrichment summary
    const enrichedCount = enhanced.filter(p => p.primaryKeyword).length;
    const keywordCount = enhanced.reduce((acc, p) => acc + (p.suggestedKeywords?.length || 0), 0);
    
    setEnrichmentSummary({
      enriched: enrichedCount,
      total: enhanced.length,
      keywords: keywordCount
    });

    // Auto-show review panel if we have enriched products
    if (enrichedCount > 0) {
      setShowReviewPanel(true);
    }

    toast({
      title: "Keyword Enhancement Complete",
      description: `Enhanced ${enrichedCount} of ${enhanced.length} products with keyword data`
    });
  };

  const handleReviewComplete = (finalProducts: ProductWithKeywords[]) => {
    setEnrichedProducts(finalProducts);
    setShowReviewPanel(false);
  };

  const handleContinue = () => {
    const finalProducts = enrichedProducts || products;
    if (finalProducts) {
      // Store products in localStorage for the next step
      localStorage.setItem('importedProducts', JSON.stringify(finalProducts));
      navigate('/score');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Import Product Data</h1>
        <p className="text-muted-foreground">
          Upload your Helium 10 Black Box CSV to get started with opportunity analysis
        </p>
      </div>

      {/* Import Section */}
      <div className="space-y-6">
        <BlackBoxImporter
          onFileSelect={handleImport}
          isProcessing={isProcessing}
          processedData={products}
          importSummary={importSummary}
        />

        {/* Summary and Continue */}
        {products && importSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                Import Summary
              </CardTitle>
              <CardDescription>
                Your data has been processed and is ready for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Products Imported</p>
                  <p className="text-2xl font-bold text-foreground">{importSummary.count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Revenue Source</p>
                  <Badge variant="outline">{importSummary.revenueSource}</Badge>
                </div>
              </div>
              
              <Button 
                onClick={handleContinue}
                className="w-full"
                size="lg"
              >
                Continue to Scoring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Magnet/Cerebro Import */}
        {products && !showReviewPanel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Enhance with Keyword Data (Optional)
              </CardTitle>
              <CardDescription>
                Upload Helium 10 Magnet or Cerebro CSV to auto-fill search volume and keyword metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MagnetImporter
                products={products}
                onEnriched={handleMagnetEnrichment}
                isProcessing={isProcessing}
                enrichmentSummary={enrichmentSummary}
                onParseWarnings={setParseWarnings}
              />
              
              {/* Show warnings if any */}
              {parseWarnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Import Warnings:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {parseWarnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Keyword Review Panel */}
        {showReviewPanel && enrichedProducts && (
          <KeywordReviewPanel
            products={enrichedProducts}
            onProductsUpdate={handleReviewComplete}
            onContinue={() => setShowReviewPanel(false)}
          />
        )}
      </div>
    </div>
  );
};

export default DataIntakeV2;