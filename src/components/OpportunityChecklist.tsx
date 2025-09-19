import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Calculator, 
  Users, 
  Lightbulb,
  Save,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  notes: string;
  category: 'demand' | 'margins' | 'competition' | 'differentiation';
}

export interface OpportunityChecklist {
  items: ChecklistItem[];
  completionRate: number;
  lastUpdated: string;
}

const defaultChecklistItems: Omit<ChecklistItem, 'completed' | 'notes'>[] = [
  // Demand Proof
  {
    id: 'search-volume',
    title: 'Search Volume Analysis',
    description: 'Verify monthly search volume for main keywords (min 1000 searches)',
    category: 'demand'
  },
  {
    id: 'trend-analysis',
    title: 'Trend Analysis',
    description: 'Check Google Trends for seasonal patterns and growth trajectory',
    category: 'demand'
  },
  {
    id: 'social-proof',
    title: 'Social Media Demand',
    description: 'Research social media mentions, hashtags, and engagement',
    category: 'demand'
  },
  
  // Margin Calculations
  {
    id: 'fba-fees',
    title: 'FBA Fee Calculation',
    description: 'Calculate Amazon FBA fees (storage, fulfillment, referral)',
    category: 'margins'
  },
  {
    id: 'shipping-costs',
    title: 'Freight & Shipping',
    description: 'Estimate freight costs from supplier to Amazon warehouse',
    category: 'margins'
  },
  {
    id: 'duties-taxes',
    title: 'Duties & Import Taxes',
    description: 'Calculate customs duties and import taxes for product category',
    category: 'margins'
  },
  {
    id: 'break-even',
    title: 'Break-even Analysis',
    description: 'Determine minimum selling price for target profit margin',
    category: 'margins'
  },
  
  // Competitive Landscape
  {
    id: 'top-competitors',
    title: 'Top 10 Competitor Analysis',
    description: 'Analyze top 10 listings: prices, reviews, features, weaknesses',
    category: 'competition'
  },
  {
    id: 'review-analysis',
    title: 'Review Mining',
    description: 'Analyze competitor reviews for common complaints and gaps',
    category: 'competition'
  },
  {
    id: 'pricing-strategy',
    title: 'Pricing Analysis',
    description: 'Map competitor pricing and identify optimal price point',
    category: 'competition'
  },
  
  // Differentiation Ideas
  {
    id: 'feature-gaps',
    title: 'Feature Gap Analysis',
    description: 'Identify missing features or improvements in existing products',
    category: 'differentiation'
  },
  {
    id: 'bundle-opportunities',
    title: 'Bundle Opportunities',
    description: 'Explore complementary products or bundle possibilities',
    category: 'differentiation'
  },
  {
    id: 'branding-angle',
    title: 'Unique Branding Angle',
    description: 'Define unique value proposition and brand positioning',
    category: 'differentiation'
  }
];

interface OpportunityChecklistProps {
  opportunityIndex: number;
  productName: string;
  checklist?: OpportunityChecklist;
  onUpdate: (checklist: OpportunityChecklist) => void;
}

const OpportunityChecklistComponent = ({ 
  opportunityIndex, 
  productName, 
  checklist, 
  onUpdate 
}: OpportunityChecklistProps) => {
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(() => {
    if (checklist?.items) {
      return checklist.items;
    }
    return defaultChecklistItems.map(item => ({
      ...item,
      completed: false,
      notes: ''
    }));
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const categories = [
    { 
      id: 'demand', 
      title: 'Demand Proof', 
      icon: TrendingUp, 
      description: 'Validate market demand and search volume' 
    },
    { 
      id: 'margins', 
      title: 'Margin Calculations', 
      icon: Calculator, 
      description: 'Calculate all costs and profit margins' 
    },
    { 
      id: 'competition', 
      title: 'Competitive Landscape', 
      icon: Users, 
      description: 'Analyze top competitors and market positioning' 
    },
    { 
      id: 'differentiation', 
      title: 'Differentiation Strategy', 
      icon: Lightbulb, 
      description: 'Identify unique angles and improvements' 
    }
  ];

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    const updatedItems = localChecklist.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    setLocalChecklist(updatedItems);
  };

  const calculateCompletionRate = (items: ChecklistItem[]) => {
    const completedItems = items.filter(item => item.completed).length;
    return Math.round((completedItems / items.length) * 100);
  };

  const saveChecklist = () => {
    const completionRate = calculateCompletionRate(localChecklist);
    const updatedChecklist: OpportunityChecklist = {
      items: localChecklist,
      completionRate,
      lastUpdated: new Date().toISOString()
    };
    onUpdate(updatedChecklist);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryItems = (categoryId: string) => {
    return localChecklist.filter(item => item.category === categoryId);
  };

  const getCategoryCompletion = (categoryId: string) => {
    const items = getCategoryItems(categoryId);
    return calculateCompletionRate(items);
  };

  const overallCompletion = calculateCompletionRate(localChecklist);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{productName} - Research Checklist</h3>
            <p className="text-sm text-muted-foreground">
              Complete all items to ensure thorough product validation
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{overallCompletion}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={overallCompletion} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{localChecklist.filter(item => item.completed).length} of {localChecklist.length} completed</span>
            <Badge variant={overallCompletion === 100 ? "default" : "secondary"}>
              {overallCompletion === 100 ? "Ready for Launch" : "In Progress"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const categoryItems = getCategoryItems(category.id);
          const categoryCompletion = getCategoryCompletion(category.id);
          const isExpanded = expandedCategories.has(category.id);
          const Icon = category.icon;

          return (
            <Card key={category.id}>
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleCategory(category.id)}
                >
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">{categoryCompletion}%</div>
                          <Progress value={categoryCompletion} className="w-16 h-2" />
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="space-y-3 p-4 rounded-lg bg-muted/30">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              updateItem(item.id, { completed: checked as boolean })
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {item.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                            <Textarea
                              placeholder="Add notes, findings, or links..."
                              value={item.notes}
                              onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                              className="min-h-[80px]"
                            />
                          </div>
                          {item.completed && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-4">
        <Button onClick={saveChecklist} size="lg" className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Progress
        </Button>
      </div>
    </div>
  );
};

export default OpportunityChecklistComponent;