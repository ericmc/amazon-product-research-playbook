import React, { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, TrendingUp, CheckCircle } from "lucide-react";
import { AutoMappedMagnet } from "@/lib/normalizeMagnet";

interface MagnetImporterProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  processedData: AutoMappedMagnet[] | null;
  importSummary: {count: number, source: string} | null;
}

export const MagnetImporter: React.FC<MagnetImporterProps> = ({
  onFileSelect,
  isProcessing,
  processedData,
  importSummary
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
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
        {!processedData ? (
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
                Drop your Magnet/Cerebro CSV here or click to browse
              </p>
              <Button variant="outline" disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Select File"}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Auto-maps: Keywords, Search Volume, Competition, CPC</p>
              <p>• Supports both Magnet and Cerebro exports</p>
              <p>• Can backfill Black Box data with keyword insights</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Import Complete</span>
            </div>
            
            {importSummary && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Keywords Processed</p>
                  <p className="text-2xl font-bold">{importSummary.count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Source Type</p>
                  <Badge variant="outline" className="capitalize">{importSummary.source}</Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};