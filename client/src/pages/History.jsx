import { Clock3 } from 'lucide-react';
import Header from '../components/Header.jsx';
import HistoryList from '../components/HistoryList.jsx';

export default function History() {
  return (
    <div className="page history-page">
      <Header eyebrow="YOUR SAVED LEARNING SESSIONS" title="Study History" subtitle="Search, reopen, or remove your saved Study Kits." action={<span className="header-count-icon"><Clock3 size={20} /></span>} />
      <HistoryList />
    </div>
  );
}
