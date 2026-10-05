import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Shuffle } from 'lucide-react';
import ContentText from './ContentText.jsx';
import DownloadButton from './DownloadButton.jsx';

function shuffled(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export default function Flashcards({ studyKit, sessionId }) {
  const cards = useMemo(() => studyKit?.flashcards || [], [studyKit]);
  const [order, setOrder] = useState(() => cards.map((_, index) => index));
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setOrder(cards.map((_, index) => index));
    setCurrent(0);
    setShowAnswer(false);
  }, [sessionId, cards]);

  function changeCard(nextIndex) {
    setCurrent((nextIndex + order.length) % order.length);
    setShowAnswer(false);
  }

  const card = cards.length ? cards[order[current]] : null;

  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <div><span className="section-kicker">ACTIVE RECALL</span><h2>Flashcards</h2><p className="muted">Try to recall the answer before revealing it.</p></div>
        <DownloadButton sessionId={sessionId} type="flashcards" label="Download Flashcards PDF" />
      </div>
      {card ? (
        <div className="flashcard-wrap">
          <div className="flashcard-toolbar">
            <span className="counter-pill">Card {current + 1} <i>/</i> {order.length}</span>
            <button className="button button-quiet" type="button" onClick={() => { setOrder(shuffled(cards.map((_, index) => index))); setCurrent(0); setShowAnswer(false); }}><Shuffle size={16} /> Shuffle</button>
          </div>
          <article className={`flashcard panel${showAnswer ? ' revealed' : ''}`}>
            <div className="flashcard-meta">
              {card.topic && <span className="topic-pill">{card.topic}</span>}
              {card.difficulty && <span className={`difficulty-pill ${card.difficulty.toLowerCase()}`}>{card.difficulty}</span>}
            </div>
            <span className="flashcard-label">QUESTION</span>
            <div className="flashcard-question"><ContentText text={card.question} /></div>
            {showAnswer && <div className="flashcard-answer"><span className="flashcard-label">ANSWER</span><ContentText text={card.answer} /></div>}
            <button className="button button-primary show-answer" type="button" onClick={() => setShowAnswer((value) => !value)}>
              {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}{showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
          </article>
          <div className="flashcard-navigation">
            <button className="button button-secondary" type="button" onClick={() => changeCard(current - 1)}><ChevronLeft size={17} /> Previous</button>
            <button className="button button-secondary" type="button" onClick={() => changeCard(current + 1)}>Next <ChevronRight size={17} /></button>
          </div>
        </div>
      ) : <div className="empty-state-small"><p>No flashcards were returned for this source.</p></div>}
    </div>
  );
}
