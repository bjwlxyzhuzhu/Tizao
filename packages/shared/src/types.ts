export type Role = 'student' | 'teacher' | 'admin';

export type StepType = 'form' | 'scene' | 'chart' | 'ai' | 'auto';

export type SceneId = 'furnace' | 'forge' | 'workstation';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface StepField {
  key: string;
  label: string;
  kind: 'number' | 'select' | 'text';
  unit?: string;
  options?: string[];
  min?: number;
  max?: number;
  default?: number | string;
}

export interface StepDefinition {
  id: string;
  seq: number;
  name: string;
  type: StepType;
  scene?: SceneId;
  maxScore: number;
  description: string;
  fields: StepField[];
}

export type StepInput = Record<string, number | string>;

export interface StepSubmit {
  stepId: string;
  input: StepInput;
}

export interface StepResult {
  stepId: string;
  score: number;
  maxScore: number;
  result: Record<string, unknown>;
  feedback: string;
  nextStepId: string | null;
}

export interface SessionState {
  sessionId: number;
  currentStepId: string;
  totalScore: number;
  finished: boolean;
  stepRecords: Array<{ stepId: string; score: number; maxScore: number }>;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AiReviewResponse {
  risks: Array<{ level: 'high' | 'mid' | 'low'; item: string; reason: string }>;
  source: 'model' | 'rule';
}
