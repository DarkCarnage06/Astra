'use client';

import React from 'react';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  // Helper to parse inline styles (bold, italic, gold highlight)
  const parseInline = (text: string): React.ReactNode[] => {
    // Replace markdown bold/italic
    // We will do a simple regex-based tokenization for inline formatting
    const tokens: React.ReactNode[] = [];
    let remaining = text;

    // Matches **bold** or *italic* or _italic_ or gold highlight words
    // Let's do a simple character loop or regex split
    const regex = /(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)/g;
    const parts = remaining.split(regex);

    parts.forEach((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        tokens.push(<strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>);
      } else if (part.startsWith('*') && part.endsWith('*')) {
        tokens.push(<em key={idx} className="italic text-[#B8BCC8]">{part.slice(1, -1)}</em>);
      } else if (part.startsWith('__') && part.endsWith('__')) {
        tokens.push(<strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>);
      } else if (part.startsWith('_') && part.endsWith('_')) {
        tokens.push(<em key={idx} className="italic text-[#B8BCC8]">{part.slice(1, -1)}</em>);
      } else {
        // Highlight certain Vedic/Astrology words in gold for premium feel
        const words = part.split(' ');
        const wordNodes: React.ReactNode[] = [];
        words.forEach((word, wIdx) => {
          const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
          const isVedic = [
            'Dasha', 'Mahadasha', 'Antardasha', 'Rahu', 'Ketu', 'Saturn', 'Jupiter', 'Vedic', 
            'Lagna', 'Nakshatra', 'Yoga', 'Yogas', 'Dosha', 'Doshas', 'Astra', 'Vimshottari'
          ].includes(cleanWord);

          if (isVedic) {
            wordNodes.push(<span key={wIdx} className="text-[#D4AF37] font-semibold">{word}</span>);
          } else {
            wordNodes.push(word);
          }
          if (wIdx < words.length - 1) {
            wordNodes.push(' ');
          }
        });
        tokens.push(<span key={idx}>{wordNodes}</span>);
      }
    });

    return tokens;
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // 1. Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="font-display text-2xl font-bold tracking-tight text-white mb-4 mt-6 border-b border-white/5 pb-2">
          {parseInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="font-display text-xl font-semibold tracking-tight text-white mb-3 mt-5">
          {parseInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="font-display text-lg font-medium text-white mb-2 mt-4">
          {parseInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // 2. Blockquotes
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={i} className="border-l-4 border-[#D4AF37] bg-white/[0.02] pl-4 pr-2 py-3 rounded-r-xl my-4 text-sm leading-6 text-[#B8BCC8] italic">
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{parseInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 3. Bullet lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc pl-6 space-y-2 my-4 text-sm leading-6 text-[#B8BCC8]">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 4. Numbered lists
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemLine = lines[i].trim();
        const contentStartIdx = itemLine.indexOf(' ') + 1;
        listItems.push(itemLine.slice(contentStartIdx));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal pl-6 space-y-2 my-4 text-sm leading-6 text-[#B8BCC8]">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 5. Tables
    if (line.startsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const r = lines[i].trim();
        // Check if it's the separator row: |---|---|
        if (r.includes('---')) {
          // skip header separator
        } else {
          // Parse columns
          const cols = r.split('|').map((col) => col.trim()).filter((col, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableRows.push(cols);
        }
        i++;
      }

      const headers = tableRows[0] || [];
      const bodyRows = tableRows.slice(1);

      elements.push(
        <div key={i} className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-black/20">
          <table className="min-w-full divide-y divide-white/10 text-xs">
            {headers.length > 0 && (
              <thead className="bg-white/5">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-4 py-3 text-left font-semibold text-white uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-white/5">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                  {row.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-[#B8BCC8]">
                      {parseInline(col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 6. Normal Paragraph
    elements.push(
      <p key={i} className="text-sm leading-7 text-[#B8BCC8] mb-4 last:mb-0">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-4 max-w-none text-left tracking-normal font-normal">{elements}</div>;
}
