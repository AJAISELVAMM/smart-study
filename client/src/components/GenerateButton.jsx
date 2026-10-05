import { Sparkles } from 'lucide-react';

export default function GenerateButton({ onClick, disabled, loading }) {
  return (
    <button className="button button-primary generate-button" type="button" onClick={onClick} disabled={disabled || loading}>
      {loading ? <span className="mini-spinner" aria-hidden="true" /> : <Sparkles size={18} />}
      <span>{loading ? 'Creating your Study Kit…' : 'Generate Study Kit'}</span>
    </button>
  );
}
