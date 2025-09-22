import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Database,
  Info,
  Plus
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
  const [blackBoxData, setBlackBoxData] = useState<ParsedData | null>(null);
  const [magnetData, setMagnetData] = useState<ParsedData | null>(null);
  const [processedProducts, setProcessedProducts] = useState<AutoMappedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStep, setUploadStep] = useState<'blackbox' | 'magnet' | 'review'>('blackbox');
  
  const blackBoxInputRef = useRef<HTMLInputElement>(null);
  const magnetInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const normalizeValue = (value: string): number => {
    if (!value) return 0;
    
    // Remove common prefixes and formatting
    let cleaned = value.replace(/[$,\s%]/g, '');
    
    // Handle different number formats
    if (cleaned.includes('K') || cleaned.includes('k')) {
      cleaned = cleaned.replace(/[Kk]/g, '');
      return parseFloat(cleaned) * 1000;
    }
    if (cleaned.includes('M') || cleaned.includes('m')) {
      cleaned = cleaned.replace(/[Mm]/g, '');
      return parseFloat(cleaned) * 1000000;
    }
    
    return parseFloat(cleaned) || 0;
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
    const dims = [];
    
    // Build dimensions from Length x Width x Height, skip missing parts gracefully
    if (mapping.length || mapping.width || mapping.height) {
      const length = rawData[mapping.length || ''];
      const width = rawData[mapping.width || ''];
      const height = rawData[mapping.height || ''];
      
      const dimensionParts = [length, width, height].filter(part => part && part.trim());
      if (dimensionParts.length > 0) {
        return dimensionParts.join(' x ');
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
    const lines = text.trim().split('\n').filter(line => line.trim());
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(delimiter).map(cell => cell.trim().replace(/['"]/g, ''))
    );
    
    return { headers, rows, delimiter };
  };

  const processBlackBoxData = (data: ParsedData): AutoMappedProduct[] => {
    const mapping = helium10AutoMap(data.headers);
    
    return data.rows.map(row => {
      const rawData: Record<string, string> = {};
      data.headers.forEach((header, index) => {
        rawData[header] = row[index] || '';
      });

      const productData: ProductData = {
        asin: rawData[mapping.asin] || '',
        title: rawData[mapping.title] || '',
        brand: rawData[mapping.brand] || '',
        keyword: rawData[mapping.title] || '', // Use title as keyword for now
        searchVolume: 0, // Leave blank for now
        revenue: normalizeValue(rawData[mapping.revenue] || rawData[mapping.parentRevenue] || '0'),
        unitsSold: 0, // Leave blank for now
        price: normalizeValue(rawData[mapping.price] || '0'),
        competition: '', // Leave blank for now
        dimensions: buildDimensions(rawData, mapping),
        weight: rawData[mapping.weight] || '',
        rating: normalizeValue(rawData[mapping.rating] || '0'),
        reviewCount: normalizeValue(rawData[mapping.reviewCount] || '0'),
        competingProducts: 0 // Leave blank for now
      };

      // Store metadata for detail views
      const metadata = {
        asin: rawData[mapping.asin] || '',
        brand: rawData[mapping.brand] || '',
        url: rawData[mapping.url] || '',
        imageUrl: rawData[mapping.imageUrl] || '',
        category: rawData[mapping.category] || '',
        bsr: rawData[mapping.bsr] || '',
        fulfillment: rawData[mapping.fulfillment] || ''
      };

      return { productData, rawData, metadata };
    });
  };

  const handleBlackBoxUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBlackBoxFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const delimiter = detectDelimiter(text);
        const parsed = parseCSV(text, delimiter);
        setBlackBoxData(parsed);
        
        // Auto-process the Black Box data
        const products = processBlackBoxData(parsed);
        setProcessedProducts(products);
        setUploadStep('magnet');
        
        toast({
          title: "Black Box Data Processed",
          description: `Imported ${products.length} products from Black Box export`
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
        setMagnetData(parsed);
        
        // Backfill search volume and competing products data
        backfillMagnetData(parsed);
        setUploadStep('review');
        
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

      // Import each product as an opportunity
      const importPromises = processedProducts.map(async ({ productData, rawData, metadata }) => {
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
          const mapping = helium10AutoMap(blackBoxData?.headers || []);
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

      await Promise.all(importPromises);
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${processedProducts.length} opportunities`
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

  const skipMagnetUpload = () => {
    setUploadStep('review');
    toast({
      title: "Skipped Magnet Upload",
      description: "You can proceed with Black Box data only"
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground">Helium 10 CSV Import</h1>
        <p className="text-muted-foreground">
          Import Black Box CSV data with optional Magnet/Cerebro backfill
        </p>
      </div>

      {/* Step 1: Black Box Upload */}
      {uploadStep === 'blackbox' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>Step 1: Upload Black Box CSV</span>
            </CardTitle>
            <CardDescription>
              Upload your Helium 10 Black Box export CSV file exactly as downloaded
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
              />
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium">Drop your Black Box CSV file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Auto-maps ASIN, Title, Revenue, Competition, etc.</p>
                </div>
                <Button onClick={() => blackBoxInputRef.current?.click()}>
                  Choose Black Box CSV
                </Button>
              </div>
            </div>
            
            {blackBoxFile && (
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{blackBoxFile.name}</span>
                <Badge variant="secondary">{(blackBoxFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What gets auto-mapped:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>• ASIN → Product ID</div>
                <div>• Product Title → Product Name</div>
                <div>• Revenue → Monthly Revenue</div>
                <div>• Competition → Competition Level</div>
                <div>• Brand → Brand Name</div>
                <div>• Dimensions → Size String</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Magnet Upload (Optional) */}
      {uploadStep === 'magnet' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Step 2: Upload Magnet/Cerebro CSV (Optional)</span>
            </CardTitle>
            <CardDescription>
              Backfill search volume and competing products data from Magnet or Cerebro exports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Input
                ref={magnetInputRef}
                type="file"
                accept=".csv"
                onChange={handleMagnetUpload}
                className="hidden"
                aria-label="Upload Magnet CSV file"
              />
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium">Upload Magnet or Cerebro CSV to enhance data</p>
                  <p className="text-xs text-muted-foreground">Adds search volume and competitor count data</p>
                </div>
                <div className="flex space-x-2 justify-center">
                  <Button onClick={() => magnetInputRef.current?.click()}>
                    Choose Magnet CSV
                  </Button>
                  <Button variant="outline" onClick={skipMagnetUpload}>
                    Skip - Use Black Box Only
                  </Button>
                </div>
              </div>
            </div>
            
            {magnetFile && (
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{magnetFile.name}</span>
                <Badge variant="secondary">{(magnetFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Magnet/Cerebro enhances:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                <div>• Search Volume → Demand Data</div>
                <div>• Competing Products → Competition Count</div>
                <div>• Keyword Match → Product Linking</div>
                <div>• Market Size → Volume Metrics</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review and Import */}
      {uploadStep === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Step 3: Review and Import</span>
            </CardTitle>
            <CardDescription>
              Review the processed products before importing to opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Products Ready for Import</h4>
              <Badge variant="outline">{processedProducts.length} products</Badge>
            </div>

            {processedProducts.length > 0 && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Product</th>
                        <th className="text-left p-2 font-medium">ASIN</th>
                        <th className="text-left p-2 font-medium">Revenue</th>
                        <th className="text-left p-2 font-medium">Search Vol</th>
                        <th className="text-left p-2 font-medium">Competition</th>
                        <th className="text-left p-2 font-medium">Dimensions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedProducts.slice(0, 10).map((product, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 max-w-xs truncate">{product.productData.title}</td>
                          <td className="p-2">{product.productData.asin}</td>
                          <td className="p-2">${product.productData.revenue.toLocaleString()}</td>
                          <td className="p-2">{product.productData.searchVolume.toLocaleString()}</td>
                          <td className="p-2">{product.productData.competition}</td>
                          <td className="p-2">{product.productData.dimensions || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {processedProducts.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing first 10 products. {processedProducts.length - 10} more will be imported.
                  </p>
                )}

                <div className="flex space-x-2 justify-end">
                  <Button variant="outline" onClick={() => setUploadStep('blackbox')}>
                    Start Over
                  </Button>
                  <Button 
                    onClick={handleImportProducts} 
                    disabled={isProcessing}
                    className="min-w-32"
                  >
                    {isProcessing ? "Importing..." : "Import All Products"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {processedProducts.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found. Please upload a valid Black Box CSV.</p>
                <Button variant="outline" onClick={() => setUploadStep('blackbox')} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeliumImportWizard;