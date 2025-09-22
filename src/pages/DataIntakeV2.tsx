import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, ArrowRight } from "lucide-react";
import { BlackBoxImporter } from "@/components/import/BlackBoxImporter";
import { parseCSVFile } from "@/lib/parseCsv";
import { processBlackBoxData, AutoMappedProduct } from "@/lib/normalizeBlackBox";

const DataIntakeV2 = () => {
  const [products, setProducts] = useState<AutoMappedProduct[] | null>(null);
  const [importSummary, setImportSummary] = useState<{count: number, revenueSource: string} | null>(null);
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

  const handleContinue = () => {
    if (products) {
      // Store products in localStorage for the next step
      localStorage.setItem('importedProducts', JSON.stringify(products));
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

        {/* Placeholder for Magnet Import */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Helium 10 Magnet Import</CardTitle>
            <CardDescription>
              Coming soon - enhance your product data with keyword insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Keyword enhancement capabilities will be added here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataIntakeV2;