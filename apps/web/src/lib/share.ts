import type { A11yIssue } from '@a11y-web-validator/types';
import { getWcagCriteria } from './issues';

/** Maximum affected elements included when sharing a single issue */
export const MAX_SHARED_NODES = 10;

export interface ShareContext {
  /** URL of the audited page */
  pageUrl: string;
  /** ISO timestamp of the scan */
  scannedAt: string;
}

// CommonMark treats a lone \r as a line ending too, so normalize before splitting
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function longestBacktickRun(text: string): number {
  return Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
}

/**
 * Wrap text in a code span whose delimiter is longer than any backtick run
 * inside it, so untrusted page content cannot break out of the span
 */
export function inlineCode(text: string): string {
  const flat = normalizeNewlines(text).replace(/\n/g, ' ');
  if (flat === '') return '';
  const ticks = '`'.repeat(longestBacktickRun(flat) + 1);
  // CommonMark strips one space from each side when both are present, and a
  // leading/trailing backtick would merge with the delimiter
  const needsPad =
    /^`|`$/.test(flat) || (/^ .*[^ ].* $/.test(flat) && flat.length > 1);
  const pad = needsPad ? ' ' : '';
  return `${ticks}${pad}${flat}${pad}${ticks}`;
}

/**
 * Fenced code block whose fence is longer than any backtick run in the text
 */
export function codeBlock(text: string, language = ''): string {
  const body = normalizeNewlines(text);
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(body) + 1));
  return `${fence}${language}\n${body}\n${fence}`;
}

const HTML_TAG = /<\/?[a-zA-Z][^<>]*>/g;
const MARKDOWN_SPECIAL = /[\\`*_[\]<>&#|~]/g;

function escapePlain(text: string): string {
  return text.replace(MARKDOWN_SPECIAL, (char) => `\\${char}`);
}

/**
 * Make prose safe to paste as Markdown: tag names quoted by axe (e.g.
 * "<html> element must have a lang attribute") become code spans, and every
 * other Markdown or HTML control character is backslash-escaped
 */
export function escapeMarkdownText(text: string): string {
  const flat = normalizeNewlines(text).replace(/\n+/g, ' ');
  let result = '';
  let lastIndex = 0;
  for (const match of flat.matchAll(HTML_TAG)) {
    result +=
      escapePlain(flat.slice(lastIndex, match.index)) + inlineCode(match[0]);
    lastIndex = (match.index ?? 0) + match[0].length;
  }
  return result + escapePlain(flat.slice(lastIndex));
}

/**
 * Autolink a URL so query characters like [ ] ( ) _ * stay literal
 */
export function markdownUrl(url: string): string {
  return /^[^\s<>]+$/.test(url) ? `<${url}>` : inlineCode(url);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Format a single issue as Markdown, ready to paste into a ticket or chat
 */
export function formatIssueAsMarkdown(
  issue: A11yIssue,
  { pageUrl, scannedAt }: ShareContext
): string {
  const criteria = getWcagCriteria(issue.tags);
  const shownNodes = issue.nodes.slice(0, MAX_SHARED_NODES);
  const hiddenCount = issue.nodes.length - shownNodes.length;

  const lines = [
    `### [${capitalize(issue.impact)}] ${escapeMarkdownText(issue.help)}`,
    '',
    escapeMarkdownText(issue.description),
    '',
    `- **Rule:** ${inlineCode(issue.id)}`,
    ...(criteria.length > 0
      ? [`- **WCAG:** ${criteria.map((c) => `SC ${c}`).join(', ')}`]
      : []),
    `- **Page:** ${markdownUrl(pageUrl)}`,
    `- **Scanned:** ${escapeMarkdownText(scannedAt)}`,
    `- **How to fix:** ${markdownUrl(issue.helpUrl)}`,
    '',
    `**Affected elements (${issue.nodes.length}):**`,
  ];

  shownNodes.forEach((node, index) => {
    const marker = `${index + 1}. `;
    // Indent the fence to the marker width so it stays inside the list item
    const indent = ' '.repeat(marker.length);
    lines.push('');
    lines.push(
      marker +
        (node.target.length > 0 ? inlineCode(node.target.join(' ')) : 'Element')
    );
    lines.push('');
    lines.push(
      ...codeBlock(node.html, 'html')
        .split('\n')
        .map((line) => indent + line)
    );
  });

  if (hiddenCount > 0) {
    lines.push('');
    lines.push(
      `…and ${hiddenCount} more element${hiddenCount === 1 ? '' : 's'}.`
    );
  }

  return `${lines.join('\n')}\n`;
}
