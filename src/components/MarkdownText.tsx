import React from 'react';

function renderInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-[#183B2B]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const MarkdownText: React.FC<{content: string}> = ({content}) => {
  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: {ordered: boolean; items: string[]} | null = null;

  const flushList = (keyPrefix: string) => {
    if (!listItems) return;
    if (listItems.ordered) {
      blocks.push(
        <ol key={keyPrefix} className="list-decimal pl-6 space-y-2 text-[#183B2B]/90 leading-relaxed">
          {listItems.items.map((item, i) => (
            <li key={i}>{renderInlineBold(item)}</li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul key={keyPrefix} className="list-disc pl-6 space-y-2 text-[#183B2B]/90 leading-relaxed">
          {listItems.items.map((item, i) => (
            <li key={i}>{renderInlineBold(item)}</li>
          ))}
        </ul>
      );
    }
    listItems = null;
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(`list-end-${index}`);
      return;
    }

    if (line.startsWith('## ')) {
      flushList(`list-h2-${index}`);
      blocks.push(
        <h2 key={`h2-${index}`} className="font-display text-xl font-bold text-[#183B2B] pt-3">
          {line.slice(3)}
        </h2>
      );
      return;
    }

    if (line.startsWith('### ')) {
      flushList(`list-h3-${index}`);
      blocks.push(
        <h3 key={`h3-${index}`} className="font-display text-lg font-semibold text-[#183B2B] pt-2">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listItems && listItems.ordered) flushList(`list-sw-${index}`);
      if (!listItems) listItems = {ordered: false, items: []};
      listItems.items.push(line.slice(2));
      return;
    }

    const numMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (listItems && !listItems.ordered) flushList(`list-sw-${index}`);
      if (!listItems) listItems = {ordered: true, items: []};
      listItems.items.push(numMatch[1]);
      return;
    }

    flushList(`list-p-${index}`);
    blocks.push(
      <p key={`p-${index}`} className="text-[#183B2B]/90 leading-relaxed">
        {renderInlineBold(line)}
      </p>
    );
  });

  flushList('list-final');

  return <div className="space-y-3">{blocks}</div>;
};
