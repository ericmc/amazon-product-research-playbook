import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, Play, FileText, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StoredImport {
  id: string;
  source: string;
  created_at: string;
  raw_data: any;
  field_mappings: any;
  import_metadata: any;
  opportunity_id?: string;
}

const StoredImportsPage = () => {
  const [imports, setImports] = useState<StoredImport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStoredImports();
  }, []);

  const fetchStoredImports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view stored imports.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('raw_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setImports(data || []);
    } catch (error) {
      console.error('Error fetching stored imports:', error);
      toast({
        title: "Error",
        description: "Failed to load stored imports.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRerunImport = async (importData: StoredImport) => {
    setIsRerunning(importData.id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to rerun imports.",
          variant: "destructive"
        });
        return;
      }

      // For now, we'll process the stored raw_data similar to the original import
      // This assumes the raw_data contains the processed products
      const rawData = importData.raw_data;
      
      if (!rawData || !Array.isArray(rawData)) {
        toast({
          title: "Invalid Data",
          description: "This import cannot be rerun due to invalid data format.",
          variant: "destructive"
        });
        return;
      }

      // Process each row as a new opportunity
      let successCount = 0;
      for (const row of rawData) {
        const criteria = [
          {
            id: 'product_name',
            name: 'Product Name',
            weight: 0,
            value: 0,
            maxValue: 1,
            threshold: 1,
            description: row.title || row.product_name || 'Rerun Import'
          },
          {
            id: 'revenue',
            name: 'Revenue',
            weight: 25,
            value: Math.min(row.revenue || 0, 50000),
            maxValue: 50000,
            threshold: 10000,
            description: 'Monthly revenue estimate'
          },
          {
            id: 'demand',
            name: 'Demand',
            weight: 25,
            value: Math.min(row.searchVolume || row.search_volume || 0, 10000),
            maxValue: 10000,
            threshold: 1000,
            description: 'Monthly search volume'
          },
          {
            id: 'competition',
            name: 'Competition',
            weight: 25,
            value: row.competition || 50,
            maxValue: 100,
            threshold: 70,
            description: 'Competition level'
          },
          {
            id: 'barriers',
            name: 'Barriers',
            weight: 10,
            value: 50,
            maxValue: 100,
            threshold: 60,
            description: 'Market entry barriers'
          },
          {
            id: 'seasonality',
            name: 'Seasonality',
            weight: 10,
            value: 30,
            maxValue: 100,
            threshold: 50,
            description: 'Seasonality risk'
          },
          {
            id: 'profitability',
            name: 'Profitability',
            weight: 5,
            value: 30,
            maxValue: 60,
            threshold: 25,
            description: 'Profit margin estimate'
          }
        ];

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

        await supabase
          .from('opportunities')
          .insert({
            user_id: user.id,
            product_name: row.title || row.product_name || `Rerun - ${new Date().toLocaleDateString()}`,
            source: `${importData.source}_rerun`,
            criteria: criteria,
            final_score: finalScore,
            status: 'draft',
            notes: `Rerun from stored import on ${new Date().toLocaleDateString()}`
          });

        successCount++;
      }

      toast({
        title: "Import Rerun Complete",
        description: `Successfully created ${successCount} new opportunities from stored import.`
      });
      
      navigate('/opportunities');
      
    } catch (error) {
      console.error('Error rerunning import:', error);
      toast({
        title: "Rerun Failed",
        description: "There was an error rerunning the import. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRerunning(null);
    }
  };

  const getImportTypeLabel = (source: string) => {
    switch (source) {
      case 'helium_10_blackbox':
        return 'Black Box';
      case 'helium_10_magnet':
        return 'Magnet';
      case 'helium_10_cerebro':
        return 'Cerebro';
      case 'helium_10_combined':
        return 'Combined';
      default:
        return source;
    }
  };

  const getImportTypeColor = (source: string) => {
    switch (source) {
      case 'helium_10_blackbox':
        return 'bg-blue-100 text-blue-800';
      case 'helium_10_magnet':
        return 'bg-green-100 text-green-800';
      case 'helium_10_cerebro':
        return 'bg-purple-100 text-purple-800';
      case 'helium_10_combined':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading stored imports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Stored Imports</h1>
        <p className="text-muted-foreground">
          View and rerun your previously imported data files
        </p>
      </div>

      {imports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Stored Imports</h3>
            <p className="text-muted-foreground mb-4">
              You haven't imported any files yet. Import data to see it listed here.
            </p>
            <Button onClick={() => navigate('/import')}>
              Import Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>
              {imports.length} import{imports.length !== 1 ? 's' : ''} (newest first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Import Date</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Enhanced</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((importItem) => (
                  <TableRow key={importItem.id}>
                    <TableCell>
                      <Badge className={getImportTypeColor(importItem.source)}>
                        {getImportTypeLabel(importItem.source)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDistanceToNow(new Date(importItem.created_at), { addSuffix: true })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {Array.isArray(importItem.raw_data) ? importItem.raw_data.length : 'N/A'} records
                    </TableCell>
                    <TableCell>
                      {importItem.import_metadata?.magnetEnhanced ? 
                        <Badge variant="secondary">Enhanced</Badge> : 
                        <span className="text-muted-foreground">No</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleRerunImport(importItem)}
                        disabled={isRerunning === importItem.id}
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        {isRerunning === importItem.id ? 'Rerunning...' : 'Rerun'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoredImportsPage;