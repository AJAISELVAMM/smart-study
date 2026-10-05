import { useMemo, useState } from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';
import ContentText from './ContentText.jsx';
import DownloadButton from './DownloadButton.jsx';

function questionGroup(item) {
  const type = String(item.type || '').toLowerCase();
  if (type.includes('short')) return 'Short Answer';
  if (type.includes('long')) return 'Long Answer';
  return 'Important Questions';
}

export default function ExamQuestions({ studyKit, sessionId }) {
  const [filter, setFilter] = useState('All');
  const questions = useMemo(() => studyKit?.exam_questions || [], [studyKit]);
  const visible = filter === 'All' ? questions : questions.filter((item) => questionGroup(item) === filter);
  const filters = ['All', 'Short Answer', 'Long Answer', 'Important Questions'];

  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <div><span className="section-kicker">EXAM PRACTICE</span><h2>Exam Questions</h2><p className="muted">Practice with source-grounded questions and expand to review answers.</p></div>
        <DownloadButton sessionId={sessionId} type="questions" label="Download Questions PDF" />
      </div>
      <div className="filter-pills" role="group" aria-label="Filter questions by type">
        {filters.map((item) => <button key={item} className={filter === item ? 'filter-pill active' : 'filter-pill'} type="button" onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      <div className="question-count">{visible.length} practice question{visible.length === 1 ? '' : 's'}</div>
      {visible.length ? <div className="question-list">
        {visible.map((item, index) => (
          <details className="question-card panel" key={`${item.question}-${index}`}>
            <summary>
              <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="question-summary-main"><span className="question-badges"><span className="type-pill">{item.type || questionGroup(item)}</span>{item.marks > 0 && <span className="marks-pill">{item.marks} marks</span>}{item.difficulty && <span className="difficulty-pill">{item.difficulty}</span>}</span><strong>{item.question}</strong></span>
              <ChevronDown className="question-chevron" size={18} />
            </summary>
            <div className="question-answer">
              {item.topic && <span className="topic-pill">{item.topic}</span>}
              <h4>Answer / Explanation</h4>
              {item.answer ? <ContentText text={item.answer} /> : <p className="muted">No answer was supplied.</p>}
              {item.explanation && item.explanation !== item.answer && <><h4>Explanation</h4><ContentText text={item.explanation} /></>}
            </div>
          </details>
        ))}
      </div> : <div className="empty-state-small"><CircleHelp size={22} /><p>{questions.length ? 'No questions in this category.' : 'No exam questions were returned.'}</p></div>}
    </div>
  );
}
