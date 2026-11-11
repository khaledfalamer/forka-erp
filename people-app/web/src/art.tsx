// Original Forka People illustrations (drawn for this app; no third-party artwork).
// People from our restaurants and cafés: a waiter, a chef, a barista. Decorative only (aria-hidden).

const C = {
  charcoal: '#2B2B2B', paper: '#F6F3EE', white: '#FFFFFF', line: '#E3DCD1', bronze: '#8C6A3F',
  saffron: '#E3A33B', terracotta: '#C8553D', sage: '#7C9A7E', sea: '#3D7C8C', blush: '#F2C6B4',
  date: '#6B4A2E', skin1: '#8D5B3E', skin2: '#C68A62', skin3: '#F1C7A4', hair: '#2A1E17',
};

const Face = ({ x, y, skin }: { x: number; y: number; skin: string }) => (
  <g>
    <circle cx={x} cy={y} r="22" fill={skin} />
    <circle cx={x - 7} cy={y - 1} r="2.2" fill={C.charcoal} />
    <circle cx={x + 7} cy={y - 1} r="2.2" fill={C.charcoal} />
    <path d={`M${x - 6} ${y + 8} Q${x} ${y + 13} ${x + 6} ${y + 8}`} stroke={C.charcoal} strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx={x - 12} cy={y + 6} r="3.5" fill={C.terracotta} opacity=".25" />
    <circle cx={x + 12} cy={y + 6} r="3.5" fill={C.terracotta} opacity=".25" />
  </g>
);

const Spark = ({ x, y, s = 1, color = C.saffron }: { x: number; y: number; s?: number; color?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -10 Q1.5 -1.5 10 0 Q1.5 1.5 0 10 Q-1.5 1.5 -10 0 Q-1.5 -1.5 0 -10Z" fill={color} />
);

const Steam = ({ x, y }: { x: number; y: number }) => (
  <g stroke={C.line} strokeWidth="3" fill="none" strokeLinecap="round">
    <path d={`M${x} ${y} q-5 -8 0 -16 q5 -8 0 -16`} />
    <path d={`M${x + 10} ${y - 2} q-5 -8 0 -16 q5 -8 0 -16`} />
  </g>
);

// A week roster card with coloured shift bars.
function ScheduleCard({ x, y }: { x: number; y: number }) {
  const bars = [[0, 1, C.saffron], [1, 2, C.sage], [2, 0, C.terracotta], [3, 1, C.sea], [4, 2, C.saffron], [5, 0, C.sage], [6, 1, C.terracotta]] as const;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="4" y="6" width="220" height="138" rx="14" fill={C.charcoal} opacity=".06" />
      <rect width="220" height="138" rx="14" fill={C.white} stroke={C.line} />
      <rect x="16" y="16" width="70" height="8" rx="4" fill={C.bronze} opacity=".55" />
      <circle cx="196" cy="20" r="4" fill={C.line} /><circle cx="184" cy="20" r="4" fill={C.line} />
      {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={16 + i * 28} y="36" width="20" height="5" rx="2.5" fill={C.line} />)}
      {bars.map(([d, row, col], i) => <rect key={i} x={16 + d * 28} y={52 + row * 26} width="20" height="18" rx="5" fill={col} />)}
    </g>
  );
}

// A leave calendar card with an approval tick.
function LeaveCard({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="4" y="6" width="190" height="132" rx="14" fill={C.charcoal} opacity=".06" />
      <rect width="190" height="132" rx="14" fill={C.white} stroke={C.line} />
      <rect width="190" height="30" rx="14" fill={C.sea} />
      <rect y="16" width="190" height="14" fill={C.sea} />
      <circle cx="40" cy="0" r="5" fill={C.charcoal} /><circle cx="150" cy="0" r="5" fill={C.charcoal} />
      {Array.from({ length: 15 }).map((_, i) => {
        const c = i % 5, r = Math.floor(i / 5);
        const on = i === 6 || i === 7 || i === 8;
        return <rect key={i} x={18 + c * 32} y={44 + r * 28} width="24" height="20" rx="5" fill={on ? C.sage : C.paper} />;
      })}
      <circle cx="176" cy="120" r="22" fill={C.saffron} />
      <path d="M165 120 l8 8 l14 -16" stroke={C.white} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

// Waiter carrying a tray.
function Waiter({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="40" cy="250" rx="58" ry="8" fill={C.charcoal} opacity=".07" />
      <path d="M30 150 L24 240 M52 150 L60 240" stroke={C.charcoal} strokeWidth="18" strokeLinecap="round" />
      <ellipse cx="20" cy="244" rx="15" ry="7" fill={C.charcoal} /><ellipse cx="64" cy="244" rx="15" ry="7" fill={C.charcoal} />
      <path d="M10 60 Q40 44 70 60 L74 160 Q40 170 6 160 Z" fill={C.sea} />
      <path d="M14 66 Q40 56 66 66 L68 158 Q40 166 12 158 Z" fill={C.charcoal} />
      <path d="M30 58 L40 84 L50 58 Z" fill={C.white} />
      <path d="M33 62 L40 68 L47 62 L40 56 Z" fill={C.terracotta} />
      <rect x="16" y="118" width="48" height="56" rx="6" fill={C.white} />
      <path d="M12 72 Q-6 104 6 136" stroke={C.sea} strokeWidth="15" fill="none" strokeLinecap="round" />
      <circle cx="7" cy="140" r="8" fill={C.skin2} />
      <path d="M68 72 Q96 66 100 28" stroke={C.sea} strokeWidth="15" fill="none" strokeLinecap="round" />
      <circle cx="101" cy="24" r="8" fill={C.skin2} />
      <ellipse cx="104" cy="16" rx="44" ry="7" fill={C.bronze} />
      <rect x="80" y="-6" width="16" height="20" rx="4" fill={C.saffron} />
      <rect x="104" y="-10" width="16" height="24" rx="4" fill={C.terracotta} />
      <Steam x={86} y={-12} />
      <Face x={40} y={30} skin={C.skin2} />
      <path d="M18 24 Q22 2 42 4 Q62 4 63 24 Q52 14 40 14 Q28 14 18 24 Z" fill={C.hair} />
    </g>
  );
}

// Chef in whites with a clipboard.
function Chef({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="40" cy="250" rx="58" ry="8" fill={C.charcoal} opacity=".07" />
      <path d="M30 150 L26 240 M52 150 L56 240" stroke={C.charcoal} strokeWidth="18" strokeLinecap="round" />
      <ellipse cx="22" cy="244" rx="15" ry="7" fill={C.charcoal} /><ellipse cx="60" cy="244" rx="15" ry="7" fill={C.charcoal} />
      <path d="M8 62 Q40 46 72 62 L76 164 Q40 174 4 164 Z" fill={C.white} stroke={C.line} strokeWidth="2" />
      <circle cx="30" cy="92" r="3" fill={C.bronze} /><circle cx="30" cy="112" r="3" fill={C.bronze} />
      <circle cx="50" cy="92" r="3" fill={C.bronze} /><circle cx="50" cy="112" r="3" fill={C.bronze} />
      <path d="M26 56 Q40 64 54 56" stroke={C.terracotta} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M70 74 Q92 100 76 120" stroke={C.white} strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M70 74 Q92 100 76 120" stroke={C.line} strokeWidth="1.5" fill="none" />
      <path d="M10 74 Q-8 100 14 118" stroke={C.white} strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M10 74 Q-8 100 14 118" stroke={C.line} strokeWidth="1.5" fill="none" />
      <rect x="14" y="98" width="58" height="44" rx="6" fill={C.sea} transform="rotate(-8 43 120)" />
      <rect x="22" y="108" width="34" height="5" rx="2.5" fill={C.white} opacity=".8" transform="rotate(-8 43 120)" />
      <rect x="22" y="120" width="24" height="5" rx="2.5" fill={C.white} opacity=".6" transform="rotate(-8 43 120)" />
      <circle cx="16" cy="122" r="8" fill={C.skin1} /><circle cx="72" cy="118" r="8" fill={C.skin1} />
      <Face x={40} y={32} skin={C.skin1} />
      <path d="M20 16 L60 16 L58 4 Q70 -6 60 -18 Q54 -30 42 -24 Q34 -34 24 -24 Q12 -24 14 -10 Q10 0 22 4 Z" fill={C.white} stroke={C.line} strokeWidth="2" />
      <rect x="19" y="8" width="42" height="10" rx="3" fill={C.white} stroke={C.line} strokeWidth="2" />
    </g>
  );
}

// Barista in hijab holding a coffee.
function Barista({ x, y, s = 1, wave = false }: { x: number; y: number; s?: number; wave?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="40" cy="250" rx="58" ry="8" fill={C.charcoal} opacity=".07" />
      <path d="M32 150 L28 240 M50 150 L54 240" stroke={C.date} strokeWidth="18" strokeLinecap="round" />
      <ellipse cx="24" cy="244" rx="15" ry="7" fill={C.charcoal} /><ellipse cx="58" cy="244" rx="15" ry="7" fill={C.charcoal} />
      <path d="M8 62 Q40 48 72 62 L80 176 Q40 186 0 176 Z" fill={C.terracotta} />
      <path d="M18 92 L62 92 L68 178 Q40 186 12 178 Z" fill={C.saffron} />
      <path d="M24 70 L24 92 M56 70 L56 92" stroke={C.saffron} strokeWidth="4" />
      {wave ? (
        <>
          <path d="M70 74 Q96 60 92 26" stroke={C.terracotta} strokeWidth="15" fill="none" strokeLinecap="round" />
          <circle cx="92" cy="20" r="8" fill={C.skin3} />
        </>
      ) : (
        <>
          <path d="M70 74 Q92 104 68 118" stroke={C.terracotta} strokeWidth="15" fill="none" strokeLinecap="round" />
          <rect x="44" y="100" width="22" height="26" rx="5" fill={C.white} stroke={C.line} strokeWidth="2" />
          <path d="M66 106 q10 0 10 8 q0 8 -10 8" stroke={C.line} strokeWidth="3" fill="none" />
          <circle cx="62" cy="120" r="7" fill={C.skin3} />
          <Steam x={50} y={94} />
        </>
      )}
      <path d="M10 74 Q-4 108 14 132" stroke={C.terracotta} strokeWidth="15" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="136" r="7" fill={C.skin3} />
      {/* hijab */}
      <path d="M12 40 Q10 4 40 2 Q70 4 68 40 Q70 66 54 72 Q40 78 26 72 Q10 66 12 40 Z" fill={C.sage} />
      <circle cx="40" cy="36" r="19" fill={C.skin3} />
      <circle cx="34" cy="35" r="2" fill={C.charcoal} /><circle cx="46" cy="35" r="2" fill={C.charcoal} />
      <path d="M35 43 Q40 47 45 43" stroke={C.charcoal} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="29" cy="41" r="3" fill={C.terracotta} opacity=".25" /><circle cx="51" cy="41" r="3" fill={C.terracotta} opacity=".25" />
      <path d="M21 30 Q40 12 59 30" stroke={C.sage} strokeWidth="6" fill="none" />
    </g>
  );
}

const Plant = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx="22" cy="-30" rx="9" ry="24" fill={C.sage} transform="rotate(-25 22 -30)" />
    <ellipse cx="38" cy="-36" rx="9" ry="26" fill={C.sea} opacity=".8" transform="rotate(15 38 -36)" />
    <ellipse cx="30" cy="-24" rx="8" ry="20" fill={C.sage} opacity=".9" />
    <path d="M10 0 L50 0 L44 40 L16 40 Z" fill={C.terracotta} />
    <rect x="6" y="-4" width="48" height="10" rx="4" fill={C.terracotta} />
  </g>
);

export function ArtLeft() {
  return (
    <svg viewBox="0 0 340 430" className="art" aria-hidden="true" focusable="false">
      <circle cx="120" cy="120" r="96" fill={C.saffron} opacity=".12" />
      <ScheduleCard x={20} y={40} />
      <Spark x={270} y={40} s={1.2} />
      <Spark x={300} y={84} s={.7} color={C.terracotta} />
      <Plant x={30} y={378} />
      <Waiter x={190} y={170} />
    </svg>
  );
}

export function ArtRight() {
  return (
    <svg viewBox="0 0 380 430" className="art" aria-hidden="true" focusable="false">
      <circle cx="270" cy="110" r="92" fill={C.sea} opacity=".1" />
      <LeaveCard x={170} y={40} />
      <Spark x={130} y={70} s={1.1} color={C.sage} />
      <Spark x={96} y={110} s={.6} />
      <Chef x={40} y={170} />
      <Barista x={250} y={170} />
    </svg>
  );
}

// Small strip for phones and the home screen.
export function ArtTeam({ className = 'art-strip' }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 200" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="210" cy="186" rx="200" ry="10" fill={C.charcoal} opacity=".04" />
      <circle cx="80" cy="70" r="50" fill={C.saffron} opacity=".14" />
      <circle cx="340" cy="60" r="44" fill={C.sea} opacity=".12" />
      <Spark x={200} y={26} s={1} />
      <Spark x={236} y={50} s={.6} color={C.terracotta} />
      <Waiter x={40} y={78} s={.42} />
      <Chef x={170} y={64} s={.47} />
      <Barista x={300} y={74} s={.44} wave />
    </svg>
  );
}

// Empty state: all clear.
export function ArtAllClear() {
  return (
    <svg viewBox="0 0 160 110" className="art-empty" aria-hidden="true" focusable="false">
      <circle cx="80" cy="58" r="46" fill={C.sage} opacity=".14" />
      <rect x="54" y="38" width="48" height="52" rx="10" fill={C.white} stroke={C.line} strokeWidth="2" />
      <path d="M102 50 q16 0 16 14 q0 14 -16 14" stroke={C.line} strokeWidth="5" fill="none" />
      <path d="M66 64 l9 9 l17 -19" stroke={C.sage} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Steam x={70} y={32} />
      <Spark x={130} y={26} s={.8} />
      <Spark x={30} y={40} s={.6} color={C.terracotta} />
    </svg>
  );
}
