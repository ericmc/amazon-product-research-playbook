import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, FileText, TrendingUp, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import ScoringSystem from "@/components/ScoringSystem";
import { ScoringPreview } from "@/components/ScoringPreview";
import { AutoMappedProduct } from "@/lib/normalizeBlackBox";
import { ProductWithKeywords } from "@/lib/matchKeyword";
import { computeFinalScore, calculateH10Score } from "@/utils/scoringUtils";

type SortField = 'title' | 'revenue' | 'price' | 'searchVolume' | 'reviewCount' | 'rating' | 'score' | 'brand' | 'bsr' | 'category' | 'salesTrend' | 'seller' | 'subcategory' | 'priceTrend' | 'sellerCountry' | 'activeSellers' | 'lastYearSales';
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
  
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoverImageUrl, setHoverImageUrl] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // About 20 rows will fit in the taller table
  
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

    // Seed Advanced Scoring with the same Opportunity Score used above
    const savedThresholds = localStorage.getItem('scoringThresholds');
    const thresholds = savedThresholds ? JSON.parse(savedThresholds) : {
      revenue: 60,
      momentum: 60,
      competition: 60,
      barriers: 50,
      logistics: 60,
      lifecycle: 50
    };
    const h10Criteria = calculateH10Score((product as any).productData || product, thresholds);
    const initialScore = computeFinalScore(h10Criteria);
    sessionStorage.setItem('initialOpportunityScore', String(initialScore));
    
    toast({
      title: "Product Selected",
      description: `Now scoring: ${product.productData.title}`,
    });
  };

  const calculateProductScore = (product: AutoMappedProduct | ProductWithKeywords): number => {
    // Load current thresholds from localStorage or use defaults
    const savedThresholds = localStorage.getItem('scoringThresholds');
    const thresholds = savedThresholds ? JSON.parse(savedThresholds) : {
      revenue: 60,
      momentum: 60,
      competition: 60,
      barriers: 50,
      logistics: 60,
      lifecycle: 50
    };
    
    const criteria = calculateH10Score(product.productData, thresholds);
    return computeFinalScore(criteria);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
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
        case 'score':
          aValue = calculateProductScore(a);
          bValue = calculateProductScore(b);
          break;
        case 'brand':
          aValue = a.rawData?.['Brand'] || a.productData.brand || '';
          bValue = b.rawData?.['Brand'] || b.productData.brand || '';
          break;
        case 'bsr':
          aValue = parseFloat(a.rawData?.['BSR'] || '0') || 0;
          bValue = parseFloat(b.rawData?.['BSR'] || '0') || 0;
          break;
        case 'category':
          aValue = a.rawData?.['Category'] || '';
          bValue = b.rawData?.['Category'] || '';
          break;
        case 'salesTrend':
          aValue = parseFloat(a.rawData?.['Sales Trend (90 days) (%)'] || '0') || 0;
          bValue = parseFloat(b.rawData?.['Sales Trend (90 days) (%)'] || '0') || 0;
          break;
        case 'seller':
          aValue = a.rawData?.['Seller'] || '';
          bValue = b.rawData?.['Seller'] || '';
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
  }, [importedProducts, searchQuery, revenueFilter, sortField, sortDirection]);

  // Paginate the filtered and sorted products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, revenueFilter, sortField, sortDirection]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length);


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


              <Badge variant="outline" className="flex items-center gap-1 px-3 py-2">
                <Filter className="h-3 w-3" />
                {filteredAndSortedProducts.length} total
              </Badge>
            </div>

            {/* Pagination info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <div>
                Showing {startItem}-{endItem} of {filteredAndSortedProducts.length} products
              </div>
              <div>
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {/* Table wrapper - 30% taller */}
            <div className="space-y-4">
              <div className="relative rounded-md border bg-background overflow-hidden">
                <div className="overflow-auto max-h-[624px]" id="products-table-viewport">
                   <Table className="min-w-[1200px] border-spacing-0">
                  <TableHeader className="sticky top-0 z-50 bg-background border-b shadow-sm">
                    <TableRow className="border-none">
                      <TableHead className="sticky left-0 z-50 bg-background w-10 p-0 border-r text-xs h-12 flex items-center justify-center">Image</TableHead>
                       <TableHead className="w-32 bg-background sticky left-10 z-50 p-1 border-r h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('title')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Product Title</span> {getSortIcon('title')}
                         </Button>
                       </TableHead>
                      <TableHead className="text-center bg-background w-8 p-1 h-12">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('score')}
                          className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                        >
                          <span className="line-clamp-2 text-center">Viability Score</span> {getSortIcon('score')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right bg-background w-24 p-1 h-12">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('revenue')}
                          className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                        >
                          <span className="line-clamp-2 text-center">Revenue /mo</span> {getSortIcon('revenue')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right bg-background w-16 p-1 h-12">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('price')}
                          className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                        >
                          <span className="line-clamp-2 text-center">Price</span> {getSortIcon('price')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right bg-background w-16 p-1 h-12">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('reviewCount')}
                          className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                        >
                          <span className="line-clamp-2 text-center">Review Count</span> {getSortIcon('reviewCount')}
                        </Button>
                      </TableHead>
                       <TableHead className="text-right bg-background w-14 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('rating')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Rating</span> {getSortIcon('rating')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-left bg-background w-20 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('brand')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Brand</span> {getSortIcon('brand')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-right bg-background w-16 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('bsr')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">BSR</span> {getSortIcon('bsr')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-left bg-background w-24 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('category')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Category</span> {getSortIcon('category')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-right bg-background w-16 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('salesTrend')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Sales Trend %</span> {getSortIcon('salesTrend')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-left bg-background w-20 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('seller')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Seller</span> {getSortIcon('seller')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-left bg-background w-24 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('subcategory')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Subcategory</span> {getSortIcon('subcategory')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-right bg-background w-20 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('priceTrend')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Price Trend (90 days)</span> {getSortIcon('priceTrend')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-left bg-background w-20 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('sellerCountry')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Seller Country</span> {getSortIcon('sellerCountry')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-right bg-background w-16 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('activeSellers')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center"># of Active Sellers</span> {getSortIcon('activeSellers')}
                         </Button>
                       </TableHead>
                       <TableHead className="text-right bg-background w-20 p-1 h-12">
                         <Button 
                           variant="ghost" 
                           onClick={() => handleSort('lastYearSales')}
                           className="h-auto p-0 font-medium text-[10px] hover:bg-transparent leading-tight w-full"
                         >
                           <span className="line-clamp-2 text-center">Last Year Sales</span> {getSortIcon('lastYearSales')}
                         </Button>
                       </TableHead>
                     </TableRow>
                  </TableHeader>
                 <TableBody>
                   {paginatedProducts.map((product, index) => {
                      const isSelected = selectedProduct === product;
                      const imageUrl = (product.rawData?.['Image URL'] || product.rawData?.['image url'] || '').trim();
                      const viabilityScore = calculateProductScore(product);
                      
                      return (
                        <TableRow 
                          key={index}
                          className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                          onClick={() => handleProductSelect(product)}
                        >
                          <TableCell className="sticky left-0 z-40 bg-background w-10 p-0 border-r">
                            <div className="relative group" onMouseEnter={() => setHoverImageUrl(imageUrl)} onMouseLeave={() => setHoverImageUrl(null)}>
                              <div className="w-9 h-9 m-0.5 rounded border bg-muted flex items-center justify-center overflow-hidden cursor-pointer">
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt="Product image"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder.svg';
                                    }}
                                  />
                                ) : (
                                  <FileText className="h-2 w-2 text-muted-foreground" />
                                )}
                              </div>
                              {/* Preview rendered via portal */}
                            </div>
                          </TableCell>
                           <TableCell className="sticky left-10 z-40 bg-background w-32 p-1 border-r">
                             <div className="flex items-center gap-1">
                                <div className="text-[10px] font-medium leading-tight h-8 flex items-center flex-1" title={product.productData.title}>
                                  <span className="overflow-hidden text-ellipsis line-clamp-2 max-h-8">
                                    {product.productData.title || 'Unknown Product'}
                                  </span>
                                </div>
                               {product.productData.asin && (
                                 <a
                                   href={`https://www.amazon.com/dp/${product.productData.asin}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                   title="View on Amazon"
                                   onClick={(e) => e.stopPropagation()}
                                 >
                                   <ExternalLink className="h-3 w-3" />
                                 </a>
                               )}
                             </div>
                           </TableCell>
                          <TableCell className="text-center w-8 p-1">
                            <Badge className={`${getScoreBadge(viabilityScore)} text-[10px] px-1 py-0.5 rounded`}>
                              {viabilityScore}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right w-24 p-1 text-xs">
                            ${(product.productData.revenue || 0).toLocaleString()}/mo
                          </TableCell>
                          <TableCell className="text-right w-16 p-1 text-xs">
                            ${(product.productData.price || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right w-16 p-1 text-xs">
                            {(product.productData.reviewCount || 0).toLocaleString()}
                          </TableCell>
                           <TableCell className="text-right w-14 p-1 text-xs">
                             {product.productData.rating ? `${product.productData.rating.toFixed(1)}★` : '-'}
                           </TableCell>
                           <TableCell className="text-left w-20 p-1 text-xs">
                             {product.rawData?.['Brand'] || product.productData.brand || '-'}
                           </TableCell>
                           <TableCell className="text-right w-16 p-1 text-xs">
                             {product.rawData?.['BSR'] ? parseInt(product.rawData['BSR']).toLocaleString() : '-'}
                           </TableCell>
                           <TableCell className="text-left w-24 p-1 text-xs">
                             {product.rawData?.['Category'] || '-'}
                           </TableCell>
                           <TableCell className="text-right w-16 p-1 text-xs">
                             {product.rawData?.['Sales Trend (90 days) (%)'] ? `${parseFloat(product.rawData['Sales Trend (90 days) (%)']).toFixed(1)}%` : '-'}
                           </TableCell>
                           <TableCell className="text-left w-20 p-1 text-xs">
                             {product.rawData?.['Seller'] || '-'}
                           </TableCell>
                           <TableCell className="text-left w-24 p-1 text-xs">
                             {product.rawData?.['Subcategory'] || '-'}
                           </TableCell>
                           <TableCell className="text-right w-20 p-1 text-xs">
                             {product.rawData?.['Price Trend (90 days)'] ? `${parseFloat(product.rawData['Price Trend (90 days)']).toFixed(1)}%` : '-'}
                           </TableCell>
                           <TableCell className="text-left w-20 p-1 text-xs">
                             {product.rawData?.['Seller Country'] || '-'}
                           </TableCell>
                           <TableCell className="text-right w-16 p-1 text-xs">
                             {product.rawData?.['# of Active Sellers'] || product.rawData?.['Active Sellers'] || '-'}
                           </TableCell>
                           <TableCell className="text-right w-20 p-1 text-xs">
                             {product.rawData?.['Last Year Sales'] ? parseInt(product.rawData['Last Year Sales']).toLocaleString() : '-'}
                           </TableCell>
                         </TableRow>
                      );
                    })}
                   </TableBody>
                   </Table>
                </div>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNum);
                              }}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(totalPages);
                              }}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>

            {hoverImageUrl && createPortal(
              <div className="fixed inset-0 flex items-center justify-center z-[2147483647] pointer-events-none">
                <div className="w-64 h-64 md:w-72 md:h-72 bg-background border border-border rounded-lg shadow-2xl">
                  <img
                    src={hoverImageUrl}
                    alt="Product image enlarged"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
              </div>,
              document.body
            )}

            {paginatedProducts.length === 0 && filteredAndSortedProducts.length === 0 && (
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
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Advanced Scoring Configuration
              </CardTitle>
              <CardDescription>
                <span className="text-orange-600 font-medium">🚧 In Development - Do Not Use</span>
                <br />
                Fine-tune scoring criteria and weights for detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pointer-events-none">
              <ScoringSystem key={selectedProduct.productData.title} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Score;