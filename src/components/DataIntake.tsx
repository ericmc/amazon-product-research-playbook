import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductData {
  productName: string;
  revenue: number;
  competition: number;
  demand: number;
  barriers: number;
  seasonality: number;
  profitability: number;
}

interface FieldMapping {
  [key: string]: keyof ProductData | 'skip';
}

interface ValidationError {
  field: string;
  message: string;
}

const DataIntake = () => {
  const navigate = useNavigate();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping>({});
  const [manualData, setManualData] = useState<ProductData>({
    productName: "",
    revenue: 0,
    competition: 0,
    demand: 0,
    barriers: 0,
    seasonality: 0,
    profitability: 0
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const scoringFields = [
    { key: 'productName', label: 'Product Name', type: 'text' },
    { key: 'revenue', label: 'Monthly Revenue Potential ($)', type: 'number', max: 50000 },
    { key: 'competition', label: 'Competition Level (0-100)', type: 'number', max: 100 },
    { key: 'demand', label: 'Market Demand (searches/month)', type: 'number', max: 10000 },
    { key: 'barriers', label: 'Entry Barriers (0-100)', type: 'number', max: 100 },
    { key: 'seasonality', label: 'Seasonality Risk (0-100)', type: 'number', max: 100 },
    { key: 'profitability', label: 'Profit Margins (%)', type: 'number', max: 60 }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => 
        row.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );
      setCsvData(rows.filter(row => row.some(cell => cell.length > 0)));
    };
    reader.readAsText(file);
  };

  const handleFieldMapping = (csvColumn: string, targetField: keyof ProductData | 'skip') => {
    setFieldMappings(prev => ({
      ...prev,
      [csvColumn]: targetField
    }));
  };

  const validateData = (data: ProductData): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!data.productName.trim()) {
      errors.push({ field: 'productName', message: 'Product name is required' });
    }

    if (data.revenue < 0 || data.revenue > 50000) {
      errors.push({ field: 'revenue', message: 'Revenue must be between 0 and 50,000' });
    }

    if (data.competition < 0 || data.competition > 100) {
      errors.push({ field: 'competition', message: 'Competition must be between 0 and 100' });
    }

    if (data.demand < 0 || data.demand > 10000) {
      errors.push({ field: 'demand', message: 'Demand must be between 0 and 10,000' });
    }

    if (data.barriers < 0 || data.barriers > 100) {
      errors.push({ field: 'barriers', message: 'Barriers must be between 0 and 100' });
    }

    if (data.seasonality < 0 || data.seasonality > 100) {
      errors.push({ field: 'seasonality', message: 'Seasonality must be between 0 and 100' });
    }

    if (data.profitability < 0 || data.profitability > 60) {
      errors.push({ field: 'profitability', message: 'Profitability must be between 0 and 60' });
    }

    return errors;
  };

  const normalizeValue = (value: string | number, field: keyof ProductData): number => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    // Normalize based on field type
    switch (field) {
      case 'revenue':
        return Math.max(0, Math.min(50000, num));
      case 'competition':
      case 'barriers':
      case 'seasonality':
        return Math.max(0, Math.min(100, num));
      case 'demand':
        return Math.max(0, Math.min(10000, num));
      case 'profitability':
        return Math.max(0, Math.min(60, num));
      default:
        return num;
    }
  };

  const processCSVData = (): ProductData | null => {
    if (csvData.length < 2) return null;

    const headers = csvData[0];
    const dataRow = csvData[1]; // Take first data row

    const processedData: ProductData = {
      productName: "",
      revenue: 0,
      competition: 0,
      demand: 0,
      barriers: 0,
      seasonality: 0,
      profitability: 0
    };

    headers.forEach((header, index) => {
      const mapping = fieldMappings[header];
      if (mapping && mapping !== 'skip' && dataRow[index]) {
        if (mapping === 'productName') {
          processedData[mapping] = dataRow[index];
        } else {
          processedData[mapping] = normalizeValue(dataRow[index], mapping);
        }
      }
    });

    return processedData;
  };

  const handleSubmitManual = () => {
    const errors = validateData(manualData);
    setValidationErrors(errors);

    if (errors.length === 0) {
      // Store data and navigate to scoring system
      sessionStorage.setItem('prefilledScoringData', JSON.stringify(manualData));
      navigate('/validation');
    }
  };

  const handleSubmitCSV = () => {
    const processedData = processCSVData();
    if (!processedData) {
      setValidationErrors([{ field: 'csv', message: 'Please upload a valid CSV file and map the fields' }]);
      return;
    }

    const errors = validateData(processedData);
    setValidationErrors(errors);

    if (errors.length === 0) {
      sessionStorage.setItem('prefilledScoringData', JSON.stringify(processedData));
      navigate('/validation');
    }
  };

  const getErrorForField = (field: string) => {
    return validationErrors.find(error => error.field === field);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Data Intake</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Import product data manually or upload CSV from Jungle Scout, Helium 10, or other research tools
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Data Entry</CardTitle>
              <CardDescription>
                Enter product research data manually for immediate analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoringFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={manualData[field.key as keyof ProductData]}
                    onChange={(e) => {
                      const value = field.type === 'number' ? 
                        normalizeValue(e.target.value, field.key as keyof ProductData) : 
                        e.target.value;
                      setManualData(prev => ({
                        ...prev,
                        [field.key]: value
                      }));
                    }}
                    max={field.max}
                    className={getErrorForField(field.key) ? "border-red-500" : ""}
                  />
                  {getErrorForField(field.key) && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getErrorForField(field.key)?.message}
                    </p>
                  )}
                </div>
              ))}

              <Button onClick={handleSubmitManual} className="w-full" size="lg">
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Scoring System
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>CSV Upload</span>
              </CardTitle>
              <CardDescription>
                Upload CSV exports from Jungle Scout, Helium 10, or similar tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mb-4"
                />
                {csvFile && (
                  <Badge variant="outline" className="mt-2">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {csvFile.name}
                  </Badge>
                )}
              </div>

              {csvData.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Map CSV Columns to Product Data</h4>
                  <div className="grid gap-4">
                    {csvData[0]?.map((header, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-1/3">
                          <Badge variant="outline">{header}</Badge>
                        </div>
                        <div className="flex-1">
                          <Select
                            value={fieldMappings[header] || 'skip'}
                            onValueChange={(value) => handleFieldMapping(header, value as keyof ProductData | 'skip')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select mapping" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">Skip this column</SelectItem>
                              {scoringFields.map((field) => (
                                <SelectItem key={field.key} value={field.key}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {csvData.length > 1 && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-foreground mb-2">Preview (First Row)</h5>
                      <div className="space-y-2 text-sm">
                        {csvData[0].map((header, index) => {
                          const mapping = fieldMappings[header];
                          const value = csvData[1]?.[index];
                          if (mapping && mapping !== 'skip' && value) {
                            return (
                              <div key={index} className="flex justify-between">
                                <span className="text-muted-foreground">{scoringFields.find(f => f.key === mapping)?.label}:</span>
                                <span className="font-medium">{value}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {getErrorForField('csv') && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getErrorForField('csv')?.message}
                    </p>
                  )}

                  <Button onClick={handleSubmitCSV} className="w-full" size="lg">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Process Data & Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataIntake;