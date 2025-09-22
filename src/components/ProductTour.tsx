import { useState, useEffect, useCallback, useRef } from "react";
import { safeParseLocalStorage } from "@/utils/safeJson";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play,
  RotateCcw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  content: string;
  route?: string; // Route to navigate to for this step
  position?: "top" | "bottom" | "left" | "right";
}

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: "integrations",
    target: "nav-integrations",
    title: "Integrations",
    content: "Start by connecting your research tools like Jungle Scout, Helium 10, or Amazon POE.",
    route: "/integrations",
    position: "bottom"
  },
  {
    id: "import",
    target: "nav-import", 
    title: "Import Data",
    content: "Import CSV data from your research tools to begin analyzing opportunities.",
    route: "/import",
    position: "bottom"
  },
  {
    id: "score",
    target: "nav-score",
    title: "Configure Scoring",
    content: "Set up scoring criteria and weights to evaluate product opportunities systematically.",
    route: "/score",
    position: "bottom"
  },
  {
    id: "opportunities",
    target: "nav-opportunities",
    title: "Browse Opportunities",
    content: "Review all imported opportunities with scores and filter by your criteria.",
    route: "/opportunities",
    position: "bottom"
  },
  {
    id: "compare",
    target: "btn-compare",
    title: "Compare Products",
    content: "Select multiple opportunities to compare side-by-side metrics and scores.",
    position: "top"
  },
  {
    id: "validation",
    target: "tab-validation",
    title: "Validate Opportunities", 
    content: "Use the validation checklist to thoroughly research promising opportunities.",
    position: "top"
  },
  {
    id: "decision",
    target: "btn-decision",
    title: "Make Decisions",
    content: "Use the decision framework to determine which opportunities to pursue.",
    position: "top"
  },
  {
    id: "packet",
    target: "btn-packet",
    title: "Generate Sourcing Packets",
    content: "Create comprehensive sourcing documents for approved opportunities.",
    position: "top"
  }
];

export const ProductTour = ({ isOpen, onClose, onComplete }: ProductTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tourPosition, setTourPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const tourCardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentTourStep = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Find target element and calculate position
  const updateTargetElement = useCallback(() => {
    if (!currentTourStep) return;
    
    const element = document.querySelector(`[data-tour="${currentTourStep.target}"]`) as HTMLElement;
    setTargetElement(element);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      let x = rect.left + scrollLeft;
      let y = rect.top + scrollTop;
      
      // Position the tour card based on preferred position
      switch (currentTourStep.position) {
        case "bottom":
          x = rect.left + scrollLeft + (rect.width / 2);
          y = rect.bottom + scrollTop + 10;
          break;
        case "top":
          x = rect.left + scrollLeft + (rect.width / 2);
          y = rect.top + scrollTop - 10;
          break;
        case "right":
          x = rect.right + scrollLeft + 10;
          y = rect.top + scrollTop + (rect.height / 2);
          break;
        case "left":
          x = rect.left + scrollLeft - 10;
          y = rect.top + scrollTop + (rect.height / 2);
          break;
        default:
          x = rect.left + scrollLeft + (rect.width / 2);
          y = rect.bottom + scrollTop + 10;
      }
      
      setTourPosition({ x, y });
      
      // Scroll element into view
      element.scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth', 
        block: 'center' 
      });
    }
  }, [currentTourStep, prefersReducedMotion]);

  // Navigate to step route if needed
  useEffect(() => {
    if (isOpen && currentTourStep?.route) {
      navigate(currentTourStep.route);
    }
  }, [currentStep, isOpen, navigate, currentTourStep?.route]);

  // Update target element when step changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(updateTargetElement, 100); // Small delay for navigation
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen, updateTargetElement]);

  // Handle window resize
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => updateTargetElement();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen, updateTargetElement]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'Enter':
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, isFirstStep, isLastStep]);

  // Focus management
  useEffect(() => {
    if (isOpen && tourCardRef.current) {
      tourCardRef.current.focus();
    }
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const spotlight = targetElement ? {
    left: targetElement.getBoundingClientRect().left - 4,
    top: targetElement.getBoundingClientRect().top - 4,
    width: targetElement.getBoundingClientRect().width + 8,
    height: targetElement.getBoundingClientRect().height + 8,
  } : null;

  return createPortal(
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-content"
    >
      {/* Overlay with spotlight effect */}
      <div className="absolute inset-0 bg-black/50">
        {spotlight && (
          <div
            className="absolute border-2 border-primary rounded-md bg-transparent pointer-events-none"
            style={{
              left: spotlight.left,
              top: spotlight.top,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: `0 0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(255, 255, 255, 0.1)`,
            }}
          />
        )}
      </div>

      {/* Tour Card */}
      <Card
        ref={tourCardRef}
        className={cn(
          "absolute w-80 pointer-events-auto focus:outline-none focus:ring-2 focus:ring-ring",
          currentTourStep?.position === "top" && "-translate-y-full -translate-x-1/2",
          currentTourStep?.position === "bottom" && "-translate-x-1/2",
          currentTourStep?.position === "left" && "-translate-x-full -translate-y-1/2",
          currentTourStep?.position === "right" && "-translate-y-1/2",
          (!currentTourStep?.position || currentTourStep?.position === "bottom") && "-translate-x-1/2"
        )}
        style={{
          left: tourPosition.x,
          top: tourPosition.y,
          transform: currentTourStep?.position === "top" ? "translate(-50%, -100%)" :
                    currentTourStep?.position === "left" ? "translate(-100%, -50%)" :
                    currentTourStep?.position === "right" ? "translate(0, -50%)" :
                    "translate(-50%, 0)"
        }}
        tabIndex={-1}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} of {tourSteps.length}
              </Badge>
              <h3 id="tour-title" className="font-semibold text-sm">
                {currentTourStep?.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
              aria-label="Close tour"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <p id="tour-content" className="text-sm text-muted-foreground mb-4">
            {currentTourStep?.content}
          </p>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="h-8"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Back
            </Button>

            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleNext}
              className="h-8"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="h-3 w-3 ml-1" />}
            </Button>
          </div>

          {/* Keyboard hints */}
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex gap-4">
              <span>← → Navigate</span>
              <span>Esc Close</span>
              <span>Enter Next</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
};

// Hook for managing tour state
export const useTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    const seen = safeParseLocalStorage('hasSeenTour', false);
    setHasSeenTour(seen);
  }, []);

  const startTour = () => {
    setIsOpen(true);
  };

  const closeTour = () => {
    setIsOpen(false);
  };

  const completeTour = () => {
    setIsOpen(false);
    setHasSeenTour(true);
    localStorage.setItem('hasSeenTour', 'true');
  };

  const restartTour = () => {
    setIsOpen(true);
  };

  return {
    isOpen,
    hasSeenTour,
    startTour,
    closeTour,
    completeTour,
    restartTour
  };
};

// Tour trigger components
export const TourStartButton = ({ onStart }: { onStart: () => void }) => (
  <Button onClick={onStart} className="w-full justify-start">
    <Play className="h-4 w-4 mr-2" />
    Start Product Tour
  </Button>
);

export const TourRestartButton = ({ onRestart }: { onRestart: () => void }) => (
  <Button variant="outline" onClick={onRestart} className="w-full justify-start">
    <RotateCcw className="h-4 w-4 mr-2" />
    Restart Tour
  </Button>
);