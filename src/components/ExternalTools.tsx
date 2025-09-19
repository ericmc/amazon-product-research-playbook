import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Copy, Zap } from "lucide-react";
import { ExternalToolsService } from "@/utils/ExternalToolsService";
import { useToast } from "@/hooks/use-toast";

interface ExternalToolsProps {
  productName?: string;
  category?: string;
  context?: 'scoring' | 'import';
  className?: string;
}

export const ExternalTools: React.FC<ExternalToolsProps> = ({ 
  productName = '', 
  category = '', 
  context = 'scoring',
  className 
}) => {
  const { toast } = useToast();
  const tools = ExternalToolsService.getTools();

  const handleToolOpen = async (tool: any) => {
    try {
      await ExternalToolsService.openTool(tool, productName, category);
      
      if (!tool.supportsUrlParams) {
        toast({
          title: "Copied to Clipboard",
          description: `Search term copied! Paste it in ${tool.name}`,
          duration: 3000
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not open external tool",
        variant: "destructive"
      });
    }
  };

  const searchTerms = productName ? ExternalToolsService.generateSearchTerms(productName) : [];
  const primaryTerm = searchTerms[0] || category || 'product research';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-primary" />
          <span>Research Tools</span>
        </CardTitle>
        <CardDescription>
          Open external tools with your {context === 'scoring' ? 'product' : 'search'} context
        </CardDescription>
        {productName && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Search terms:</span>
            <div className="flex flex-wrap gap-1">
              {searchTerms.slice(0, 3).map((term, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {tools.map((tool, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{tool.icon}</span>
                <div>
                  <h4 className="text-sm font-medium">{tool.name}</h4>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!tool.supportsUrlParams && (
                  <Badge variant="secondary" className="text-xs">
                    <Copy className="w-3 h-3 mr-1" />
                    Clipboard
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToolOpen(tool)}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>How it works:</strong></p>
          <p>• Tools with URL support: Opens with pre-filled search term</p>
          <p>• Other tools: Copies search term to clipboard for you to paste</p>
          {primaryTerm && (
            <p>• Current search term: <code className="bg-muted px-1 rounded">{primaryTerm}</code></p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};