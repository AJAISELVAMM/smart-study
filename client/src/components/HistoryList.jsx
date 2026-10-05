import { useEffect, useState } from 'react';
import { BookOpen, Clock3, LoaderCircle, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api.js';
import { useStudy } from '../context/StudyContext.jsx';
import { formatDate, isThisWeek, isToday } from '../utils/helpers.js';
import ErrorBanner from './ErrorBanner.jsx';

const PAGE_SIZE = 40;

export default function HistoryList() {
  const navigate = useNavigate();
  const { activeSession, setActiveSession } = useStudy();
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState('');

  async function refresh(search = query) {
    setLoading(true);
    try {
      const response = await api.get('/history', { params: { q: search, limit: PAGE_SIZE, offset: 0 } });
      const data = response.data.data;
      setEntries(data.sessions || []);
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? null);
      setError('');
    } catch (requestError) {
      setError(await getErrorMessage(requestError));
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => refresh(query), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function loadMore() {
    if (loadingMore || !hasMore || nextOffset == null) return;
    setLoadingMore(true);
    try {
      const response = await api.get('/history', { params: { q: query, limit: PAGE_SIZE, offset: nextOffset } });
      const data = response.data.data;
      setEntries((current) => [...current, ...(data.sessions || [])]);
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? null);
      setError('');
    } catch (requestError) { setError(await getErrorMessage(requestError)); }
    finally { setLoadingMore(false); }
  }

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'Today') return isToday(entry.createdAt);
    if (filter === 'This Week') return isThisWeek(entry.createdAt);
    if (filter === 'Older') return !isThisWeek(entry.createdAt);
    return true;
  });

  async function openEntry(id) {
    setOpeningId(id);
    setError('');
    try {
      const response = await api.get(`/history/${id}`);
      setActiveSession(response.data.data);
      navigate('/');
    } catch (requestError) {
      setError(await getErrorMessage(requestError));
    } finally { setOpeningId(null); }
  }

  async function deleteEntry(id) {
    try {
      await api.delete(`/history/${id}`);
      if (String(activeSession?.id || activeSession?.sessionId) === String(id)) setActiveSession(null);
      setConfirmId(null);
      await refresh(query);
    } catch (requestError) { setError(await getErrorMessage(requestError)); }
  }

  async function clearAll() {
    try {
      await api.delete('/history');
      setConfirmClear(false);
      setEntries([]);
      setHasMore(false);
      setNextOffset(null);
      setActiveSession(null);
    } catch (requestError) { setError(await getErrorMessage(requestError)); }
  }

  return (
    <div className="history-content">
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      <div className="history-tools">
        <label className="search-field"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by document or learning mode…" aria-label="Search study history" /></label>
        <label className="filter-select"><span>Filter</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Today</option><option>This Week</option><option>Older</option></select></label>
      </div>
      {loading ? <div className="history-loading"><LoaderCircle size={21} className="spin" /> Loading saved sessions…</div> : filteredEntries.length ? (
        <div className="history-list">
          {filteredEntries.map((entry) => (
            <article className="history-card panel" key={entry.id}>
              <div className="history-book-icon"><BookOpen size={20} /></div>
              <div className="history-card-main">
                <h3>{entry.documentName || 'Study material'}</h3>
                <div className="history-card-meta"><span>{entry.learningMode || 'Standard'}</span><span className="meta-separator">·</span><span><Clock3 size={13} /> {formatDate(entry.createdAt)}</span>{entry.sourceType && <><span className="meta-separator">·</span><span className="source-type">{entry.sourceType.toUpperCase()}</span></>}</div>
                {confirmId === entry.id ? (
                  <div className="confirm-row"><span>Delete this saved session? This cannot be undone.</span><button className="button button-danger button-small" type="button" onClick={() => deleteEntry(entry.id)}>Confirm delete</button><button className="text-button" type="button" onClick={() => setConfirmId(null)}>Cancel</button></div>
                ) : <div className="history-card-actions"><button className="button button-secondary button-small" type="button" onClick={() => openEntry(entry.id)} disabled={openingId === entry.id}>{openingId === entry.id ? <LoaderCircle size={15} className="spin" /> : null}{openingId === entry.id ? 'Opening…' : 'Open Study Kit'}</button><button className="icon-button danger" type="button" aria-label={`Delete ${entry.documentName}`} onClick={() => setConfirmId(entry.id)}><Trash2 size={16} /></button></div>}
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty-history panel"><span className="empty-history-icon"><Clock3 size={22} /></span><h3>{entries.length ? 'No sessions match these filters' : 'No study sessions yet'}</h3><p>{entries.length ? 'Try a different search or date filter.' : 'Generate your first Study Kit to see it here.'}</p></div>}
      {!loading && hasMore && <div className="load-more-row"><button type="button" className="button button-secondary" onClick={loadMore} disabled={loadingMore}>{loadingMore ? <LoaderCircle size={15} className="spin" /> : null}{loadingMore ? 'Loading…' : 'Load older sessions'}</button></div>}
      {entries.length > 0 && <div className="history-clear-row">
        {confirmClear ? <div className="confirm-clear"><span>Clear all saved sessions? This cannot be undone.</span><button className="button button-danger button-small" type="button" onClick={clearAll}>Confirm clear</button><button type="button" className="text-button" onClick={() => setConfirmClear(false)}>Cancel</button></div>
          : <button type="button" className="text-button danger-text" onClick={() => setConfirmClear(true)}><Trash2 size={15} /> Clear all history</button>}
      </div>}
    </div>
  );
}
