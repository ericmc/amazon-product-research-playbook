import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Database, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Import = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    
    // Simulate file upload
    setTimeout(() => {
      const newFiles = Array.from(files).map(file => file.name);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);
      
      toast({
        title: "Files uploaded successfully",
        description: `${newFiles.length} file(s) have been imported`,
      });
    }, 1500);
  };

  const importSources = [
    {
      title: "CSV Data Import",
      description: "Upload product research data from spreadsheets",
      icon: FileText,
      accept: ".csv,.xlsx,.xls"
    },
    {
      title: "Amazon API",
      description: "Connect directly to Amazon's Product Advertising API",
      icon: Database,
      setup: true
    },
    {
      title: "Bulk Upload",
      description: "Import multiple data files at once",
      icon: Upload,
      accept: ".csv,.json,.xlsx"
    }
  ];

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Import Data</h1>
          <p className="text-muted-foreground mt-2">Import product research data from various sources</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {importSources.map((source, index) => {
            const IconComponent = source.icon;
            return (
              <Card key={index} className="bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{source.title}</CardTitle>
                  <CardDescription>{source.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {source.setup ? (
                    <Button variant="outline" className="w-full">
                      Setup Connection
                    </Button>
                  ) : (
                    <div>
                      <Input
                        type="file"
                        multiple
                        accept={source.accept}
                        onChange={handleFileUpload}
                        className="hidden"
                        id={`upload-${index}`}
                        disabled={isUploading}
                      />
                      <Label htmlFor={`upload-${index}`}>
                        <Button variant="outline" className="w-full cursor-pointer" disabled={isUploading}>
                          {isUploading ? "Uploading..." : "Choose Files"}
                        </Button>
                      </Label>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {uploadedFiles.length > 0 && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>Successfully imported data files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadedFiles.map((filename, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-success/10 rounded-md">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">{filename}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Manual Data Entry</CardTitle>
            <CardDescription>Enter product research data manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input id="product-name" placeholder="Enter product name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="home-garden">Home & Garden</SelectItem>
                    <SelectItem value="sports">Sports & Outdoors</SelectItem>
                    <SelectItem value="health">Health & Personal Care</SelectItem>
                    <SelectItem value="clothing">Clothing & Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price Range</Label>
                <Input id="price" placeholder="$0 - $100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-searches">Monthly Searches</Label>
                <Input id="monthly-searches" placeholder="e.g., 10,000" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competition">Competition Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter product description and research notes"
                rows={3}
              />
            </div>

            <Button className="w-full">
              Add Product Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Import;