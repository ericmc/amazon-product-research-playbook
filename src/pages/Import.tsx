import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, Plus } from "lucide-react";

// Import the new modular components and utilities
import { BlackBoxImporter } from "@/components/import/BlackBoxImporter";
import { MagnetImporter } from "@/components/import/MagnetImporter";
import { parseCSVFile } from "@/lib/parseCsv";
import { 
  processBlackBoxData, 
  AutoMappedProduct, 
  ProductData,
  normalizeCompetition 
} from "@/lib/normalizeBlackBox";
import { 
  processMagnetData, 
  AutoMappedMagnet,
  backfillWithMagnetData 
} from "@/lib/normalizeMagnet";

const HeliumImportWizard = () => {
  // Black Box import state
  const [blackBoxData, setBlackBoxData] = useState<AutoMappedProduct[] | null>(null);
  const [blackBoxSummary, setBlackBoxSummary] = useState<{count: number, revenueSource: string} | null>(null);
  const [isProcessingBlackBox, setIsProcessingBlackBox] = useState(false);
  
  // Magnet import state
  const [magnetData, setMagnetData] = useState<AutoMappedMagnet[] | null>(null);
  const [magnetSummary, setMagnetSummary] = useState<{count: number, source: string} | null>(null);
  const [isProcessingMagnet, setIsProcessingMagnet] = useState(false);
  
  // Combined processing state
  const [isImportingToDatabase, setIsImportingToDatabase] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle Black Box file upload
  const handleBlackBoxFile = async (file: File) => {
    setIsProcessingBlackBox(true);
    
    try {
      const parsed = await parseCSVFile(file);
      const { products, revenueSource } = processBlackBoxData(parsed);
      
      setBlackBoxData(products);
      setBlackBoxSummary({ count: products.length, revenueSource });
      
      toast({
        title: "Black Box Import Complete",
        description: `Successfully processed ${products.length} products`
      });
    } catch (error) {
      console.error('Black Box import error:', error);
      toast({
        title: "Import Failed",
        description: "Error processing Black Box CSV file",
        variant: "destructive"
      });
    } finally {
      setIsProcessingBlackBox(false);
    }
  };

  // Handle Magnet file upload
  const handleMagnetFile = async (file: File) => {
    setIsProcessingMagnet(true);
    
    try {
      const parsed = await parseCSVFile(file);
      const { keywords, source } = processMagnetData(parsed);
      
      setMagnetData(keywords);
      setMagnetSummary({ count: keywords.length, source });
      
      toast({
        title: "Magnet Import Complete",
        description: `Successfully processed ${keywords.length} keywords from ${source}`
      });
    } catch (error) {
      console.error('Magnet import error:', error);
      toast({
        title: "Import Failed",
        description: "Error processing Magnet/Cerebro CSV file",
        variant: "destructive"
      });
    } finally {
      setIsProcessingMagnet(false);
    }
  };

  // Get final products (with optional Magnet backfill)
  const getFinalProducts = (): AutoMappedProduct[] => {
    if (!blackBoxData) return [];
    
    if (magnetData && magnetData.length > 0) {
      return backfillWithMagnetData(blackBoxData, magnetData);
    }
    
    return blackBoxData;
  };

  // Import final products to database
  const handleImportToDatabase = async () => {
    const finalProducts = getFinalProducts();
    if (finalProducts.length === 0) return;
    
    setIsImportingToDatabase(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to import opportunities.",
          variant: "destructive"
        });
        return;
      }

      // Import each product as an opportunity - Use batch processing for performance
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < finalProducts.length; i += batchSize) {
        batches.push(finalProducts.slice(i, i + batchSize));
      }

      let totalImported = 0;
      for (const batch of batches) {
        const batchPromises = batch.map(async ({ productData, rawData, metadata }) => {
          const criteria = [
            {
              id: 'product_name',
              name: 'Product Name',
              weight: 0,
              value: 0,
              maxValue: 1,
              threshold: 1,
              description: productData.title
            },
            {
              id: 'revenue',
              name: 'Revenue',
              weight: 25,
              value: Math.min(productData.revenue, 50000),
              maxValue: 50000,
              threshold: 10000,
              description: 'Monthly revenue estimate'
            },
            {
              id: 'demand',
              name: 'Demand',
              weight: 25,
              value: Math.min(productData.searchVolume, 10000),
              maxValue: 10000,
              threshold: 1000,
              description: 'Monthly search volume'
            },
            {
              id: 'competition',
              name: 'Competition',
              weight: 25,
              value: normalizeCompetition(productData.competition),
              maxValue: 100,
              threshold: 70,
              description: 'Competition level'
            },
            {
              id: 'barriers',
              name: 'Barriers',
              weight: 10,
              value: 50, // Default value
              maxValue: 100,
              threshold: 60,
              description: 'Market entry barriers'
            },
            {
              id: 'seasonality',
              name: 'Seasonality',
              weight: 10,
              value: 30, // Default value
              maxValue: 100,
              threshold: 50,
              description: 'Seasonality risk'
            },
            {
              id: 'profitability',
              name: 'Profitability',
              weight: 5,
              value: 30, // Default value
              maxValue: 60,
              threshold: 25,
              description: 'Profit margin estimate'
            }
          ];

          // Calculate preliminary score
          const finalScore = Math.round(
            criteria.reduce((total, criterion) => {
              let normalizedValue = criterion.value;
              if (['competition', 'barriers', 'seasonality'].includes(criterion.id)) {
                normalizedValue = criterion.maxValue - criterion.value;
              }
              const score = (normalizedValue / criterion.maxValue) * 100;
              return total + (score * criterion.weight) / 100;
            }, 0)
          );

          const source = magnetData ? 'helium_10_combined' : 'helium_10_blackbox';
          const notes = `Auto-imported from Helium 10 - ASIN: ${productData.asin}, Dimensions: ${productData.dimensions}` + 
                      (magnetData ? `, Enhanced with ${magnetSummary?.source} data` : '');

          const opportunityResult = await supabase
            .from('opportunities')
            .insert({
              user_id: user.id,
              product_name: productData.title,
              source: source,
              criteria: criteria,
              final_score: finalScore,
              status: 'draft',
              notes: notes
            })
            .select()
            .single();

          if (opportunityResult.data) {
            // Store raw import data with metadata
            await supabase
              .from('raw_imports')
              .insert({
                user_id: user.id,
                opportunity_id: opportunityResult.data.id,
                source: source,
                raw_data: rawData,
                field_mappings: {},
                import_metadata: {
                  ...metadata,
                  magnetEnhanced: !!magnetData,
                  magnetSource: magnetSummary?.source
                }
              });
          }

          return opportunityResult;
        });

        const batchResults = await Promise.all(batchPromises);
        totalImported += batchResults.length;
        
        // Show progress for large imports
        if (finalProducts.length > 100) {
          toast({
            title: "Progress Update",
            description: `Imported ${totalImported} of ${finalProducts.length} products`
          });
        }
      }
      
      toast({
        title: "Import to Database Complete",
        description: `Successfully imported ${totalImported} opportunities to your database`
      });
      
      navigate('/opportunities');
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "There was an error importing your products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImportingToDatabase(false);
    }
  };

  const finalProducts = getFinalProducts();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Import Data</h1>
        <p className="text-muted-foreground">
          Import product data from Helium 10 research tools
        </p>
      </div>

      <Tabs defaultValue="blackbox" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blackbox">Black Box Import</TabsTrigger>
          <TabsTrigger value="magnet">Magnet/Cerebro Import</TabsTrigger>
        </TabsList>

        <TabsContent value="blackbox" className="space-y-6">
          <BlackBoxImporter
            onFileSelect={handleBlackBoxFile}
            isProcessing={isProcessingBlackBox}
            processedData={blackBoxData}
            importSummary={blackBoxSummary}
          />
        </TabsContent>

        <TabsContent value="magnet" className="space-y-6">
          <MagnetImporter
            onFileSelect={handleMagnetFile}
            isProcessing={isProcessingMagnet}
            processedData={magnetData}
            importSummary={magnetSummary}
          />
        </TabsContent>
      </Tabs>

      {/* Combined Data Actions */}
      {(blackBoxData || magnetData) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Import to Database
            </CardTitle>
            <CardDescription>
              {blackBoxData && magnetData 
                ? "Your Black Box data will be enhanced with Magnet insights before import"
                : blackBoxData 
                ? "Import your Black Box products as opportunities"
                : "Import your Magnet keywords as individual opportunities"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Black Box Products</p>
                <p className="text-2xl font-bold text-foreground">{blackBoxData?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Magnet Keywords</p>
                <p className="text-2xl font-bold text-foreground">{magnetData?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Final Opportunities</p>
                <p className="text-2xl font-bold text-foreground">{finalProducts.length}</p>
              </div>
            </div>
            
            <Button 
              onClick={handleImportToDatabase}
              disabled={isImportingToDatabase || finalProducts.length === 0}
              className="w-full"
              size="lg"
            >
              {isImportingToDatabase ? "Importing..." : `Import ${finalProducts.length} Opportunities to Database`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeliumImportWizard;