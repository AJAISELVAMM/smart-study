import { Fragment } from 'react';

function inlineNodes(line, keyPrefix) {
  const pieces = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((part) => part !== '');
  return pieces.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export default function ContentText({ text, className = '' }) {
  const lines = String(text || '').split(/\r?\n/);
  return (
    <div className={`content-text ${className}`}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div className="content-spacer" key={`spacer-${index}`} />;
        const bullet = line.match(/^(?:[-*•])\s+(.+)$/);
        if (bullet) return <div className="content-bullet" key={`line-${index}`}><span>•</span><span>{inlineNodes(bullet[1], `line-${index}`)}</span></div>;
        const heading = line.match(/^#{1,3}\s+(.+)$/);
        if (heading) return <h4 className="content-subheading" key={`line-${index}`}>{inlineNodes(heading[1], `line-${index}`)}</h4>;
        return <p key={`line-${index}`}>{inlineNodes(line, `line-${index}`)}</p>;
      })}
    </div>
  );
}
