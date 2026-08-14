import {
  HeartPulse,
  Utensils,
  Dna,
  Cog,
  Bot,
  ShieldCheck,
  FlaskConical,
  Leaf,
  Share2,
  Factory,
  Tractor,
  PawPrint,
  type LucideIcon,
} from 'lucide-react';
import { FunctionCategory } from './types';

export const FUNCTION_ICONS: Record<FunctionCategory, LucideIcon> = {
  'Animal Health': HeartPulse,
  'Nutrition & Feeding': Utensils,
  'Breeding & Genetics': Dna,
  'Engineering & Automation': Cog,
  'Robotics & AI': Bot,
  'Quality & Food Safety': ShieldCheck,
  'Product Development': FlaskConical,
  'Sustainability & Traceability': Leaf,
  'Digital Platforms & Innovation': Share2,
  'Dairy Processing': Factory,
  'Farm Management': Tractor,
  'Animal Welfare': PawPrint,
};

export const FUNCTION_SHORT: Record<FunctionCategory, string> = {
  'Animal Health': 'Animal Health',
  'Nutrition & Feeding': 'Nutrition',
  'Breeding & Genetics': 'Genetics',
  'Engineering & Automation': 'Engineering',
  'Robotics & AI': 'Robotics & AI',
  'Quality & Food Safety': 'Quality',
  'Product Development': 'Product',
  'Sustainability & Traceability': 'Sustainability',
  'Digital Platforms & Innovation': 'Digital',
  'Dairy Processing': 'Processing',
  'Farm Management': 'Farm Mgmt',
  'Animal Welfare': 'Welfare',
};
