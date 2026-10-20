import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { A11yIssue } from '@a11y-web-validator/types';
import {
  MAX_SHARED_NODES,
  codeBlock,
  escapeMarkdownText,
  formatIssueAsMarkdown,
  inlineCode,
  markdownUrl,
} from '../src/lib/share';

const context = {
  pageUrl: 'https://example.org/',
  scannedAt: '2026-10-20T12:00:00.000Z',
};

function makeIssue(overrides: Partial<A11yIssue> = {}): A11yIssue {
  return {
    id: 'image-alt',
    impact: 'critical',
    description: 'Ensure <img> elements have alternative text',
    help: 'Images must have alternative text',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/image-alt',
    tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
    nodes: [
      {
        html: '<img src="logo.png">',
        target: ['header > img'],
        failureSummary: 'Element does not have an alt attribute',
      },
    ],
    ...overrides,
  };
}

describe('inlineCode', () => {
  it('wraps plain text in single backticks', () => {
    assert.equal(inlineCode('div > a'), '`div > a`');
  });

  it('uses a longer delimiter when the text contains backticks', () => {
    assert.equal(inlineCode('a`b'), '``a`b``');
  });

  it('pads content that starts or ends with a backtick', () => {
    assert.equal(inlineCode('`x'), '`` `x ``');
  });
});

describe('inlineCode edge cases', () => {
  it('flattens line breaks, including a lone carriage return', () => {
    assert.equal(inlineCode('a\rb\nc'), '`a b c`');
  });

  it('pads text that starts and ends with a space', () => {
    assert.equal(inlineCode(' a '), '`  a  `');
  });
});

describe('escapeMarkdownText', () => {
  it('turns tag names quoted by axe into code spans', () => {
    assert.equal(
      escapeMarkdownText('<html> element must have a lang attribute'),
      '`<html>` element must have a lang attribute'
    );
    assert.equal(
      escapeMarkdownText('<li> elements must be contained in a <ul> or <ol>'),
      '`<li>` elements must be contained in a `<ul>` or `<ol>`'
    );
  });

  it('escapes link, emphasis and HTML syntax', () => {
    assert.equal(
      escapeMarkdownText('[Login](https://evil.example) *x* _y_ a < b & c'),
      '\\[Login\\](https://evil.example) \\*x\\* \\_y\\_ a \\< b \\& c'
    );
  });

  it('keeps everything on one line', () => {
    assert.equal(escapeMarkdownText('a\r\n# b\rc'), 'a \\# b c');
  });
});

describe('markdownUrl', () => {
  it('autolinks URLs so query syntax stays literal', () => {
    assert.equal(
      markdownUrl('https://site.com/?q=[Login](https://evil.example)'),
      '<https://site.com/?q=[Login](https://evil.example)>'
    );
  });

  it('falls back to a code span when the URL cannot be autolinked', () => {
    assert.equal(markdownUrl('not a url'), '`not a url`');
  });
});

describe('codeBlock', () => {
  it('uses a triple-backtick fence by default', () => {
    assert.equal(codeBlock('<a></a>', 'html'), '```html\n<a></a>\n```');
  });

  it('normalizes carriage returns so no line escapes the fence', () => {
    assert.equal(codeBlock('a\rb\r\nc'), '```\na\nb\nc\n```');
  });

  it('lengthens the fence so embedded fences cannot close it', () => {
    assert.equal(codeBlock('```\nx', 'html'), '````html\n```\nx\n````');
  });
});

describe('formatIssueAsMarkdown', () => {
  it('keeps a carriage-return payload indented inside the list item', () => {
    const html = '<a title="x\r[Reset](https://evil.example)">';
    const markdown = formatIssueAsMarkdown(
      makeIssue({ nodes: [{ html, target: ['a'], failureSummary: '' }] }),
      context
    );
    assert.ok(!markdown.includes('\r'));
    assert.match(markdown, /\n   \[Reset\]\(https:\/\/evil\.example\)">\n/);
  });

  it('includes impact, rule, WCAG criteria, page and fix link', () => {
    const markdown = formatIssueAsMarkdown(makeIssue(), context);

    assert.match(
      markdown,
      /^### \[Critical\] Images must have alternative text\n/
    );
    assert.match(markdown, /- \*\*Rule:\*\* `image-alt`/);
    assert.match(markdown, /- \*\*WCAG:\*\* SC 1\.1\.1/);
    assert.match(markdown, /- \*\*Page:\*\* <https:\/\/example\.org\/>/);
    assert.match(markdown, /- \*\*Scanned:\*\* 2026-10-20T12:00:00\.000Z/);
    assert.match(
      markdown,
      /- \*\*How to fix:\*\* <https:\/\/dequeuniversity\.com/
    );
  });

  it('lists each affected element with its selector and HTML', () => {
    const markdown = formatIssueAsMarkdown(makeIssue(), context);

    assert.match(markdown, /\*\*Affected elements \(1\):\*\*/);
    assert.match(
      markdown,
      /1\. `header > img`\n\n   ```html\n   <img src="logo\.png">\n   ```/
    );
    assert.ok(markdown.endsWith('```\n'));
  });

  it('omits the WCAG line for best-practice rules', () => {
    const markdown = formatIssueAsMarkdown(
      makeIssue({ tags: ['best-practice'] }),
      context
    );
    assert.doesNotMatch(markdown, /WCAG/);
  });

  it('indents fences to the marker width for two-digit items', () => {
    const nodes = Array.from({ length: 10 }, (_, i) => ({
      html: `<b>${i}</b>`,
      target: ['b'],
      failureSummary: '',
    }));
    const markdown = formatIssueAsMarkdown(makeIssue({ nodes }), context);
    assert.match(markdown, /10\. `b`\n\n    ```html\n    <b>9<\/b>\n    ```/);
  });

  it(`caps the list at ${MAX_SHARED_NODES} elements and reports the rest`, () => {
    const nodes = Array.from({ length: MAX_SHARED_NODES + 3 }, (_, i) => ({
      html: `<span>${i}</span>`,
      target: [`span:nth-child(${i + 1})`],
      failureSummary: '',
    }));
    const markdown = formatIssueAsMarkdown(makeIssue({ nodes }), context);

    assert.match(markdown, /\*\*Affected elements \(13\):\*\*/);
    assert.match(markdown, new RegExp(`${MAX_SHARED_NODES}\\. `));
    assert.doesNotMatch(markdown, new RegExp(`${MAX_SHARED_NODES + 1}\\. `));
    assert.match(markdown, /…and 3 more elements\.\n$/);
  });

  it('keeps hostile HTML inside its code fence', () => {
    const html = '<div title="```">\n# not a heading</div>';
    const markdown = formatIssueAsMarkdown(
      makeIssue({ nodes: [{ html, target: ['div'], failureSummary: '' }] }),
      context
    );
    const indented = ['````html', ...html.split('\n'), '````']
      .map((line) => `   ${line}`)
      .join('\n');
    assert.ok(markdown.includes(indented));
  });
});
