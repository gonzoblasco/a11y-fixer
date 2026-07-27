/**
 * Core types for a11y-fixer.
 */

export interface ViolationNode {
  selector: string;
  html: string;
  failureSummary: string;
}

export interface Violation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: ViolationNode[];
}

export interface ProcessedViolation {
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  elements: ViolationNode[];
}

export interface ProcessedResult {
  violations: ProcessedViolation[];
  totalCount: number;
}

export interface EvolutionResult {
  newViolations: ProcessedViolation[];
  fixedViolations: ProcessedViolation[];
  persistentViolations: ProcessedViolation[];
  trend: 'improves' | 'worsens' | 'neutral' | 'first';
}
