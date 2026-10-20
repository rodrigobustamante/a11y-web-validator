import type { A11yIssue, ImpactLevel } from '@a11y-web-validator/types';

/**
 * Impact levels ordered from most to least severe
 */
export const IMPACT_ORDER: readonly ImpactLevel[] = [
  'critical',
  'serious',
  'moderate',
  'minor',
];

export interface IssueFilters {
  /** Impact levels to include; an empty set includes none */
  impacts: ReadonlySet<ImpactLevel>;
  /** Free-text query matched against rule id, help and description */
  query: string;
}

export interface IssueGroup {
  impact: ImpactLevel;
  issues: A11yIssue[];
}

/**
 * Filter issues by impact level and a case-insensitive text query
 */
export function filterIssues(
  issues: readonly A11yIssue[],
  { impacts, query }: IssueFilters
): A11yIssue[] {
  const needle = query.trim().toLowerCase();

  return issues.filter((issue) => {
    if (!impacts.has(issue.impact)) return false;
    if (!needle) return true;

    return [issue.id, issue.help, issue.description].some((field) =>
      field.toLowerCase().includes(needle)
    );
  });
}

/**
 * Group issues by impact level, ordered by severity, skipping empty groups
 */
export function groupIssuesByImpact(
  issues: readonly A11yIssue[]
): IssueGroup[] {
  return IMPACT_ORDER.map((impact) => ({
    impact,
    issues: issues.filter((issue) => issue.impact === impact),
  })).filter((group) => group.issues.length > 0);
}

/**
 * Count the affected DOM nodes across a list of issues
 */
export function countAffectedNodes(issues: readonly A11yIssue[]): number {
  return issues.reduce((total, issue) => total + issue.nodes.length, 0);
}

/**
 * Extract the WCAG success criteria referenced by axe tags (e.g. 'wcag143' -> '1.4.3')
 */
export function getWcagCriteria(tags: readonly string[]): string[] {
  return tags
    .map((tag) => /^wcag(\d)(\d)(\d+)$/.exec(tag))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(([, principle, guideline, criterion]) =>
      [principle, guideline, criterion].join('.')
    );
}

/**
 * Pluralize a simple English noun based on a count
 */
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
