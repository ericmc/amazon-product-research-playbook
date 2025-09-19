import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Database } from "lucide-react";

interface Criteria {
  id: string;
  name: string;
  value: number;
  maxValue: number;
}

interface DecisionTreeProps {
  criteria: Criteria[];
  className?: string;
}

export interface DecisionResult {
  decision: "proceed" | "gather-data" | "reject";
  label: string;
  icon: React.ReactNode;
  variant: "default" | "secondary" | "destructive";
  reasoning: string;
}

export const evaluateOpportunity = (criteria: Criteria[]): DecisionResult => {
  // Map criteria to decision factors
  const demandCriterion = criteria.find(c => c.id === "demand");
  const competitionCriterion = criteria.find(c => c.id === "competition"); // reviews
  const marginCriterion = criteria.find(c => c.id === "margins");

  if (!demandCriterion || !competitionCriterion || !marginCriterion) {
    return {
      decision: "gather-data",
      label: "Insufficient Data",
      icon: <Database className="w-3 h-3" />,
      variant: "secondary",
      reasoning: "Missing required criteria for decision"
    };
  }

  // Extract values
  const demand = demandCriterion.value; // monthly demand
  const reviews = competitionCriterion.value; // competitor reviews (lower is better)
  const margin = (marginCriterion.value / marginCriterion.maxValue) * 100; // margin percentage

  // Primary thresholds
  const demandThreshold = 300;
  const reviewsThreshold = 200;
  const marginThreshold = 30;

  // Check if all criteria meet thresholds
  const demandMet = demand >= demandThreshold;
  const reviewsMet = reviews <= reviewsThreshold;
  const marginMet = margin >= marginThreshold;

  if (demandMet && reviewsMet && marginMet) {
    return {
      decision: "proceed",
      label: "Proceed to Sourcing",
      icon: <CheckCircle className="w-3 h-3" />,
      variant: "default",
      reasoning: `All criteria met: ${Math.round(demand)}/mo demand, ${reviews} reviews, ${Math.round(margin)}% margin`
    };
  }

  // Check if two of three are close to threshold (within 20% tolerance)
  const demandClose = demand >= demandThreshold * 0.8;
  const reviewsClose = reviews <= reviewsThreshold * 1.2;
  const marginClose = margin >= marginThreshold * 0.8;

  const closeCount = [demandClose, reviewsClose, marginClose].filter(Boolean).length;

  if (closeCount >= 2) {
    return {
      decision: "gather-data",
      label: "Gather More Data",
      icon: <AlertTriangle className="w-3 h-3" />,
      variant: "secondary",
      reasoning: `${closeCount}/3 criteria close to thresholds - needs validation`
    };
  }

  return {
    decision: "reject",
    label: "Reject / Archive",
    icon: <XCircle className="w-3 h-3" />,
    variant: "destructive",
    reasoning: `Criteria not met: ${Math.round(demand)}/mo demand, ${reviews} reviews, ${Math.round(margin)}% margin`
  };
};

const DecisionTree: React.FC<DecisionTreeProps> = ({ criteria, className = "" }) => {
  const result = evaluateOpportunity(criteria);

  return (
    <div className={`space-y-2 ${className}`}>
      <Badge 
        variant={result.variant} 
        className="flex items-center space-x-1 text-xs font-medium"
      >
        {result.icon}
        <span>{result.label}</span>
      </Badge>
      <p className="text-xs text-muted-foreground">{result.reasoning}</p>
    </div>
  );
};

export default DecisionTree;