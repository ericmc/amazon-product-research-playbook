import { HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  title: string;
  content: string;
  helpLink?: string;
  helpLinkText?: string;
  className?: string;
  size?: "sm" | "default";
}

export const HelpTooltip = ({ 
  title, 
  content, 
  helpLink, 
  helpLinkText = "Learn more",
  className,
  size = "sm"
}: HelpTooltipProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto w-auto p-1 text-muted-foreground hover:text-foreground",
            size === "sm" && "h-5 w-5",
            className
          )}
          aria-label={`Help: ${title}`}
        >
          <HelpCircle className={cn(
            size === "sm" ? "h-3 w-3" : "h-4 w-4"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {content}
          </p>
          {helpLink && (
            <Link 
              to={helpLink}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {helpLinkText}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};