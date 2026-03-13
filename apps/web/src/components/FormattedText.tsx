import React from "react";

/**
 * Renders text with basic inline formatting:
 *   **bold**  →  <strong>bold</strong>
 *   *italic*  →  <em>italic</em>
 *
 * Preserves whitespace/newlines via the parent's whitespace-pre-wrap.
 */
export function FormattedText({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{parseInlineFormatting(text)}</span>;
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Match **bold** or *italic* (bold first so ** isn't consumed by *)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      nodes.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      nodes.push(<em key={match.index}>{match[3]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
