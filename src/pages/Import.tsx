import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileText, 
  Eye, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Database,
  ExternalLink,
  Download,
  Clipboard,
  ChevronDown,
  ChevronUp,
  Info,
  Copy
} from "lucide-react";

interface SourceOption {
  id: 'jungle_scout' | 'helium_10' | 'amazon_poe' | 'manual';
  name: string;
  description: string;
  icon: string;
  features: string[];
  csvTemplate: {
    sampleHeaders: string[];
    commonMappings: { header: string; mapsTo: string; description: string; }[];
    notes: string[];
  };
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

interface FieldMapping {
  [appField: string]: string; // app field -> csv column
}

interface AppField {
  key: string;
  name: string;
  description: string;
  required: boolean;
  unit?: string;
  type: 'number' | 'text';
}

const sourceOptions: SourceOption[] = [
  {
    id: 'jungle_scout',
    name: 'Jungle Scout',
    description: 'Product database and opportunity finder',
    icon: '🦍',
    features: ['Revenue estimates', 'Search volume', 'Competition data', 'Review counts'],
    csvTemplate: {
      sampleHeaders: [
        'Product Title', 'Monthly Revenue', 'Price', 'Reviews', 'Rating', 'BSR', 
        'Category', 'Sales', 'FBA Fees', 'Net', 'Opportunity Score'
      ],
      commonMappings: [
        { header: 'Product Title', mapsTo: 'Product Name', description: 'Product title or ASIN' },
        { header: 'Monthly Revenue', mapsTo: 'Revenue', description: 'Estimated monthly revenue (primary metric)' },
        { header: 'Reviews', mapsTo: 'Competition', description: 'Review count as competition proxy' },
        { header: 'Sales', mapsTo: 'Demand', description: 'Monthly sales volume or units sold' },
        { header: 'Net', mapsTo: 'Profitability', description: 'Net profit or margin percentage' }
      ],
      notes: [
        'Monthly Revenue is the most accurate field for our revenue scoring',
        'Review count indicates market saturation - higher reviews = more competition',
        'BSR and Category help contextualize the market size',
        'Seasonality data usually requires manual analysis of the trend graphs'
      ]
    }
  },
  {
    id: 'helium_10', 
    name: 'Helium 10',
    description: 'Black Box and Magnet tools',
    icon: '🎈',
    features: ['Black Box revenue', 'Magnet keywords', 'Review analysis', 'Profit calculator'],
    csvTemplate: {
      sampleHeaders: [
        'Title', 'Revenue', 'Price', 'Review Count', 'Rating', 'Weight', 'Dimensions',
        'Search Volume', 'Competing Products', 'Profit Margin', 'ROI'
      ],
      commonMappings: [
        { header: 'Title', mapsTo: 'Product Name', description: 'Product title from Black Box' },
        { header: 'Revenue', mapsTo: 'Revenue', description: 'Monthly revenue estimates' },
        { header: 'Search Volume', mapsTo: 'Demand', description: 'Keyword search volume from Magnet' },
        { header: 'Review Count', mapsTo: 'Competition', description: 'Total reviews indicating competition' },
        { header: 'Profit Margin', mapsTo: 'Profitability', description: 'Calculated margin from Profitability tool' }
      ],
      notes: [
        'Black Box provides comprehensive revenue data across product variations',
        'Combine with Magnet keyword data for demand metrics',
        'Use Profitability Calculator exports for accurate margin data',
        'Competing Products count can indicate market saturation'
      ]
    }
  },
  {
    id: 'amazon_poe',
    name: 'Amazon POE',
    description: 'Product Opportunity Explorer',
    icon: '📊',
    features: ['Search frequency', 'Click share', 'Market concentration', 'Seasonal trends'],
    csvTemplate: {
      sampleHeaders: [
        'Search Term', 'Search Frequency Rank', 'Search Frequency', 'Click Share',
        'Conversion Share', '#3P Sellers', 'Product Title', 'Brand'
      ],
      commonMappings: [
        { header: 'Search Term', mapsTo: 'Product Name', description: 'Main search keyword or product category' },
        { header: 'Search Frequency', mapsTo: 'Demand', description: 'Real Amazon search volume data' },
        { header: '#3P Sellers', mapsTo: 'Competition', description: 'Number of third-party sellers' },
        { header: 'Click Share', mapsTo: 'Competition', description: 'Market concentration metric' }
      ],
      notes: [
        'POE provides the most accurate search data since it\'s directly from Amazon',
        'Requires Amazon Brand Registry access to use',
        'Search Frequency is the gold standard for demand metrics',
        'Use seasonal trend data for seasonality scoring (manual analysis)',
        'Click Share and Conversion Share indicate market competitiveness'
      ]
    }
  },
  {
    id: 'manual',
    name: 'Manual Entry',
    description: 'Type or paste your own data',
    icon: '✏️',
    features: ['Custom research', 'Multiple sources', 'Flexible input', 'Quick entry'],
    csvTemplate: {
      sampleHeaders: [
        'Product Name', 'Monthly Revenue', 'Search Volume', 'Competition Score',
        'Entry Barriers', 'Seasonality Risk', 'Profit Margin'
      ],
      commonMappings: [
        { header: 'Product Name', mapsTo: 'Product Name', description: 'Any product identifier' },
        { header: 'Monthly Revenue', mapsTo: 'Revenue', description: 'Revenue in USD' },
        { header: 'Search Volume', mapsTo: 'Demand', description: 'Monthly search volume' },
        { header: 'Competition Score', mapsTo: 'Competition', description: 'Competition rating (0-100)' },
        { header: 'Profit Margin', mapsTo: 'Profitability', description: 'Margin percentage' }
      ],
      notes: [
        'Use this for data compiled from multiple sources',
        'Flexible header names - you can map any column to any field',
        'Supports data from custom research or other tools',
        'Ideal for combining insights from multiple research methods'
      ]
    }
  }
];

const appFields: AppField[] = [
  {
    key: 'product_name',
    name: 'Product Name',
    description: 'Product title or description',
    required: true,
    type: 'text'
  },
  {
    key: 'revenue',
    name: 'Monthly Revenue',
    description: 'Estimated monthly revenue potential',
    required: true,
    unit: 'USD',
    type: 'number'
  },
  {
    key: 'demand',
    name: 'Market Demand',
    description: 'Monthly search volume or demand score',
    required: true,
    unit: 'searches/month',
    type: 'number'
  },
  {
    key: 'competition',
    name: 'Competition Level',
    description: 'Competition score or review count',
    required: true,
    unit: 'score/reviews',
    type: 'number'
  },
  {
    key: 'barriers',
    name: 'Entry Barriers',
    description: 'Barriers to entry score',
    required: false,
    unit: 'score',
    type: 'number'
  },
  {
    key: 'seasonality',
    name: 'Seasonality Risk',
    description: 'Seasonal variation score',
    required: false,
    unit: 'score',
    type: 'number'
  },
  {
    key: 'profitability',
    name: 'Profit Margin',
    description: 'Expected profit margin percentage',
    required: false,
    unit: '%',
    type: 'number'
  }
];

const DataImportWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'csv' | 'paste'>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pastedData, setPastedData] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping>({});
  const [productName, setProductName] = useState('');
  const [expandedHelp, setExpandedHelp] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Sample headers copied to your clipboard"
    });
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const delimiter = detectDelimiter(text);
        const parsed = parseCSV(text, delimiter);
        setParsedData(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteData = () => {
    if (pastedData.trim()) {
      const delimiter = detectDelimiter(pastedData);
      const parsed = parseCSV(pastedData, delimiter);
      setParsedData(parsed);
    }
  };

  const handleFieldMapping = (appField: string, csvColumn: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [appField]: csvColumn
    }));
  };

  const normalizeValue = (value: string, field: AppField): number => {
    if (field.type === 'text') return 0;
    
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

  const handleSubmit = async () => {
    if (!parsedData || !selectedSource) return;
    
    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save opportunities.",
          variant: "destructive"
        });
        return;
      }

      // Map and normalize the data
      const mappedRow = parsedData.rows[0]; // For now, process first row
      const criteria = appFields.map(field => {
        const csvColumn = fieldMappings[field.key];
        const columnIndex = csvColumn ? parsedData.headers.indexOf(csvColumn) : -1;
        const rawValue = columnIndex >= 0 ? mappedRow[columnIndex] : '';
        
        let value = 0;
        let maxValue = 100;
        let threshold = 50;
        
        if (field.type === 'number' && rawValue) {
          value = normalizeValue(rawValue, field);
          
          // Set appropriate max values and thresholds based on field type
          switch (field.key) {
            case 'revenue':
              maxValue = 50000;
              threshold = 10000;
              break;
            case 'demand':
              maxValue = 10000;
              threshold = 1000;
              break;
            case 'competition':
              maxValue = 100;
              threshold = 70;
              break;
            case 'barriers':
              maxValue = 100;
              threshold = 60;
              break;
            case 'seasonality':
              maxValue = 100;
              threshold = 50;
              break;
            case 'profitability':
              maxValue = 60;
              threshold = 25;
              break;
          }
        }
        
        return {
          id: field.key,
          name: field.name,
          weight: field.required ? 25 : 10, // Default weights
          value: Math.min(value, maxValue),
          maxValue,
          threshold,
          description: field.description
        };
      });

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

      // Get product name from mapping or use provided name
      const nameColumn = fieldMappings['product_name'];
      const nameIndex = nameColumn ? parsedData.headers.indexOf(nameColumn) : -1;
      const finalProductName = nameIndex >= 0 ? mappedRow[nameIndex] : productName || 'Imported Product';

      // Save opportunity to database
      const { data: opportunity, error: opportunityError } = await supabase
        .from('opportunities')
        .insert({
          user_id: user.id,
          product_name: finalProductName,
          source: selectedSource,
          criteria: criteria,
          final_score: finalScore,
          status: 'draft'
        })
        .select()
        .single();

      if (opportunityError) throw opportunityError;

      // Save raw import for audit trail
      const { error: importError } = await supabase
        .from('raw_imports')
        .insert({
          opportunity_id: opportunity.id,
          user_id: user.id,
          source: selectedSource,
          raw_data: {
            headers: parsedData.headers,
            rows: parsedData.rows,
            file_name: csvFile?.name || 'pasted_data'
          },
          field_mappings: fieldMappings,
          import_metadata: {
            delimiter: parsedData.delimiter,
            upload_method: uploadMethod,
            processed_at: new Date().toISOString()
          }
        });

      if (importError) throw importError;

      // Prefill scoring page
      sessionStorage.setItem('prefilledScoringData', JSON.stringify({
        productName: finalProductName,
        ...criteria.reduce((acc, c) => ({ ...acc, [c.id]: c.value }), {})
      }));

      toast({
        title: "Import Successful",
        description: `${finalProductName} has been imported and saved.`
      });

      // Navigate to scoring page
      navigate('/score');
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "There was an error processing your import. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stepProgress = (currentStep / 3) * 100;

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Data Import Wizard</h1>
            <p className="text-muted-foreground">
              Import your research data from external tools in 3 simple steps
            </p>
            <div className="space-y-2">
              <Progress value={stepProgress} className="w-full max-w-md mx-auto" />
              <div className="flex justify-center space-x-8 text-sm">
                <span className={currentStep >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
                  1. Source
                </span>
                <span className={currentStep >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
                  2. Upload
                </span>
                <span className={currentStep >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>
                  3. Map Fields
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Source Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span>Step 1: Select Data Source</span>
                </CardTitle>
                <CardDescription>
                  Choose the research tool you're importing data from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {sourceOptions.map((source) => (
                    <div key={source.id} className="space-y-3">
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedSource === source.id ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedSource(source.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{source.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{source.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {source.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Supports:</p>
                            <div className="flex flex-wrap gap-1">
                              {source.features.map((feature) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* CSV Template Help */}
                      <Collapsible 
                        open={expandedHelp === source.id} 
                        onOpenChange={() => setExpandedHelp(expandedHelp === source.id ? '' : source.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-between text-xs h-8"
                          >
                            <span className="flex items-center space-x-1">
                              <Info className="w-3 h-3" />
                              <span>CSV Template & Mapping Guide</span>
                            </span>
                            {expandedHelp === source.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                          <Card className="bg-muted/30">
                            <CardContent className="p-4 space-y-4">
                              {/* Sample Headers */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium">Expected CSV Headers</h5>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => copyToClipboard(source.csvTemplate.sampleHeaders.join(','))}
                                    className="h-6 text-xs"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {source.csvTemplate.sampleHeaders.map((header) => (
                                    <Badge key={header} variant="outline" className="text-xs">
                                      {header}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <Separator />

                              {/* Common Mappings */}
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium">Typical Field Mappings</h5>
                                <div className="space-y-2">
                                  {source.csvTemplate.commonMappings.map((mapping, index) => (
                                    <div key={index} className="flex items-start space-x-2 text-xs">
                                      <Badge variant="secondary" className="text-xs min-w-fit">
                                        {mapping.header}
                                      </Badge>
                                      <ArrowRight className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <div className="space-y-1">
                                        <span className="font-medium text-primary">{mapping.mapsTo}</span>
                                        <p className="text-muted-foreground">{mapping.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <Separator />

                              {/* Pro Tips */}
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium flex items-center space-x-1">
                                  <span>💡</span>
                                  <span>Pro Tips</span>
                                </h5>
                                <div className="space-y-1">
                                  {source.csvTemplate.notes.map((note, index) => (
                                    <p key={index} className="text-xs text-muted-foreground">
                                      • {note}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedSource}
                    className="min-w-32"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Upload or Paste */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-primary" />
                  <span>Step 2: Upload Your Data</span>
                </CardTitle>
                <CardDescription>
                  Upload a CSV file or paste your data directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Method Selection */}
                <div className="flex space-x-4">
                  <Button
                    variant={uploadMethod === 'csv' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('csv')}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    CSV Upload
                  </Button>
                  <Button
                    variant={uploadMethod === 'paste' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('paste')}
                    className="flex-1"
                  >
                    <Clipboard className="w-4 h-4 mr-2" />
                    Paste Data
                  </Button>
                </div>

                {/* CSV Upload */}
                {uploadMethod === 'csv' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        aria-label="Upload CSV file"
                      />
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-sm font-medium">Drop your CSV file here or click to browse</p>
                          <p className="text-xs text-muted-foreground">Supports .csv files up to 10MB</p>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Choose File
                        </Button>
                      </div>
                    </div>
                    {csvFile && (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{csvFile.name}</span>
                        <Badge variant="secondary">{(csvFile.size / 1024).toFixed(1)} KB</Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Paste Data */}
                {uploadMethod === 'paste' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paste-data">Paste your table data</Label>
                      <Textarea
                        id="paste-data"
                        placeholder="Paste CSV data or table from spreadsheet..."
                        value={pastedData}
                        onChange={(e) => setPastedData(e.target.value)}
                        rows={8}
                        className="mt-2"
                        aria-describedby="paste-data-description"
                      />
                      <p id="paste-data-description" className="text-xs text-muted-foreground mt-1">
                        Supports comma, semicolon, tab, or pipe delimited data
                      </p>
                    </div>
                    <Button onClick={handlePasteData} disabled={!pastedData.trim()}>
                      Parse Data
                    </Button>
                  </div>
                )}

                {/* Data Preview */}
                {parsedData && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>Data Preview</span>
                        </h4>
                        <div className="flex space-x-2">
                          <Badge variant="outline">
                            Delimiter: "{parsedData.delimiter}"
                          </Badge>
                          <Badge variant="outline">
                            {parsedData.headers.length} columns
                          </Badge>
                          <Badge variant="outline">
                            {parsedData.rows.length} rows
                          </Badge>
                        </div>
                      </div>
                      <div className="border rounded-lg overflow-auto max-h-64">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              {parsedData.headers.map((header, index) => (
                                <th key={index} className="text-left p-2 font-medium">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedData.rows.slice(0, 5).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="p-2">
                                    {cell || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parsedData.rows.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Showing first 5 rows of {parsedData.rows.length} total rows
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    disabled={!parsedData}
                    className="min-w-32"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Map Fields */}
          {currentStep === 3 && parsedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  <span>Step 3: Map Your Fields</span>
                </CardTitle>
                <CardDescription>
                  Connect your CSV columns to our app fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="product-name-input">Product Name (if not in CSV)</Label>
                  <Input
                    id="product-name-input"
                    placeholder="Enter product name..."
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    aria-describedby="product-name-help"
                  />
                  <p id="product-name-help" className="text-xs text-muted-foreground">
                    Leave blank if product name is in your CSV data
                  </p>
                </div>

                <Separator />

                {/* Field Mappings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Field Mappings</h4>
                  <div className="grid gap-4">
                    {appFields.map((field) => (
                      <div 
                        key={field.key} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{field.name}</span>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            {field.unit && (
                              <Badge variant="outline" className="text-xs">{field.unit}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{field.description}</p>
                        </div>
                        <div className="w-48">
                          <Select 
                            value={fieldMappings[field.key] || ''} 
                            onValueChange={(value) => handleFieldMapping(field.key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No mapping</SelectItem>
                              {parsedData.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation */}
                <div className="space-y-2">
                  <h4 className="font-medium">Validation</h4>
                  <div className="space-y-2">
                    {appFields.filter(f => f.required).map((field) => {
                      const isMapped = fieldMappings[field.key];
                      return (
                        <div key={field.key} className="flex items-center space-x-2">
                          {isMapped ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="text-sm">
                            {field.name} {isMapped ? 'mapped' : 'not mapped'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={
                      isProcessing || 
                      !appFields.filter(f => f.required).every(f => fieldMappings[f.key])
                    }
                    className="min-w-32"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        Import & Score
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
};

export default DataImportWizard;