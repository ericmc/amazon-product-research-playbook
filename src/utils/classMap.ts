/**
 * Class mapping utilities to replace dynamic Tailwind class construction
 */

import { type ClassValue } from "clsx";
import { cn } from "@/lib/utils";

/**
 * Badge variant class mappings
 */
export const badgeVariantMap: Record<string, string> = {
  proceed: "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800",
  "gather-data": "bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800",
  reject: "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800",
  default: "bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800",
};

/**
 * Score-based color class mappings
 */
export const scoreColorMap: Record<string, string> = {
  high: "text-green-600 dark:text-green-400",
  medium: "text-amber-600 dark:text-amber-400", 
  low: "text-red-600 dark:text-red-400",
  default: "text-gray-600 dark:text-gray-400",
};

/**
 * Progress bar color mappings
 */
export const progressColorMap: Record<string, string> = {
  high: "bg-green-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
  default: "bg-gray-500",
};

/**
 * Gate status class mappings
 */
export const gateStatusMap: Record<string, string> = {
  passed: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800",
  failed: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800",
  unknown: "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800",
};

/**
 * Get badge classes for recommendation status
 */
export function getBadgeClass(status: string, additionalClasses?: ClassValue): string {
  const baseClass = badgeVariantMap[status] || badgeVariantMap.default;
  return cn(baseClass, additionalClasses);
}

/**
 * Get color class based on score level
 */
export function getScoreClass(score: number, additionalClasses?: ClassValue): string {
  let level: string;
  if (score >= 80) level = 'high';
  else if (score >= 60) level = 'medium';
  else level = 'low';
  
  const baseClass = scoreColorMap[level];
  return cn(baseClass, additionalClasses);
}

/**
 * Get progress bar class based on score level
 */
export function getProgressClass(score: number, additionalClasses?: ClassValue): string {
  let level: string;
  if (score >= 80) level = 'high';
  else if (score >= 60) level = 'medium';
  else level = 'low';
  
  const baseClass = progressColorMap[level];
  return cn(baseClass, additionalClasses);
}

/**
 * Get gate status classes
 */
export function getGateClass(passed: boolean, additionalClasses?: ClassValue): string {
  const status = passed ? 'passed' : 'failed';
  const baseClass = gateStatusMap[status];
  return cn(baseClass, additionalClasses);
}