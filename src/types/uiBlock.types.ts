import type { UIBlockType } from "../constants/uiBlocks.js";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizBlock {
  type: "quiz";
  title: string;
  questions: QuizQuestion[];
}

export interface TableBlock {
  type: "table";
  title: string;
  headers: string[];
  rows: string[][];
}

export interface StepSolutionStep {
  id: string;
  stepNumber: number;
  description: string;
  formula?: string;
  result?: string;
}

export interface StepSolutionBlock {
  type: "step_solution";
  title: string;
  steps: StepSolutionStep[];
  finalAnswer: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardBlock {
  type: "flashcard";
  title: string;
  cards: FlashcardItem[];
}

export interface ComparisonBlock {
  type: "comparison";
  title: string;
  itemA: string;
  itemB: string;
  aspects: { aspect: string; valueA: string; valueB: string }[];
}

export type UIBlockSchema =
  | QuizBlock
  | TableBlock
  | StepSolutionBlock
  | FlashcardBlock
  | ComparisonBlock;

export interface UIBlockClassificationResult {
  shouldGenerate: boolean;
  blockType: UIBlockType | null;
  confidence: number;
}
