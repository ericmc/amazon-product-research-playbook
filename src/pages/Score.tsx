import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, FileText, TrendingUp } from "lucide-react";
import ScoringSystem from "@/components/ScoringSystem";
import { AutoMappedProduct } from "@/lib/normalizeBlackBox";
import { ProductWithKeywords } from "@/lib/matchKeyword";

const Score = () => {
  const [importedProducts, setImportedProducts] = useState<(AutoMappedProduct | ProductWithKeywords)[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<AutoMappedProduct | ProductWithKeywords | null>(null);
  const [hasImportedData, setHasImportedData] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for imported data from the new DataIntakeV2 flow
    const storedProducts = localStorage.getItem('importedProducts');
    if (storedProducts) {
      try {
        const products = JSON.parse(storedProducts);
        setImportedProducts(products);
        setHasImportedData(true);
        
        // Auto-select first product for scoring
        if (products.length > 0) {
          setSelectedProduct(products[0]);
          prepareProductForScoring(products[0]);
        }
      } catch (error) {
        console.error('Error loading imported products:', error);
        toast({
          title: "Data Load Error",
          description: "Could not load imported product data.",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const prepareProductForScoring = (product: AutoMappedProduct | ProductWithKeywords) => {
    // Convert product data to scoring format
    const scoringData = {
      productName: product.productData.title || 'Unknown Product',
      source: 'import',
      revenue: product.productData.revenue || 0,
      demand: (product as ProductWithKeywords).searchVolume || product.productData.searchVolume || 0,
      competition: product.productData.competition === 'High' ? 80 : 
                   product.productData.competition === 'Medium' ? 50 : 20,
      price: product.productData.price || 0,
      reviewCount: product.productData.reviewCount || 0,
      rating: product.productData.rating || 0
    };

    // Store in sessionStorage for ScoringSystem component
    sessionStorage.setItem('prefilledScoringData', JSON.stringify(scoringData));
  };

  const handleProductSelect = (product: AutoMappedProduct | ProductWithKeywords) => {
    setSelectedProduct(product);
    prepareProductForScoring(product);
    
    // Force re-render of ScoringSystem by clearing and setting data
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleBackToImport = () => {
    navigate('/import');
  };

  // If no imported data, show empty state
  if (!hasImportedData) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToImport}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Import
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Product Scoring</h1>
              <p className="text-muted-foreground mt-2">Score and analyze your imported products</p>
            </div>
          </div>

          <Card className="text-center py-16">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products to Score</h3>
              <p className="text-muted-foreground mb-6">
                Import product data first to start scoring opportunities
              </p>
              <Button onClick={handleBackToImport}>
                <Plus className="h-4 w-4 mr-2" />
                Import Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToImport}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Import
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Scoring</h1>
            <p className="text-muted-foreground mt-2">
              Score and analyze your {importedProducts?.length || 0} imported products
            </p>
          </div>
        </div>

        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Select Product to Score
            </CardTitle>
            <CardDescription>
              Choose a product from your import to configure scoring criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {importedProducts?.map((product, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedProduct === product ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">
                      {product.productData.title || 'Unknown Product'}
                    </h4>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${product.productData.revenue?.toLocaleString() || 0}/mo</span>
                      <span>${product.productData.price || 0}</span>
                    </div>
                    {(product as ProductWithKeywords).primaryKeyword && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {(product as ProductWithKeywords).primaryKeyword}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scoring System */}
        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>
                Scoring Configuration: {selectedProduct.productData.title}
              </CardTitle>
              <CardDescription>
                Configure scoring criteria and weights for this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoringSystem />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Score;