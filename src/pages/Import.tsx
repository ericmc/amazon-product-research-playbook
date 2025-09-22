import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Database,
  Info,
  Plus,
  TrendingUp
} from "lucide-react";

interface ParsedData {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

interface ProductData {
  asin: string;
  title: string;
  brand: string;
  keyword: string;
  searchVolume: number;
  revenue: number;
  unitsSold: number;
  price: number;
  competition: string;
  dimensions?: string;
  weight?: string;
  rating?: number;
  reviewCount?: number;
  competingProducts?: number;
}

interface AutoMappedProduct {
  productData: ProductData;
  rawData: Record<string, string>;
  metadata: Record<string, string>;
}

// Auto-mapping for Helium 10 Black Box CSV headers
const helium10AutoMap = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // Core Black Box fields - exact matches
    if (lowerHeader === 'asin') mapping['asin'] = header;
    else if (lowerHeader === 'title') mapping['title'] = header;
    else if (lowerHeader === 'brand') mapping['brand'] = header;
    else if (lowerHeader === 'url') mapping['url'] = header;
    else if (lowerHeader === 'image url') mapping['imageUrl'] = header;
    else if (lowerHeader === 'category') mapping['category'] = header;
    else if (lowerHeader === 'best seller rank' || lowerHeader === 'bsr' || lowerHeader === 'category bsr') mapping['bsr'] = header;
    else if (lowerHeader === 'fulfillment') mapping['fulfillment'] = header;
    else if (lowerHeader === 'price') mapping['price'] = header;
    else if (lowerHeader === 'asin revenue') mapping['revenue'] = header;
    else if (lowerHeader === 'parent level revenue') mapping['parentRevenue'] = header;
    else if (lowerHeader === 'reviews') mapping['reviewCount'] = header;
    else if (lowerHeader === 'reviews rating') mapping['rating'] = header;
    else if (lowerHeader === 'weight' || lowerHeader === 'weight (lb)') mapping['weight'] = header;
    else if (lowerHeader === 'length') mapping['length'] = header;
    else if (lowerHeader === 'width') mapping['width'] = header;
    else if (lowerHeader === 'height') mapping['height'] = header;
    
    // Fallback patterns for optional Magnet/Cerebro fields
    else if (lowerHeader.includes('search volume')) mapping['searchVolume'] = header;
    else if (lowerHeader.includes('competing products') || lowerHeader.includes('competitors')) mapping['competingProducts'] = header;
    else if (lowerHeader.includes('units sold') || lowerHeader.includes('monthly units')) mapping['unitsSold'] = header;
    else if (lowerHeader.includes('keyword') && !mapping['keyword']) mapping['keyword'] = header;
    else if (lowerHeader.includes('competition') && !mapping['competition']) mapping['competition'] = header;
  });
  
  return mapping;
};

const HeliumImportWizard = () => {
  const [blackBoxFile, setBlackBoxFile] = useState<File | null>(null);
  const [magnetFile, setMagnetFile] = useState<File | null>(null);
  const [processedProducts, setProcessedProducts] = useState<AutoMappedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importSummary, setImportSummary] = useState<{count: number, revenueSource: string} | null>(null);
  const [showMagnetUpload, setShowMagnetUpload] = useState(false);
  
  const blackBoxInputRef = useRef<HTMLInputElement>(null);
  const magnetInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const normalizeValue = (value: string): number => {
    if (!value || typeof value !== 'string') return 0;
    
    // Trim whitespace
    const trimmed = value.trim();
    if (!trimmed) return 0;
    
    // Remove common prefixes and formatting
    let cleaned = trimmed.replace(/[$,\s%]/g, '');
    
    // Handle different number formats
    if (cleaned.includes('K') || cleaned.includes('k')) {
      cleaned = cleaned.replace(/[Kk]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed * 1000;
    }
    if (cleaned.includes('M') || cleaned.includes('m')) {
      cleaned = cleaned.replace(/[Mm]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed * 1000000;
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const normalizeCompetition = (competition: string): number => {
    const lower = competition?.toLowerCase().trim();
    switch (lower) {
      case 'low': return 25;
      case 'medium': return 50;
      case 'high': return 75;
      default: return parseFloat(competition) || 50;
    }
  };

  const buildDimensions = (rawData: Record<string, string>, mapping: Record<string, string>): string => {
    const dimensionParts = [];
    
    // Build dimensions from Length x Width x Height, skip missing parts gracefully
    if (mapping.length || mapping.width || mapping.height) {
      const length = rawData[mapping.length || '']?.trim();
      const width = rawData[mapping.width || '']?.trim();
      const height = rawData[mapping.height || '']?.trim();
      
      // Only include non-empty dimension parts
      const validParts = [length, width, height].filter(part => part && part.length > 0);
      if (validParts.length > 0) {
        return validParts.join(' x ');
      }
    }
    
    // If no dimensions available, return "N/A"
    return "N/A";
  };

  const detectDelimiter = (text: string): string => {
    const delimiters = [',', ';', '\t', '|'];
    const firstLine = text.split('\n')[0];
    
    let maxCount = 0;
    let bestDelimiter = ',';
    
    for (const delimiter of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }
    
    return bestDelimiter;
  };

  const parseCSV = (text: string, delimiter: string): ParsedData => {
    const lines = text.trim().split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Skip empty rows
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(delimiter).map(cell => cell.trim().replace(/['"]/g, ''))
    ).filter(row => row.some(cell => cell.length > 0)); // Skip completely empty rows
    
    return { headers, rows, delimiter };
  };

  const processBlackBoxData = (data: ParsedData): {products: AutoMappedProduct[], revenueSource: string} => {
    const mapping = helium10AutoMap(data.headers);
    
    // Determine revenue source used
    let revenueSource = 'N/A';
    if (mapping.revenue) revenueSource = 'ASIN Revenue';
    else if (mapping.parentRevenue) revenueSource = 'Parent Level Revenue';
    
    const products = data.rows.map(row => {
      const rawData: Record<string, string> = {};
      data.headers.forEach((header, index) => {
        rawData[header] = row[index] || '';
      });

      const productData: ProductData = {
        asin: (rawData[mapping.asin] || '').trim(),
        title: (rawData[mapping.title] || '').trim(),
        brand: (rawData[mapping.brand] || '').trim(),
        keyword: (rawData[mapping.title] || '').trim(), // Use title as keyword for now
        searchVolume: 0, // Leave blank for now
        revenue: normalizeValue(rawData[mapping.revenue] || rawData[mapping.parentRevenue] || '0'),
        unitsSold: 0, // Leave blank for now
        price: normalizeValue(rawData[mapping.price] || '0'),
        competition: '', // Leave blank for now
        dimensions: buildDimensions(rawData, mapping),
        weight: (rawData[mapping.weight] || '').trim(),
        rating: normalizeValue(rawData[mapping.rating] || '0'),
        reviewCount: normalizeValue(rawData[mapping.reviewCount] || '0'),
        competingProducts: 0 // Leave blank for now
      };

      // Store metadata for detail views - sanitize all values
      const metadata = {
        asin: (rawData[mapping.asin] || '').trim(),
        brand: (rawData[mapping.brand] || '').trim(),
        url: (rawData[mapping.url] || '').trim(),
        imageUrl: (rawData[mapping.imageUrl] || '').trim(),
        category: (rawData[mapping.category] || '').trim(),
        bsr: (rawData[mapping.bsr] || '').trim(),
        fulfillment: (rawData[mapping.fulfillment] || '').trim()
      };

      return { productData, rawData, metadata };
    });

    return { products, revenueSource };
  };

  const handleBlackBoxUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBlackBoxFile(file);
      setIsProcessing(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const delimiter = detectDelimiter(text);
        const parsed = parseCSV(text, delimiter);
        
        // Auto-process the Black Box data
        const { products, revenueSource } = processBlackBoxData(parsed);
        setProcessedProducts(products);
        setImportSummary({ count: products.length, revenueSource });
        setIsProcessing(false);
        setImportComplete(true);
        
        toast({
          title: "Import Complete",
          description: `Successfully processed ${products.length} products from Black Box export`
        });
      };
      reader.readAsText(file);
    }
  };

  const handleMagnetUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMagnetFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const delimiter = detectDelimiter(text);
        const parsed = parseCSV(text, delimiter);
        
        // Backfill search volume and competing products data
        backfillMagnetData(parsed);
        
        toast({
          title: "Magnet Data Processed",
          description: "Backfilled search volume and competition data"
        });
      };
      reader.readAsText(file);
    }
  };

  const backfillMagnetData = (magnetData: ParsedData) => {
    const mapping = helium10AutoMap(magnetData.headers);
    
    setProcessedProducts(prevProducts => 
      prevProducts.map(product => {
        // Find matching row in Magnet data by keyword
        const matchingRow = magnetData.rows.find(row => {
          const keywordIndex = magnetData.headers.indexOf(mapping.keyword || '');
          return keywordIndex >= 0 && row[keywordIndex]?.toLowerCase().includes(product.productData.keyword.toLowerCase());
        });

        if (matchingRow) {
          const rawData: Record<string, string> = {};
          magnetData.headers.forEach((header, index) => {
            rawData[header] = matchingRow[index] || '';
          });

          return {
            ...product,
            productData: {
              ...product.productData,
              searchVolume: normalizeValue(rawData[mapping.searchVolume] || product.productData.searchVolume.toString()),
              competingProducts: normalizeValue(rawData[mapping.competingProducts] || product.productData.competingProducts?.toString() || '0')
            }
          };
        }

        return product;
      })
    );
  };

  const handleImportProducts = async () => {
    if (processedProducts.length === 0) return;
    
    setIsProcessing(true);
    
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
      for (let i = 0; i < processedProducts.length; i += batchSize) {
        batches.push(processedProducts.slice(i, i + batchSize));
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

          const opportunityResult = await supabase
            .from('opportunities')
            .insert({
              user_id: user.id,
              product_name: productData.title,
              source: 'helium_10',
              criteria: criteria,
              final_score: finalScore,
              status: 'draft',
              notes: `Auto-imported from Helium 10 Black Box - ASIN: ${productData.asin}, Dimensions: ${productData.dimensions}`
            })
            .select()
            .single();

          if (opportunityResult.data) {
            // Store raw import data with metadata
            const mapping = helium10AutoMap([]);
            await supabase
              .from('raw_imports')
              .insert({
                user_id: user.id,
                opportunity_id: opportunityResult.data.id,
                source: 'helium_10_blackbox',
                raw_data: rawData,
                field_mappings: mapping,
                import_metadata: metadata
              });
          }

          return opportunityResult;
        });

        const batchResults = await Promise.all(batchPromises);
        totalImported += batchResults.length;
        
        // Show progress for large imports
        if (processedProducts.length > 100) {
          toast({
            title: "Progress Update",
            description: `Imported ${totalImported} of ${processedProducts.length} products`
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
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground">Helium 10 CSV Import</h1>
        <p className="text-muted-foreground">
          Import your Black Box data - no setup required
        </p>
      </div>

      {!importComplete ? (
        /* Step 1: Single Upload Dropzone */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>Upload Helium 10 Black Box CSV (no setup required)</span>
            </CardTitle>
            <CardDescription>
              Upload your Helium 10 Black Box export CSV file exactly as downloaded. Auto-mapping included!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Input
                ref={blackBoxInputRef}
                type="file"
                accept=".csv"
                onChange={handleBlackBoxUpload}
                className="hidden"
                aria-label="Upload Black Box CSV file"
                disabled={isProcessing}
              />
              <div className="space-y-4">
                {isProcessing ? (
                  <>
                    <Database className="w-12 h-12 text-primary mx-auto animate-pulse" />
                    <p className="text-sm font-medium">Processing your CSV file...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-sm font-medium">Drop your Black Box CSV file here or click to browse</p>
                      <p className="text-xs text-muted-foreground">Auto-maps ASIN, Title, Revenue, Price, Reviews, Dimensions, etc.</p>
                    </div>
                    <Button onClick={() => blackBoxInputRef.current?.click()}>
                      Choose Black Box CSV
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {blackBoxFile && !isProcessing && (
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{blackBoxFile.name}</span>
                <Badge variant="secondary">{(blackBoxFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Step 2: Import Complete - Show Summary and Options */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Import Complete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Products Processed</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{importSummary?.count || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Revenue Source</span>
                  </div>
                  <p className="text-lg font-semibold">{importSummary?.revenueSource || 'N/A'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex space-x-4">
                <Button onClick={handleImportProducts} disabled={isProcessing} className="flex-1">
                  {isProcessing ? "Importing..." : "Import to Database"}
                </Button>
                
                {!showMagnetUpload && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMagnetUpload(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Magnet/Cerebro Data</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Optional Magnet Upload */}
          {showMagnetUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  <span>Optional: Upload Magnet/Cerebro Data</span>
                </CardTitle>
                <CardDescription>
                  Backfill search volume and competing products data from Magnet or Cerebro export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
                  <Input
                    ref={magnetInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleMagnetUpload}
                    className="hidden"
                    aria-label="Upload Magnet/Cerebro CSV file"
                  />
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                    <p className="text-sm">Upload Magnet/Cerebro CSV to backfill search volume data</p>
                    <Button variant="outline" onClick={() => magnetInputRef.current?.click()}>
                      Choose Magnet/Cerebro CSV
                    </Button>
                  </div>
                </div>
                
                {magnetFile && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{magnetFile.name}</span>
                    <Badge variant="secondary">{(magnetFile.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default HeliumImportWizard;