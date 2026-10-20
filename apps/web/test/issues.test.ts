import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { A11yIssue, ImpactLevel } from '@a11y-web-validator/types';
import {
  IMPACT_ORDER,
  countAffectedNodes,
  filterIssues,
  getWcagCriteria,
  groupIssuesByImpact,
  pluralize,
} from '../src/lib/issues';

function makeIssue(
  id: string,
  impact: ImpactLevel,
  overrides: Partial<A11yIssue> = {}
): A11yIssue {
  return {
    id,
    impact,
    description: `Description for ${id}`,
    help: `Help for ${id}`,
    helpUrl: `https://dequeuniversity.com/rules/axe/4.8/${id}`,
    tags: [],
    nodes: [{ html: '<div></div>', target: ['div'], failureSummary: '' }],
    ...overrides,
  };
}

const issues = [
  makeIssue('image-alt', 'critical'),
  makeIssue('color-contrast', 'serious', {
    help: 'Elements must meet minimum color contrast ratio thresholds',
  }),
  makeIssue('region', 'moderate'),
  makeIssue('landmark-one-main', 'moderate'),
];

const allImpacts = new Set(IMPACT_ORDER);

describe('filterIssues', () => {
  it('returns every issue when all impacts are selected and query is empty', () => {
    assert.equal(
      filterIssues(issues, { impacts: allImpacts, query: '' }).length,
      4
    );
  });

  it('keeps only the selected impact levels', () => {
    const result = filterIssues(issues, {
      impacts: new Set<ImpactLevel>(['moderate']),
      query: '',
    });
    assert.deepEqual(
      result.map((issue) => issue.id),
      ['region', 'landmark-one-main']
    );
  });

  it('returns nothing when no impact is selected', () => {
    assert.equal(
      filterIssues(issues, { impacts: new Set(), query: '' }).length,
      0
    );
  });

  it('matches the query case-insensitively against help text', () => {
    const result = filterIssues(issues, {
      impacts: allImpacts,
      query: '  CONTRAST ',
    });
    assert.deepEqual(
      result.map((issue) => issue.id),
      ['color-contrast']
    );
  });

  it('matches the query against the rule id', () => {
    const result = filterIssues(issues, {
      impacts: allImpacts,
      query: 'landmark',
    });
    assert.deepEqual(
      result.map((issue) => issue.id),
      ['landmark-one-main']
    );
  });

  it('combines the impact filter and the query', () => {
    const result = filterIssues(issues, {
      impacts: new Set<ImpactLevel>(['critical']),
      query: 'contrast',
    });
    assert.equal(result.length, 0);
  });
});

describe('groupIssuesByImpact', () => {
  it('orders groups by severity and skips empty levels', () => {
    const groups = groupIssuesByImpact([...issues].reverse());
    assert.deepEqual(
      groups.map((group) => group.impact),
      ['critical', 'serious', 'moderate']
    );
    assert.equal(groups[2].issues.length, 2);
  });

  it('returns no groups for an empty list', () => {
    assert.deepEqual(groupIssuesByImpact([]), []);
  });
});

describe('countAffectedNodes', () => {
  it('sums nodes across issues', () => {
    const node = { html: '<a></a>', target: ['a'], failureSummary: '' };
    const withNodes = makeIssue('link-name', 'serious', {
      nodes: [node, node, node],
    });
    assert.equal(countAffectedNodes([withNodes, ...issues]), 7);
  });
});

describe('getWcagCriteria', () => {
  it('extracts success criteria from axe tags', () => {
    assert.deepEqual(
      getWcagCriteria([
        'cat.color',
        'wcag2aa',
        'wcag143',
        'wcag1410',
        'best-practice',
      ]),
      ['1.4.3', '1.4.10']
    );
  });
});

describe('pluralize', () => {
  it('handles singular and plural counts', () => {
    assert.equal(pluralize(1, 'element'), '1 element');
    assert.equal(pluralize(0, 'element'), '0 elements');
    assert.equal(pluralize(3, 'element'), '3 elements');
  });
});
