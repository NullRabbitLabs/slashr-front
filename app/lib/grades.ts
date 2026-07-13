import type { Grade } from '@/types/api';

export const GRADE_COLORS: Record<Grade, string> = {
  A: '#14F195',
  B: '#4DA2FF',
  C: '#F5A623',
  D: '#FF7A45',
  F: '#FF4545',
};

export const GRADE_BG: Record<Grade, string> = {
  A: 'rgba(20, 241, 149, 0.10)',
  B: 'rgba(77, 162, 255, 0.10)',
  C: 'rgba(245, 166, 35, 0.10)',
  D: 'rgba(255, 122, 69, 0.10)',
  F: 'rgba(255, 69, 69, 0.10)',
};

export function gradeColor(grade: Grade): string {
  return GRADE_COLORS[grade] ?? GRADE_COLORS.F;
}

export function gradeBg(grade: Grade): string {
  return GRADE_BG[grade] ?? GRADE_BG.F;
}

export function isAtRisk(grade: Grade): boolean {
  return grade === 'D' || grade === 'F';
}

export function showAlternatives(grade: Grade): boolean {
  return grade === 'C' || grade === 'D' || grade === 'F';
}
