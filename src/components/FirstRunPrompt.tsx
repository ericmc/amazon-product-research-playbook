import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, X, Sparkles } from "lucide-react";

interface FirstRunPromptProps {
  onStartTour: () => void;
  onDismiss: () => void;
}

export const FirstRunPrompt = ({ onStartTour, onDismiss }: FirstRunPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after a short delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartTour = () => {
    setIsVisible(false);
    onStartTour();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card 
        className={cn(
          "w-full max-w-md mx-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Welcome!</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  First time here?
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
              aria-label="Dismiss welcome prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Take a quick tour to learn how to research and validate Amazon product opportunities 
              using this systematic approach.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">You'll learn:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• How to import and score opportunities</li>
              <li>• Compare products side-by-side</li>
              <li>• Validate opportunities systematically</li>
              <li>• Generate sourcing packets</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleStartTour}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Tour
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="flex-1"
            >
              Skip
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can always restart the tour from the Help page
          </p>
        </CardContent>
      </Card>
    </div>
  );
};