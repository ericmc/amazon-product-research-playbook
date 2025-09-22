import React, { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { AutoMappedProduct } from "@/lib/normalizeBlackBox";

interface BlackBoxImporterProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  processedData: AutoMappedProduct[] | null;
  importSummary: {count: number, revenueSource: string} | null;
}

export const BlackBoxImporter: React.FC<BlackBoxImporterProps> = ({
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
          <FileText className="h-5 w-5" />
          Helium 10 Black Box Import
        </CardTitle>
        <CardDescription>
          Upload your raw Black Box CSV export for automatic field mapping
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
                Drop your Black Box CSV here or click to browse
              </p>
              <Button variant="outline" disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Select File"}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Auto-maps: ASIN, Title, Brand, Price, Revenue, Reviews, Dimensions</p>
              <p>• Supports ASIN Revenue with Parent Level Revenue fallback</p>
              <p>• Handles ≥500 rows efficiently</p>
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
                  <p className="text-sm font-medium">Products Processed</p>
                  <p className="text-2xl font-bold">{importSummary.count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Revenue Source</p>
                  <Badge variant="outline">{importSummary.revenueSource}</Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};