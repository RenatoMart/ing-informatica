// Forma: ver profiles/escuela/content/malla.ts
import type { Edge } from 'reactflow';

export type AreaType = 'general' | 'especifico' | 'especialidad';

export interface CourseData {
  id: string;
  name: string;
  type: AreaType;
  credits: number;
  hoursT: number;
  hoursP: number;
  cycle: string;
  isElective: boolean;
  description: string;
}

export const CURRICULUM_DATA: CourseData[] = [];
export const PREREQUISITES_EDGES: Edge[] = [];
export const CYCLE_COLUMNS: Record<string, number> = {};
