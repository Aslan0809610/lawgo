import { NavLink } from 'react-router-dom';

const tabs = [
  { path: 'path', icon: '◈', label: '學習' },
  { path: 'review', icon: '↻', label: '複習' },
  { path: 'articles', icon: '▤', label: '條文' },
  { path: 'profile', icon: '♙', label: '我的' },
];

export function BottomNav({ base }: { base: string }) {
  return (
    <nav className="bottom-nav" aria-label="主要導覽">
      {tabs.map((tab) => (
        <NavLink key={tab.path} to={`${base}/${tab.path}`}>
          <span aria-hidden="true">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
