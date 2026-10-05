import { BookOpen, GraduationCap, Target } from 'lucide-react';

const modes = [
  { name: 'Beginner', icon: BookOpen, description: 'Simple language and clear explanations.' },
  { name: 'Standard', icon: GraduationCap, description: 'Balanced detail with academic accuracy.' },
  { name: 'Exam Revision', icon: Target, description: 'High-yield concepts and exam practice.' },
];

export default function LearningMode({ value, onChange, disabled = false }) {
  return (
    <section className="panel mode-panel">
      <div className="section-kicker">STEP 2</div>
      <h2>Choose your learning mode</h2>
      <div className="mode-grid" role="radiogroup" aria-label="Learning mode">
        {modes.map(({ name, icon: Icon, description }) => (
          <button
            type="button"
            key={name}
            role="radio"
            aria-checked={value === name}
            className={`mode-card${value === name ? ' active' : ''}`}
            onClick={() => onChange(name)}
            disabled={disabled}
          >
            <span className="mode-icon"><Icon size={18} /></span>
            <span className="mode-title">{name}</span>
            <span className="mode-description">{description}</span>
            <span className="radio-dot" />
          </button>
        ))}
      </div>
    </section>
  );
}
