// Forka People line icons (drawn for this app; 24px grid, 1.8px stroke). No emojis, per the Forka brand rules.
import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  feed: <><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9h8M8 12h5" /></>,
  welcome: <><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" /></>,
  home: <><path d="M4 11 12 4l8 7" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></>,
  requests: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 9h6M9 13h6M9 17h3" /></>,
  leave: <><path d="M4 20h16" /><path d="M12 20V9" /><path d="M12 9c-3-4-7-3-8-1 3 0 5 1 8 1Z" /><path d="M12 9c3-4 7-3 8-1-3 0-5 1-8 1Z" /><path d="M12 9c-1-3 0-5 2-6" /></>,
  time: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  payslips: <><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M4 10h16" /><path d="M8 15h3" /></>,
  learning: <><path d="M3 9l9-4 9 4-9 4-9-4Z" /><path d="M7 11v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4" /></>,
  policies: <><path d="M5 5h10l4 4v10H5z" /><path d="M15 5v4h4" /><path d="M8 13h8M8 16h5" /></>,
  people: <><circle cx="9" cy="9" r="3" /><path d="M3 19c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="8" r="2.4" /><path d="M16 13.5c2.8 0 5 1.6 5 4.5" /></>,
  approvals: <><circle cx="12" cy="12" r="8" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>,
  roster: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 5V3M15 5V3" /><path d="M8 14h3M13 14h3M8 17h3" /></>,
  attendance: <><path d="M12 3a6 6 0 0 0-6 6c0 4 6 11 6 11s6-7 6-11a6 6 0 0 0-6-6Z" /><path d="m9.5 9 1.8 1.8L14.5 7.5" /></>,
  performance: <><path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4-3.9-3.8 5.4-.8Z" /></>,
  documents: <><rect x="6" y="3" width="12" height="18" rx="2" /><circle cx="12" cy="10" r="2.5" /><path d="M8.5 16c.8-1.6 2-2.3 3.5-2.3s2.7.7 3.5 2.3" /></>,
  lifecycle: <><path d="M4 12a8 8 0 0 1 14-5.3" /><path d="M18 3v4h-4" /><path d="M20 12a8 8 0 0 1-14 5.3" /><path d="M6 21v-4h4" /></>,
  payroll: <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5" /><path d="M12 6.5V8M12 16v1.5" /></>,
  desk: <><path d="M5 18v-6a7 7 0 0 1 14 0v6" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /></>,
  reports: <><path d="M12 4a8 8 0 1 0 8 8h-8Z" /><path d="M14 2.5A8 8 0 0 1 21.5 10H14Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5Z" /></>,
  org: <><rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><path d="M12 8v4M6 16v-4h12v4" /></>,
};

export function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={'ico ' + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {P[name] ?? P.home}
    </svg>
  );
}

// Section colours: Me = sea, Team = sage, HR = terracotta, Company = saffron.
export const GROUP_OF: Record<string, 'me' | 'team' | 'hr' | 'company'> = {
  '': 'me', welcome: 'me', feed: 'me', requests: 'me', leave: 'me', time: 'me', payslips: 'me', learning: 'me', policies: 'me',
  people: 'team', approvals: 'team', roster: 'team', attendance: 'team', performance: 'team',
  documents: 'hr', lifecycle: 'hr', payroll: 'hr', desk: 'hr', reports: 'hr', settings: 'company', org: 'company',
};
export const iconFor = (route: string) => (route === '' ? 'home' : route);

// The Forka People mark: four rounded tiles in the brand accents around a bronze centre (original artwork).
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className={'logo' + (dark ? ' on-light' : '')}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="14" height="14" rx="4" fill="#3D7C8C" />
        <rect x="18" y="2" width="14" height="14" rx="4" fill="#E3A33B" />
        <rect x="2" y="18" width="14" height="14" rx="4" fill="#7C9A7E" />
        <rect x="18" y="18" width="14" height="14" rx="4" fill="#C8553D" />
        <circle cx="17" cy="17" r="5.5" fill="#8C6A3F" stroke={dark ? '#FFFFFF' : '#2B2B2B'} strokeWidth="2.5" />
      </svg>
      <span className="logo-text"><small>Forka</small><strong>People</strong></span>
    </span>
  );
}
