import * as Accordion from '@radix-ui/react-accordion';
import clsx from 'clsx';
import { IMPACT_ORDER, pluralize, type IssueGroup } from '@/lib/issues';
import type { ShareContext } from '@/lib/share';
import { IMPACT_STYLES } from './impact-styles';
import { IssueItem } from './IssueItem';

interface IssueGroupsProps {
  groups: IssueGroup[];
  shareContext: ShareContext;
}

/**
 * Issues grouped by impact level; every group starts expanded and each issue
 * is a nested accordion item so long reports stay scannable
 */
export function IssueGroups({ groups, shareContext }: IssueGroupsProps) {
  return (
    <Accordion.Root
      type="multiple"
      defaultValue={[...IMPACT_ORDER]}
      className="space-y-4"
    >
      {groups.map(({ impact, issues }) => {
        const style = IMPACT_STYLES[impact];

        return (
          <Accordion.Item key={impact} value={impact} className="card p-0">
            <Accordion.Header asChild>
              <h3>
                <Accordion.Trigger className="group flex w-full items-center gap-3 rounded-lg p-4 text-left focus-ring">
                  <span
                    className={clsx(
                      'h-3 w-3 shrink-0 rounded-full border',
                      style.badge
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {style.label}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pluralize(issues.length, 'issue')}
                  </span>
                  <svg
                    className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-data-[state=open]:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Accordion.Trigger>
              </h3>
            </Accordion.Header>
            {/* forceMount keeps nested open/closed state when a group collapses */}
            <Accordion.Content
              forceMount
              className="px-4 pb-4 data-[state=closed]:hidden"
            >
              <Accordion.Root type="multiple" className="space-y-3">
                {issues.map((issue) => (
                  <IssueItem
                    key={issue.id}
                    issue={issue}
                    shareContext={shareContext}
                  />
                ))}
              </Accordion.Root>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
