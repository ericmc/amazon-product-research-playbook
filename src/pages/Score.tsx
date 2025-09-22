import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, FileText, TrendingUp, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import ScoringSystem from "@/components/ScoringSystem";
import { ScoringPreview } from "@/components/ScoringPreview";
import { AutoMappedProduct } from "@/lib/normalizeBlackBox";
import { ProductWithKeywords } from "@/lib/matchKeyword";

type SortField = 'title' | 'revenue' | 'price' | 'searchVolume' | 'reviewCount' | 'rating';
type SortDirection = 'asc' | 'desc';

interface ScoringData {
  productName: string;
  source: string;
  revenue: number;
  demand: number;
  competition: number;
  price: number;
  reviewCount: number;
  rating: number;
}

const Score = () => {
  const [importedProducts, setImportedProducts] = useState<(AutoMappedProduct | ProductWithKeywords)[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<AutoMappedProduct | ProductWithKeywords | null>(null);
  const [scoringData, setScoringData] = useState<ScoringData | null>(null);
  const [hasImportedData, setHasImportedData] = useState(false);
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("all");
  const [keywordFilter, setKeywordFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
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

  const prepareProductForScoring = (product: AutoMappedProduct | ProductWithKeywords): ScoringData => {
    // Convert product data to scoring format with better mapping
    const revenue = product.productData.revenue || 0;
    const searchVolume = (product as ProductWithKeywords).searchVolume || product.productData.searchVolume || 0;
    const price = product.productData.price || 0;
    const reviewCount = product.productData.reviewCount || 0;
    const rating = product.productData.rating || 0;
    
    // Map competition text to numeric scale (0-100)
    let competitionScore = 50; // default medium
    const competitionText = product.productData.competition?.toLowerCase() || '';
    if (competitionText.includes('low')) competitionScore = 20;
    else if (competitionText.includes('high')) competitionScore = 80;
    else if (competitionText.includes('medium')) competitionScore = 50;
    
    const scoringData: ScoringData = {
      productName: product.productData.title || 'Unknown Product',
      source: 'import',
      revenue,
      demand: searchVolume,
      competition: competitionScore,
      price,
      reviewCount,
      rating
    };

    return scoringData;
  };

  const handleProductSelect = (product: AutoMappedProduct | ProductWithKeywords) => {
    setSelectedProduct(product);
    const newScoringData = prepareProductForScoring(product);
    setScoringData(newScoringData);
    
    // Also store in sessionStorage for the ScoringSystem component
    sessionStorage.setItem('prefilledScoringData', JSON.stringify(newScoringData));
    
    toast({
      title: "Product Selected",
      description: `Now scoring: ${product.productData.title}`,
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!importedProducts) return [];

    let filtered = importedProducts.filter(product => {
      // Search filter
      if (searchQuery && !product.productData.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Revenue filter
      if (revenueFilter !== "all") {
        const revenue = product.productData.revenue || 0;
        switch (revenueFilter) {
          case "low": if (revenue >= 5000) return false; break;
          case "medium": if (revenue < 5000 || revenue >= 15000) return false; break;
          case "high": if (revenue < 15000) return false; break;
        }
      }

      // Keyword filter
      if (keywordFilter !== "all") {
        const hasKeyword = !!(product as ProductWithKeywords).primaryKeyword;
        if (keywordFilter === "with-keywords" && !hasKeyword) return false;
        if (keywordFilter === "without-keywords" && hasKeyword) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.productData.title || '';
          bValue = b.productData.title || '';
          break;
        case 'revenue':
          aValue = a.productData.revenue || 0;
          bValue = b.productData.revenue || 0;
          break;
        case 'price':
          aValue = a.productData.price || 0;
          bValue = b.productData.price || 0;
          break;
        case 'searchVolume':
          aValue = (a as ProductWithKeywords).searchVolume || a.productData.searchVolume || 0;
          bValue = (b as ProductWithKeywords).searchVolume || b.productData.searchVolume || 0;
          break;
        case 'reviewCount':
          aValue = a.productData.reviewCount || 0;
          bValue = b.productData.reviewCount || 0;
          break;
        case 'rating':
          aValue = a.productData.rating || 0;
          bValue = b.productData.rating || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [importedProducts, searchQuery, revenueFilter, keywordFilter, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
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
              Choose from your {importedProducts?.length || 0} imported products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Revenue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Revenue</SelectItem>
                  <SelectItem value="low">Under $5K</SelectItem>
                  <SelectItem value="medium">$5K - $15K</SelectItem>
                  <SelectItem value="high">$15K+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={keywordFilter} onValueChange={setKeywordFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Keywords" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="with-keywords">With Keywords</SelectItem>
                  <SelectItem value="without-keywords">Without Keywords</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="outline" className="flex items-center gap-1 px-3 py-2">
                <Filter className="h-3 w-3" />
                {filteredAndSortedProducts.length} shown
              </Badge>
            </div>

            {/* Product Table */}
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-12">Image</TableHead>
                    <TableHead className="min-w-64">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('title')}
                        className="h-auto p-0 font-medium"
                      >
                        Product Title {getSortIcon('title')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('revenue')}
                        className="h-auto p-0 font-medium"
                      >
                        Revenue {getSortIcon('revenue')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('price')}
                        className="h-auto p-0 font-medium"
                      >
                        Price {getSortIcon('price')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('searchVolume')}
                        className="h-auto p-0 font-medium"
                      >
                        Search Vol {getSortIcon('searchVolume')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('reviewCount')}
                        className="h-auto p-0 font-medium"
                      >
                        Reviews {getSortIcon('reviewCount')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('rating')}
                        className="h-auto p-0 font-medium"
                      >
                        Rating {getSortIcon('rating')}
                      </Button>
                    </TableHead>
                    <TableHead>Keywords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.map((product, index) => {
                    const isSelected = selectedProduct === product;
                    const imageUrl = (product.rawData?.['Image URL'] || product.rawData?.['image url'] || '').trim();
                    
                    return (
                      <TableRow 
                        key={index}
                        className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <TableCell>
                          <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt="Product"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="max-w-sm truncate" title={product.productData.title}>
                            {product.productData.title || 'Unknown Product'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${(product.productData.revenue || 0).toLocaleString()}/mo
                        </TableCell>
                        <TableCell className="text-right">
                          ${(product.productData.price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {((product as ProductWithKeywords).searchVolume || product.productData.searchVolume || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {(product.productData.reviewCount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.productData.rating ? `${product.productData.rating}★` : '-'}
                        </TableCell>
                        <TableCell>
                          {(product as ProductWithKeywords).primaryKeyword ? (
                            <Badge variant="secondary" className="text-xs">
                              {(product as ProductWithKeywords).primaryKeyword}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">No keyword</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredAndSortedProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products match your current filters
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scoring Preview - Always show when we have data */}
        {scoringData && (
          <ScoringPreview 
            scoringData={scoringData} 
            onRefresh={() => {
              if (selectedProduct) {
                const refreshedData = prepareProductForScoring(selectedProduct);
                setScoringData(refreshedData);
                sessionStorage.setItem('prefilledScoringData', JSON.stringify(refreshedData));
              }
            }}
          />
        )}

        {/* Advanced Scoring System - Only show when product is selected */}
        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>
                Advanced Scoring Configuration
              </CardTitle>
              <CardDescription>
                Fine-tune scoring criteria and weights for detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoringSystem key={selectedProduct.productData.title} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Score;