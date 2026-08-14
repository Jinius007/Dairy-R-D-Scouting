export type FunctionCategory =
  | 'Animal Health'
  | 'Nutrition & Feeding'
  | 'Breeding & Genetics'
  | 'Engineering & Automation'
  | 'Robotics & AI'
  | 'Quality & Food Safety'
  | 'Product Development'
  | 'Sustainability & Traceability'
  | 'Digital Platforms & Innovation'
  | 'Dairy Processing'
  | 'Farm Management'
  | 'Animal Welfare';

export type RDType =
  | 'Research Paper'
  | 'Industry News'
  | 'Product Launch'
  | 'Patent'
  | 'Conference'
  | 'Clinical Trial'
  | 'Academic Study'
  | 'Technology Demo';

export interface Development {
  id: string;
  title: string;
  summary: string;
  date: string;
  sourceUrl: string;
  sourceName: string;
  function: FunctionCategory;
  region: string;
  company?: string;
  institution?: string;
  rdType: RDType;
  tags?: string[];
}

export interface Metadata {
  lastRefreshed: string;
  nextRefresh: string;
  totalTracked: number;
  coverageStart: string;
}

export interface DevelopmentsData {
  metadata: Metadata;
  developments: Development[];
}

export const FUNCTION_COLORS: Record<FunctionCategory, string> = {
  'Animal Health': '#ef4444',
  'Nutrition & Feeding': '#f59e0b',
  'Breeding & Genetics': '#8b5cf6',
  'Engineering & Automation': '#3b82f6',
  'Robotics & AI': '#6366f1',
  'Quality & Food Safety': '#10b981',
  'Product Development': '#ec4899',
  'Sustainability & Traceability': '#14b8a6',
  'Digital Platforms & Innovation': '#f97316',
  'Dairy Processing': '#06b6d4',
  'Farm Management': '#84cc16',
  'Animal Welfare': '#a855f7',
};

export const ALL_FUNCTIONS: FunctionCategory[] = [
  'Animal Health',
  'Nutrition & Feeding',
  'Breeding & Genetics',
  'Engineering & Automation',
  'Robotics & AI',
  'Quality & Food Safety',
  'Product Development',
  'Sustainability & Traceability',
  'Digital Platforms & Innovation',
  'Dairy Processing',
  'Farm Management',
  'Animal Welfare',
];

export const ALL_RD_TYPES: RDType[] = [
  'Research Paper',
  'Industry News',
  'Product Launch',
  'Patent',
  'Conference',
  'Clinical Trial',
  'Academic Study',
  'Technology Demo',
];

export type TimelinePreset =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | '12months'
  | '2years'
  | 'all';

export interface Filters {
  functions: Set<FunctionCategory>;
  regions: Set<string>;
  companies: Set<string>;
  institutions: Set<string>;
  rdTypes: Set<RDType>;
  timeline: TimelinePreset;
  customDate?: string;
  search: string;
}
