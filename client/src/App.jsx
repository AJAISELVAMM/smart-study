import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import { StudyProvider } from './context/StudyContext.jsx';

function AppFrame() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <BrowserRouter>
        <AppFrame />
      </BrowserRouter>
    </StudyProvider>
  );
}
