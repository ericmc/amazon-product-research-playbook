interface ToolLink {
  name: string;
  icon: string;
  description: string;
  baseUrl: string;
  supportsUrlParams: boolean;
  urlParamKey?: string;
  clipboardTemplate?: (searchTerm: string) => string;
}

const externalTools: ToolLink[] = [
  {
    name: "Jungle Scout Product Database",
    icon: "🦍",
    description: "Search for similar products and revenue data",
    baseUrl: "https://members.junglescout.com/productdatabase",
    supportsUrlParams: true,
    urlParamKey: "keyword",
    clipboardTemplate: (term) => `Search term for Jungle Scout: ${term}`
  },
  {
    name: "Helium 10 Black Box",
    icon: "🎈",
    description: "Find products with revenue estimates",
    baseUrl: "https://members.helium10.com/tools/blackbox",
    supportsUrlParams: false,
    clipboardTemplate: (term) => `Product research term: ${term}`
  },
  {
    name: "Helium 10 Magnet",
    icon: "🧲",
    description: "Keyword research and search volume",
    baseUrl: "https://members.helium10.com/tools/magnet",
    supportsUrlParams: false,
    clipboardTemplate: (term) => `Keyword for Magnet research: ${term}`
  },
  {
    name: "Amazon Product Opportunity Explorer",
    icon: "📊",
    description: "Amazon's official market research tool",
    baseUrl: "https://brandanalytics.amazon.com/",
    supportsUrlParams: false,
    clipboardTemplate: (term) => `Search term for Amazon POE: ${term}`
  }
];

export class ExternalToolsService {
  static async openTool(tool: ToolLink, searchTerm: string = '', category: string = ''): Promise<void> {
    const contextTerm = searchTerm || category || 'product research';
    
    try {
      if (tool.supportsUrlParams && tool.urlParamKey) {
        // Open with pre-filled URL parameters
        const url = new URL(tool.baseUrl);
        url.searchParams.set(tool.urlParamKey, contextTerm);
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
      } else {
        // Copy search term to clipboard and open tool
        if (tool.clipboardTemplate && navigator.clipboard) {
          const clipboardText = tool.clipboardTemplate(contextTerm);
          await navigator.clipboard.writeText(clipboardText);
        }
        window.open(tool.baseUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening external tool:', error);
      // Fallback: just open the tool without context
      window.open(tool.baseUrl, '_blank', 'noopener,noreferrer');
    }
  }

  static getTools(): ToolLink[] {
    return externalTools;
  }

  static extractProductCategory(productName: string): string {
    // Simple category extraction from product name
    const categories = {
      'kitchen': ['kitchen', 'cooking', 'utensil', 'cutting board', 'knife', 'pot', 'pan'],
      'electronics': ['electronic', 'device', 'gadget', 'tech', 'wireless', 'bluetooth'],
      'home & garden': ['home', 'garden', 'outdoor', 'furniture', 'decor'],
      'health': ['health', 'wellness', 'fitness', 'supplement', 'vitamin'],
      'clothing': ['clothing', 'apparel', 'shirt', 'dress', 'shoes', 'accessory'],
      'sports': ['sports', 'exercise', 'gym', 'athletic', 'outdoor'],
      'beauty': ['beauty', 'cosmetic', 'skincare', 'makeup'],
      'automotive': ['car', 'auto', 'vehicle', 'motor']
    };

    const productLower = productName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => productLower.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  static generateSearchTerms(productName: string): string[] {
    // Extract meaningful search terms from product name
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = productName.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    const terms = [];
    
    // Add full product name (cleaned)
    terms.push(words.join(' '));
    
    // Add main keywords (first 2-3 meaningful words)
    if (words.length >= 2) {
      terms.push(words.slice(0, 2).join(' '));
    }
    
    // Add category-based search
    const category = this.extractProductCategory(productName);
    if (category !== 'general') {
      terms.push(category);
    }

    return terms.filter((term, index, arr) => arr.indexOf(term) === index); // Remove duplicates
  }
}