import clsx from 'clsx';
import type { ImpactLevel, IssuesByImpact } from '@a11y-web-validator/types';
import { IMPACT_ORDER, pluralize } from '@/lib/issues';
import { IMPACT_STYLES } from './impact-styles';

interface ImpactFilterProps {
  counts: IssuesByImpact;
  selected: ReadonlySet<ImpactLevel>;
  onToggle: (impact: ImpactLevel) => void;
}

/**
 * Impact summary cards that double as filter toggles
 */
export function ImpactFilter({
  counts,
  selected,
  onToggle,
}: ImpactFilterProps) {
  return (
    <fieldset>
      <legend className="sr-only">Filter issues by impact level</legend>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {IMPACT_ORDER.map((impact) => {
          const style = IMPACT_STYLES[impact];
          const isSelected = selected.has(impact);

          return (
            <button
              key={impact}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${style.label}: ${pluralize(counts[impact], 'issue')}`}
              aria-describedby={`impact-${impact}-description`}
              onClick={() => onToggle(impact)}
              className={clsx(
                'rounded-lg border-2 p-4 text-center transition-colors focus-ring',
                isSelected
                  ? style.active
                  : // Dashed border marks the off state; no opacity so text keeps AA contrast
                    'border-dashed border-gray-400 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-dark-card dark:hover:bg-white/5'
              )}
            >
              <span
                className={clsx(
                  'block text-3xl font-bold',
                  isSelected ? style.count : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {counts[impact]}
              </span>
              <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                {style.label}
              </span>
              <span
                id={`impact-${impact}-description`}
                className="block text-xs text-gray-600 dark:text-gray-400"
              >
                {style.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
