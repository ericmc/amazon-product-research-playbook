import { useState, useEffect, useRef } from "react";
import { safeParseLocalStorage } from "@/utils/safeJson";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play,
  RotateCcw,
  ExternalLink,
  CheckCircle,
  Circle,
  Database,
  Upload,
  BarChart3,
  GitCompare,
  FileCheck,
  Download,
  RefreshCw,
  Puzzle
} from "lucide-react";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  cta?: {
    label: string;
    action: () => void;
    variant?: "default" | "outline";
  };
  checklist?: string[];
  tips?: string[];
}

interface QuickTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialStep?: number;
}

const statusClassMap = {
  current: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground", 
  upcoming: "bg-muted text-muted-foreground"
};

export const QuickTutorial = ({ isOpen, onClose, onComplete, initialStep = 1 }: QuickTutorialProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tutorialSteps: TutorialStep[] = [
    {
      id: 1,
      title: "Choose Your Research Tool",
      description: "Start by selecting your preferred Amazon research platform to gather product data.",
      icon: Puzzle,
      cta: {
        label: "Go to Integrations",
        action: () => {
          navigate("/integrations");
          handleStepComplete(1);
        }
      },
      checklist: [
        "Pick Jungle Scout for revenue-focused research",
        "Choose Helium 10 for comprehensive keyword data", 
        "Select Amazon POE for official Amazon insights"
      ],
      tips: [
        "Each tool has different strengths - choose based on your research focus",
        "You can use multiple tools and combine their data"
      ]
    },
    {
      id: 2,
      title: "Gather Your Data",
      description: "Export product data from your chosen tool using their built-in export features.",
      icon: Database,
      checklist: [
        "Run your product search with filters",
        "Export results as CSV or copy to clipboard",
        "Ensure data includes: Product names, Revenue, Reviews, Pricing",
        "Save the file or keep clipboard data ready"
      ],
      tips: [
        "Include 10-50 products for meaningful analysis",
        "Filter for your target categories and price ranges"
      ]
    },
    {
      id: 3,
      title: "Import & Map Fields",
      description: "Upload your data and map CSV columns to our scoring system fields.",
      icon: Upload,
      cta: {
        label: "Go to Import",
        action: () => {
          navigate("/import");
          handleStepComplete(3);
        }
      },
      checklist: [
        "Choose your data source format",
        "Upload CSV file or paste clipboard data",
        "Map required fields: Product Name, Revenue, Competition",
        "Review data preview and confirm import"
      ]
    },
    {
      id: 4,
      title: "Configure Scoring",
      description: "Set up scoring criteria weights and validate gate thresholds for opportunity analysis.",
      icon: BarChart3,
      cta: {
        label: "Go to Scoring",
        action: () => {
          navigate("/score");
          handleStepComplete(4);
        }
      },
      checklist: [
        "Review default weight distribution (Revenue 25%, Competition 20%)",
        "Adjust weights based on your business priorities",
        "Check gate thresholds (Revenue ≥$50k, Margins ≥30%)",
        "Save scoring configuration"
      ]
    },
    {
      id: 5,
      title: "Compare Opportunities",
      description: "Browse scored opportunities and compare top performers side-by-side.",
      icon: GitCompare,
      cta: {
        label: "View Opportunities",
        action: () => {
          navigate("/opportunities");
          handleStepComplete(5);
        }
      },
      checklist: [
        "Review opportunities list sorted by score",
        "Select 2-3 top-scoring products",
        "Use Compare button to see side-by-side metrics",
        "Identify clear winners and note key differences"
      ]
    },
    {
      id: 6,
      title: "Validate Your Pick",
      description: "Deep-dive validation using our comprehensive checklist system.",
      icon: FileCheck,
      cta: {
        label: "Start Validation",
        action: async () => {
          try {
            const { opportunityStorage } = await import("@/utils/OpportunityStorage");
            const opportunities = await opportunityStorage.getOpportunities();
            if (opportunities.length > 0) {
              navigate(`/opportunities/${opportunities[0].id || 0}`);
              handleStepComplete(6);
            } else {
              navigate("/opportunities");
            }
          } catch (error) {
            navigate("/opportunities");
          }
        }
      },
      checklist: [
        "Open your top opportunity",
        "Go to Validation tab",
        "Work through market validation checklist",
        "Apply safety margins for Barriers and Profitability"
      ]
    },
    {
      id: 7,
      title: "Make Decision & Generate Packet",
      description: "Use the decision framework and create sourcing documentation for approved opportunities.",
      icon: Download,
      cta: {
        label: "Make Decision",
        action: async () => {
          try {
            const { opportunityStorage } = await import("@/utils/OpportunityStorage");
            const opportunities = await opportunityStorage.getOpportunities();
            if (opportunities.length > 0) {
              navigate(`/opportunities/${opportunities[0].id || 0}/decision`);
              handleStepComplete(7);
            } else {
              navigate("/opportunities");
            }
          } catch (error) {
            navigate("/opportunities");
          }
        }
      },
      checklist: [
        "Review decision framework recommendations",
        "Choose: Proceed, Gather More Data, or Reject",
        "If Proceed: Generate Sourcing Packet",
        "Download PDF or print for supplier discussions"
      ]
    },
    {
      id: 8,
      title: "Monitor & Refresh",
      description: "Set up ongoing monitoring and refresh data to stay current with market changes.",
      icon: RefreshCw,
      checklist: [
        "Set refresh cadence (Weekly recommended)",
        "Watch for 'Needs refresh' badges on opportunities",
        "Click Refresh to update stale data",
        "Monitor score changes and market shifts"
      ],
      tips: [
        "Weekly refresh keeps you ahead of competition",
        "Significant score changes may warrant strategy adjustments"
      ]
    }
  ];

  const currentTutorialStep = tutorialSteps[currentStep - 1];
  const totalSteps = tutorialSteps.length;
  const progress = (currentStep / totalSteps) * 100;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  // Load progress from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedProgress = safeParseLocalStorage('quickTutorialStep', 1);
      const savedCompleted = safeParseLocalStorage('quickTutorialCompleted', []);
      
      setCurrentStep(savedProgress);
      setCompletedSteps(new Set(Array.isArray(savedCompleted) ? savedCompleted : []));
    }
  }, [isOpen]);

  // Save progress to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('quickTutorialStep', currentStep.toString());
      localStorage.setItem('quickTutorialCompleted', JSON.stringify(Array.from(completedSteps)));
    }
  }, [currentStep, completedSteps, isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const focusableElement = contentRef.current.querySelector('button, [tabindex="0"]') as HTMLElement;
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, [isOpen, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          if (!isLastStep) {
            event.preventDefault();
            handleNext();
          }
          break;
        case 'ArrowLeft':
          if (!isFirstStep) {
            event.preventDefault();
            handlePrevious();
          }
          break;
        case 'Enter':
          if (currentTutorialStep.cta) {
            event.preventDefault();
            currentTutorialStep.cta.action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, isFirstStep, isLastStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepComplete = (stepId: number) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    toast({
      title: "Step completed!",
      description: `${tutorialSteps[stepId - 1].title} ✓`,
    });

    // Auto-advance if not on the last step
    if (stepId < totalSteps) {
      setTimeout(() => {
        setCurrentStep(stepId + 1);
      }, prefersReducedMotion ? 0 : 1000);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(new Set(tutorialSteps.map(s => s.id)));
    localStorage.setItem('hasSeenQuickTutorial', 'true');
    onComplete();
    
    toast({
      title: "Tutorial completed!",
      description: "You're ready to start researching Amazon opportunities.",
    });
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    localStorage.removeItem('quickTutorialStep');
    localStorage.removeItem('quickTutorialCompleted');
  };

  const handleSkip = () => {
    onClose();
    localStorage.setItem('hasSeenQuickTutorial', 'true');
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const tutorialContent = (
    <div ref={contentRef} className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            Step {currentStep} of {totalSteps}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
            aria-label="Close tutorial"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="flex gap-1">
          {tutorialSteps.map((step) => {
            const status = getStepStatus(step.id);
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  statusClassMap[status],
                  "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
                aria-label={`Go to step ${step.id}: ${step.title}`}
              />
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <currentTutorialStep.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{currentTutorialStep.title}</CardTitle>
              <CardDescription className="mt-1">
                {currentTutorialStep.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Checklist */}
          {currentTutorialStep.checklist && (
            <div>
              <h4 className="font-medium mb-3">Action Steps:</h4>
              <div className="space-y-2">
                {currentTutorialStep.checklist.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {currentTutorialStep.tips && (
            <div>
              <h4 className="font-medium mb-3">💡 Tips:</h4>
              <div className="space-y-2">
                {currentTutorialStep.tips.map((tip, index) => (
                  <div key={index} className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button */}
          {currentTutorialStep.cta && (
            <div className="pt-2">
              <Button 
                onClick={currentTutorialStep.cta.action}
                variant={currentTutorialStep.cta.variant || "default"}
                className="w-full"
              >
                {currentTutorialStep.cta.label}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={isFirstStep}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip Tutorial
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestart}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Restart
          </Button>
          
          <Button size="sm" onClick={handleNext}>
            {isLastStep ? "Complete" : "Next"}
            {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="pt-4 border-t text-xs text-muted-foreground">
        <div className="flex gap-4 justify-center">
          <span>← → Navigate</span>
          <span>Esc Close</span>
          <span>Enter Action</span>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Quick Start Tutorial</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {tutorialContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Start Tutorial</DialogTitle>
        </DialogHeader>
        {tutorialContent}
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing tutorial state
export const useQuickTutorial = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const seen = safeParseLocalStorage('hasSeenQuickTutorial', false);
    setHasSeenTutorial(seen);
  }, []);

  const startTutorial = (step?: number) => {
    setIsOpen(true);
  };

  const closeTutorial = () => {
    setIsOpen(false);
  };

  const completeTutorial = () => {
    setIsOpen(false);
    setHasSeenTutorial(true);
    localStorage.setItem('hasSeenQuickTutorial', 'true');
  };

  const restartTutorial = () => {
    localStorage.removeItem('quickTutorialStep');
    localStorage.removeItem('quickTutorialCompleted');
    setIsOpen(true);
  };

  return {
    isOpen,
    hasSeenTutorial,
    startTutorial,
    closeTutorial,
    completeTutorial,
    restartTutorial
  };
};

// Tutorial trigger components
export const QuickStartButton = ({ onStart }: { onStart: () => void }) => (
  <Button variant="outline" size="sm" onClick={onStart}>
    <Play className="h-4 w-4 mr-2" />
    Quick Start
  </Button>
);

export const TutorialRestartButton = ({ onRestart }: { onRestart: () => void }) => (
  <Button variant="outline" onClick={onRestart} className="w-full justify-start">
    <RotateCcw className="h-4 w-4 mr-2" />
    Quick Tutorial
  </Button>
);