import { useId, type ReactNode } from 'react';

/** The app logo on a home tile: four leaves in one colour around a centre dot. */
export function BrandMark({ color }: { color: string }) {
  return (
    <svg className="lgm" viewBox="0 0 118 118" aria-hidden="true">
      <rect x="7" y="7" width="48" height="48" rx="12" fill={color} />
      <rect x="63" y="7" width="48" height="48" rx="12" fill={color} opacity="0.85" />
      <rect x="7" y="63" width="48" height="48" rx="12" fill={color} opacity="0.68" />
      <rect x="63" y="63" width="48" height="48" rx="12" fill={color} opacity="0.95" />
      <circle cx="59" cy="59" r="22" fill="#fff" />
      <circle cx="59" cy="59" r="15.8" fill={color} />
    </svg>
  );
}

/** Loading: the Forka logo, each leaf lights up in turn so the light travels round it. */
export function Loader() {
  const id = useId().replace(/:/g, '');
  const leaves: [string, number, number, string][] = [
    ['p1', 61, 111, '#397F8F'], ['p2', 181, 111, '#E0A037'], ['p3', 181, 231, '#BD5038'], ['p4', 61, 231, '#77987D'],
  ];
  return (
    <div className="fk-load" role="status" style={{ ['--lc' as string]: '#896B45' }}>
      <svg className="fk-mk" viewBox="46 96 255 255" aria-hidden="true">
        <defs>
          <mask id={'m' + id}><rect x="0" y="0" width="400" height="400" fill="#fff" /><circle cx="173.5" cy="223.5" r="47" fill="#000" /></mask>
          <filter id={'g' + id} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16" /></filter>
        </defs>
        <g filter={`url(#g${id})`}>{leaves.map(([c, x, y, f]) => <rect key={c} className={'pg ' + c} x={x} y={y} width="105" height="105" rx="24" fill={f} />)}</g>
        <g mask={`url(#m${id})`}>{leaves.map(([c, x, y, f]) => <rect key={c} className={'pt ' + c} x={x} y={y} width="105" height="105" rx="24" fill={f} />)}</g>
        <circle className="pc" cx="173.5" cy="223.5" r="34" fill="#896B45" />
      </svg>
      <span className="fk-vh">Loading</span>
    </div>
  );
}

const PATHS: Record<string, ReactNode> = {
  boards: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v10" /></>,
  proc: <><path d="M5.5 8h13l-1.2 12H6.7L5.5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  hire: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M15.5 5.3a3.2 3.2 0 0 1 0 6.4" /><path d="M17.5 14.4c2.1.8 3.5 2.9 3.5 5.6" /></>,
  branch: <><rect x="5" y="4.5" width="14" height="16.5" rx="2.2" /><path d="M9 4.5h6V7H9z" /><path d="M8.8 13.6l2.2 2.2 4.3-4.3" /></>,
  people: <><path d="M12 3.2l7 3v5.2c0 4.4-2.9 8.3-7 9.6-4.1-1.3-7-5.2-7-9.6V6.2l7-3z" /><path d="M9.3 12.2l2 2 3.6-3.6" /></>,
  act: <path d="M3 12.5h4l2.6-7 4.6 14 2.6-7H21" />,
};
/** Simple line icons (no emojis). */
export function Icon({ name }: { name: keyof typeof PATHS | string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>;
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
