import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';

// Register only the HTML grammar to keep the client bundle small
SyntaxHighlighter.registerLanguage('xml', xml);

interface CodeSnippetProps {
  code: string;
}

/**
 * Highlighted HTML snippet; token colors come from the .hljs-* rules in
 * globals.css so they follow the active light/dark theme. Long lines wrap
 * instead of scrolling, so the snippet never needs keyboard scrolling.
 */
export function CodeSnippet({ code }: CodeSnippetProps) {
  return (
    <SyntaxHighlighter
      language="xml"
      useInlineStyles={false}
      wrapLongLines
      className="code-snippet"
    >
      {code}
    </SyntaxHighlighter>
  );
}
