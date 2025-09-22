import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifyBadgeProps {
  disagreementIndex: number;
  threshold?: number;
  className?: string;
}

export const VerifyBadge: React.FC<VerifyBadgeProps> = ({ 
  disagreementIndex, 
  threshold = 20,
  className 
}) => {
  if (disagreementIndex <= threshold) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
        "dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Verify
    </Badge>
  );
};

export default VerifyBadge;