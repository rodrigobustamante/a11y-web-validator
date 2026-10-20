import type { ImpactLevel } from '@a11y-web-validator/types';

interface ImpactStyle {
  label: string;
  /** Short explanation shown to screen reader and sighted users */
  description: string;
  /** Badge used next to each issue */
  badge: string;
  /** Filter toggle when selected */
  active: string;
  /** Large count inside the filter toggle */
  count: string;
}

// Kept in /components so Tailwind's content scanner picks up the class names
export const IMPACT_STYLES: Record<ImpactLevel, ImpactStyle> = {
  critical: {
    label: 'Critical',
    description: 'Blocks access for some users',
    badge:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800',
    active: 'bg-red-50 border-red-400 dark:bg-red-900/30 dark:border-red-700',
    count: 'text-red-700 dark:text-red-300',
  },
  serious: {
    label: 'Serious',
    description: 'Causes significant difficulty',
    badge:
      'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800',
    active:
      'bg-orange-50 border-orange-400 dark:bg-orange-900/30 dark:border-orange-700',
    count: 'text-orange-700 dark:text-orange-300',
  },
  moderate: {
    label: 'Moderate',
    description: 'Causes some difficulty',
    badge:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800',
    active:
      'bg-amber-50 border-amber-400 dark:bg-amber-900/30 dark:border-amber-700',
    count: 'text-amber-700 dark:text-amber-300',
  },
  minor: {
    label: 'Minor',
    description: 'Annoyance or best-practice gap',
    badge:
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
    active:
      'bg-blue-50 border-blue-400 dark:bg-blue-900/30 dark:border-blue-700',
    count: 'text-blue-700 dark:text-blue-300',
  },
};
