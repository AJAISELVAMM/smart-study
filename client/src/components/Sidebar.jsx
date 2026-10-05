import { NavLink } from 'react-router-dom';
import { BookOpen, Clock3, Settings2, Sparkles } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', icon: BookOpen },
  { to: '/history', label: 'History', icon: Clock3 },
  { to: '/settings', label: 'Settings', icon: Settings2 },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand" aria-label="Smart Study Companion home">
        <span className="brand-mark"><Sparkles size={21} strokeWidth={2.4} /></span>
        <span className="brand-name">SMART STUDY<span>COMPANION</span></span>
      </NavLink>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="learning-loop">
          <span className="loop-kicker">YOUR LEARNING LOOP</span>
          <div>Read <i>→</i> Understand</div>
          <div>Recall <i>→</i> Practice</div>
        </div>
        <p className="privacy-note">Your study sessions are saved in this app’s local SQLite database.</p>
      </div>
    </aside>
  );
}
