import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
  variant?: "default" | "minimal";
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = "default"
}: EmptyStateProps) => {
  const content = (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          {description}
        </p>
      </div>
      <Button onClick={onAction} className="mt-4">
        {actionLabel}
      </Button>
    </div>
  );

  if (variant === "minimal") {
    return (
      <div className={cn("py-12", className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="py-12">
        {content}
      </CardContent>
    </Card>
  );
};