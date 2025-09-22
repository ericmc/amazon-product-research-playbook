import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Search, ArrowRight } from "lucide-react";
import { ProductWithKeywords } from "@/lib/matchKeyword";
import { sanitizeSelectOptions, createSelectOption } from "@/utils/select";

interface KeywordReviewPanelProps {
  products: ProductWithKeywords[];
  onProductsUpdate: (products: ProductWithKeywords[]) => void;
  onContinue: () => void;
}

interface ProductOverride {
  productIndex: number;
  newKeyword: string;
  newSearchVolume: number;
  newCompetingProducts: number;
}

export const KeywordReviewPanel: React.FC<KeywordReviewPanelProps> = ({
  products,
  onProductsUpdate,
  onContinue
}) => {
  const [overrides, setOverrides] = useState<Map<number, ProductOverride>>(new Map());
  const [searchFilter, setSearchFilter] = useState("");
  const [showOnlyEnriched, setShowOnlyEnriched] = useState(false);

  // Create keyword options from all suggested keywords
  const keywordOptions = useMemo(() => {
    const allKeywords = new Set<string>();
    
    products.forEach(product => {
      if (product.primaryKeyword) {
        allKeywords.add(product.primaryKeyword);
      }
      product.suggestedKeywords?.forEach(suggestion => {
        allKeywords.add(suggestion.keyword);
      });
    });

    const options = Array.from(allKeywords).map(keyword => 
      createSelectOption(keyword, keyword)
    );
    
    return sanitizeSelectOptions(options);
  }, [products]);

  // Filter products based on search and enrichment status
  const filteredProducts = useMemo(() => {
    return products.filter((product, index) => {
      const matchesSearch = !searchFilter || 
        product.productData.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (product.primaryKeyword?.toLowerCase().includes(searchFilter.toLowerCase()));
      
      const matchesEnrichment = !showOnlyEnriched || product.primaryKeyword;
      
      return matchesSearch && matchesEnrichment;
    });
  }, [products, searchFilter, showOnlyEnriched]);

  const handleKeywordChange = (productIndex: number, newKeyword: string) => {
    const product = products[productIndex];
    const suggestion = product.suggestedKeywords?.find(s => s.keyword === newKeyword);
    
    const override: ProductOverride = {
      productIndex,
      newKeyword,
      newSearchVolume: suggestion?.searchVolume || 0,
      newCompetingProducts: suggestion?.competingProducts || 0
    };

    setOverrides(prev => new Map(prev.set(productIndex, override)));
  };

  const applyOverrides = () => {
    const updatedProducts = products.map((product, index) => {
      const override = overrides.get(index);
      if (override) {
        return {
          ...product,
          primaryKeyword: override.newKeyword,
          searchVolume: override.newSearchVolume,
          competingProducts: override.newCompetingProducts
        };
      }
      return product;
    });

    onProductsUpdate(updatedProducts);
    onContinue();
  };

  const enrichedCount = products.filter(p => p.primaryKeyword).length;
  const overrideCount = overrides.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5" />
          Review & Override Keywords
        </CardTitle>
        <CardDescription>
          Review auto-assigned keywords and make adjustments as needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Products Enhanced</p>
            <p className="text-2xl font-bold">{enrichedCount}/{products.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Manual Overrides</p>
            <p className="text-2xl font-bold">{overrideCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Available Keywords</p>
            <p className="text-2xl font-bold">{keywordOptions.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or keywords..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showOnlyEnriched ? "default" : "outline"}
            onClick={() => setShowOnlyEnriched(!showOnlyEnriched)}
            size="sm"
          >
            Enhanced Only
          </Button>
        </div>

        {/* Products List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredProducts.map((product, displayIndex) => {
            const productIndex = products.indexOf(product);
            const override = overrides.get(productIndex);
            const currentKeyword = override?.newKeyword || product.primaryKeyword;
            const currentVolume = override?.newSearchVolume || product.searchVolume || 0;
            const currentCompeting = override?.newCompetingProducts || product.competingProducts || 0;
            
            return (
              <div key={productIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{product.productData.title}</h4>
                    {!product.primaryKeyword && (
                      <Badge variant="outline" className="mt-1">No keyword assigned</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>Vol: {currentVolume.toLocaleString()}</span>
                    <span>Comp: {currentCompeting}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Primary Keyword</label>
                    <Select
                      value={currentKeyword || ""}
                      onValueChange={(value) => handleKeywordChange(productIndex, value)}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select keyword..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {keywordOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {product.suggestedKeywords && product.suggestedKeywords.length > 1 && (
                    <div>
                      <label className="text-sm font-medium">Alternative Suggestions</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.suggestedKeywords.slice(0, 3).map((suggestion, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => handleKeywordChange(productIndex, suggestion.keyword)}
                          >
                            {suggestion.keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No products match your current filters
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onContinue}>
            Skip Review
          </Button>
          <Button onClick={applyOverrides}>
            Apply Changes & Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};