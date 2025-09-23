import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Database, Upload, RefreshCw } from 'lucide-react';
import { FusedCriterion, updateCriterionWithSourceData } from '@/utils/dataFusion';

interface DataSourceInputProps {
  criteria: FusedCriterion[];
  onUpdateCriteria: (updatedCriteria: FusedCriterion[]) => void;
  productName: string;
}

interface SourceData {
  [key: string]: {
    revenue?: number;
    demand?: number;
    competition?: number;
    margin?: number;
    barriers?: number;
    seasonality?: number;
  };
}

export const DataSourceInput: React.FC<DataSourceInputProps> = ({ 
  criteria, 
  onUpdateCriteria, 
  productName 
}) => {
  const [sourceData, setSourceData] = useState<SourceData>({
    jungle_scout: {},
    helium_10: {},
    amazon_poe: {},
    validation: {}
  });

  const [activeTab, setActiveTab] = useState('jungle_scout');

  const handleSourceDataUpdate = (source: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSourceData(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        [field]: numValue
      }
    }));
  };

  const applySourceData = (source: string) => {
    const data = sourceData[source];
    if (!data) return;

    const updatedCriteria = criteria.map(criterion => {
      const sourceValue = data[criterion.id];
      if (sourceValue !== undefined) {
        return updateCriterionWithSourceData(
          criterion,
          source as any,
          sourceValue,
          0.8, // confidence
          `Manual input from ${source.replace('_', ' ')}`
        );
      }
      return criterion;
    });

    onUpdateCriteria(updatedCriteria);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'jungle_scout': return 'Jungle Scout';
      case 'helium_10': return 'Helium 10';
      case 'amazon_poe': return 'Amazon POE';
      case 'validation': return 'Manual Validation';
      default: return source;
    }
  };

  const getSourceDescription = (source: string) => {
    switch (source) {
      case 'jungle_scout': return 'Product database research and revenue estimates';
      case 'helium_10': return 'Keyword research and profitability analysis';
      case 'amazon_poe': return 'Amazon Product Opportunity Explorer data';
      case 'validation': return 'Your own market research and validation';
      default: return 'External data source';
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'revenue': return 'Monthly Revenue ($)';
      case 'demand': return 'Search Volume';
      case 'competition': return 'Competition Level (%)';
      case 'margin': return 'Profit Margin (%)';
      case 'barriers': return 'Entry Barriers (%)';
      case 'seasonality': return 'Seasonality Risk (%)';
      default: return field;
    }
  };

  const renderSourceForm = (source: string) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {['revenue', 'demand', 'competition', 'margin', 'barriers', 'seasonality'].map(field => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`${source}-${field}`} className="text-sm">
              {getFieldLabel(field)}
            </Label>
            <Input
              id={`${source}-${field}`}
              type="number"
              placeholder="Enter value..."
              value={sourceData[source]?.[field] || ''}
              onChange={(e) => handleSourceDataUpdate(source, field, e.target.value)}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={() => applySourceData(source)}
          disabled={Object.keys(sourceData[source] || {}).length === 0}
        >
          <Upload className="h-4 w-4 mr-2" />
          Apply {getSourceLabel(source)} Data
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Source Input
        </CardTitle>
        <CardDescription>
          Manually input data from external research tools for {productName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Input data from your research tools to improve scoring accuracy
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="jungle_scout" className="text-xs">
                Jungle Scout
              </TabsTrigger>
              <TabsTrigger value="helium_10" className="text-xs">
                Helium 10
              </TabsTrigger>
              <TabsTrigger value="amazon_poe" className="text-xs">
                Amazon POE
              </TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">
                Validation
              </TabsTrigger>
            </TabsList>

            {['jungle_scout', 'helium_10', 'amazon_poe', 'validation'].map(source => (
              <TabsContent key={source} value={source}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{getSourceLabel(source)}</CardTitle>
                    <CardDescription className="text-sm">
                      {getSourceDescription(source)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderSourceForm(source)}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};