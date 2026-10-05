import { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

export default function Glossary({ studyKit, sessionId }) {
  const [query, setQuery] = useState('');
  const terms = useMemo(() => {
    const list = studyKit?.glossary || [];
    const needle = query.trim().toLocaleLowerCase();
    return [...list].sort((a, b) => String(a.term).localeCompare(String(b.term))).filter((item) => !needle
      || `${item.term} ${item.meaning} ${item.example || ''}`.toLocaleLowerCase().includes(needle));
  }, [studyKit, query]);

  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <div><span className="section-kicker">KEY TERMINOLOGY</span><h2>Glossary</h2><p className="muted">Important terms explained in accessible language.</p></div>
        <DownloadButton sessionId={sessionId} type="glossary" label="Download Glossary PDF" />
      </div>
      <label className="search-field glossary-search"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search terms or meanings…" aria-label="Search glossary terms" /></label>
      {terms.length ? <div className="glossary-grid">
        {terms.map((item, index) => (
          <article className="glossary-card panel" key={`${item.term}-${index}`}>
            <div className="glossary-term-row"><h3>{item.term}</h3><span className="term-spark"><Sparkles size={14} /></span></div>
            <p>{item.meaning}</p>
            {item.example && <div className="glossary-example"><strong>Context / example</strong><span>{item.example}</span></div>}
          </article>
        ))}
      </div> : <div className="empty-inline">{query ? 'No terms match that search.' : 'No glossary terms were returned.'}</div>}
    </div>
  );
}
