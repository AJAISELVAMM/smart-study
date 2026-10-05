import { BrainCircuit } from 'lucide-react';

export default function LoadingState({ label = 'Analyzing your study material…', detail = 'Gemini is building a source-grounded learning toolkit.' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-orbit"><BrainCircuit size={25} /></span>
      <div><strong>{label}</strong><p>{detail}</p></div>
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}
