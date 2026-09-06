/* eslint-disable react/no-array-index-key -- static, order-stable decorative SVG */
import { cn } from '@/lib/styles/utils';

/**
 * A labeled cross-section of a proper paver installation — the layers most
 * homeowners never see and most cheap installers skip. Doubles as a trust
 * signal: this is what "engineered from the base up" actually means.
 */

const LAYERS = [
  {
    n: '01',
    name: 'Pavers',
    spec: '60mm concrete or clay',
    note: 'Set in your pattern — herringbone locks tightest for driveways.',
  },
  {
    n: '02',
    name: 'Polymeric sand',
    spec: 'Swept & set joints',
    note: 'Binds the field, sheds monsoon runoff, blocks weeds and ants.',
  },
  {
    n: '03',
    name: 'Bedding sand',
    spec: '1 in. screeded',
    note: 'A true, level bed so every paver sits flush.',
  },
  {
    n: '04',
    name: 'Aggregate base',
    spec: '4–6 in. compacted ABC',
    note: 'Compacted in lifts — the structure that carries the load.',
  },
  {
    n: '05',
    name: 'Graded subgrade',
    spec: 'Native soil, sloped',
    note: 'Cut, graded, and compacted to drain away from the house.',
  },
];

// deterministic aggregate speckle
const dots = Array.from({ length: 90 }, (_, i) => {
  const col = i % 15;
  const row = Math.floor(i / 15);
  return {
    cx: 30 + col * 27 + ((row % 2) * 13 - (i % 3) * 4),
    cy: 150 + row * 15 + (i % 4) * 2,
    r: 2 + (i % 3),
  };
});

// million-ignore -- million's block optimizer drops the mapped SVG children
const Diagram = () => (
  <svg
    viewBox="0 0 440 340"
    className="h-auto w-full"
    role="img"
    aria-label="Cross-section of a paver installation showing pavers, polymeric sand, bedding sand, compacted aggregate base, and graded subgrade."
  >
    {/* subgrade */}
    <rect x="0" y="248" width="440" height="92" fill="#5B4B39" />
    <path
      d="M0 248 Q 55 240 110 248 T 220 248 T 330 248 T 440 248"
      fill="none"
      stroke="#3D3123"
      strokeWidth="2"
      opacity="0.5"
    />
    {/* aggregate base */}
    <rect x="0" y="140" width="440" height="108" fill="#8B7350" />
    {dots.map((d, i) => (
      <circle
        key={i}
        cx={d.cx}
        cy={d.cy}
        r={d.r}
        fill="#6E5A3D"
        opacity="0.7"
      />
    ))}
    {/* bedding sand */}
    <rect x="0" y="112" width="440" height="28" fill="#D2BB8C" />
    {Array.from({ length: 44 }, (_, i) => (
      <line
        key={i}
        x1={i * 10}
        y1="112"
        x2={i * 10 + 6}
        y2="140"
        stroke="#BBA170"
        strokeWidth="1.5"
        opacity="0.6"
      />
    ))}
    {/* pavers */}
    {Array.from({ length: 7 }, (_, i) => {
      const w = 58;
      const gap = 4;
      const x = 6 + i * (w + gap);
      const tone = ['#C7AB7C', '#B4935F', '#CBB58A', '#A8895C'][i % 4];
      return (
        <g key={i}>
          <rect x={x} y="70" width={w} height="42" rx="2" fill={tone} />
          <rect
            x={x}
            y="70"
            width={w}
            height="4"
            rx="2"
            fill="#ffffff"
            opacity="0.22"
          />
          {/* polymeric-sand joint */}
          <rect x={x + w} y="70" width={gap} height="42" fill="#CBB693" />
        </g>
      );
    })}
    {/* edge restraint at the right terminus */}
    <path
      d="M436 70 L440 70 L440 140 L430 140 L436 112 Z"
      fill="#2E271F"
      opacity="0.85"
    />

    {/* thickness brackets */}
    <g
      fontFamily='"Space Mono", monospace'
      fontSize="12"
      fill="#F3ECDE"
      opacity="0.92"
    >
      <text x="14" y="96">
        60mm
      </text>
    </g>
  </svg>
);

export const Anatomy = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
        className
      )}
    >
      <div className="overflow-hidden rounded-tile border border-bone/10 bg-basalt-950 p-4 shadow-paver-lg sm:p-6">
        <Diagram />
      </div>

      <ol className="flex flex-col">
        {LAYERS.map((layer, i) => (
          <li
            key={layer.n}
            className={cn(
              'flex gap-5 py-4',
              i !== LAYERS.length - 1 && 'border-b border-bone/10'
            )}
          >
            <span className="eyebrow pt-1 text-ochre">{layer.n}</span>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-lg font-800 text-bone">
                  {layer.name}
                </span>
                <span className="font-mono text-xs text-sand/60">
                  {layer.spec}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-sand/70">
                {layer.note}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
