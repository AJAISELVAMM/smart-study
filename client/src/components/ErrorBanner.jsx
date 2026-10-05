import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {onDismiss && <button type="button" className="icon-button" aria-label="Dismiss error" onClick={onDismiss}><X size={16} /></button>}
    </div>
  );
}
