import { Sparkles } from 'lucide-react';

export default function Header({ eyebrow = 'YOUR PERSONAL LEARNING WORKSPACE', title, subtitle, action }) {
  return (
    <header className="page-header">
      <div className="header-copy">
        <div className="eyebrow"><Sparkles size={13} /> {eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="header-action">{action}</div>}
    </header>
  );
}
