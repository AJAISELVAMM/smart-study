import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const StudyContext = createContext(null);
const readPreference = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; }
  catch { return fallback; }
};

export function StudyProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null);
  const [learningMode, setLearningModeState] = useState(() => readPreference('ssc-learning-mode', 'Beginner'));
  const [defaultLearningMode, setDefaultLearningModeState] = useState(() => readPreference('ssc-learning-mode', 'Beginner'));
  const [appearance, setAppearanceState] = useState(() => readPreference('ssc-appearance', 'Light'));

  const setLearningMode = (value) => setLearningModeState(value);
  const setDefaultLearningMode = (value) => {
    setDefaultLearningModeState(value);
    setLearningModeState(value);
    try { localStorage.setItem('ssc-learning-mode', value); } catch { /* storage can be disabled */ }
  };
  const setAppearance = (value) => {
    setAppearanceState(value);
    try { localStorage.setItem('ssc-appearance', value); } catch { /* storage can be disabled */ }
  };

  useEffect(() => {
    document.documentElement.dataset.theme = appearance.toLowerCase();
  }, [appearance]);

  const value = useMemo(() => ({
    activeSession,
    setActiveSession,
    learningMode,
    setLearningMode,
    defaultLearningMode,
    setDefaultLearningMode,
    appearance,
    setAppearance,
  }), [activeSession, learningMode, defaultLearningMode, appearance]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy must be used within StudyProvider');
  return context;
}
