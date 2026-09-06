import { cn } from '@/lib/styles/utils';

/**
 * The hero signature: a running-bond field of beveled pavers with desert
 * tonal variation, generated deterministically (no runtime randomness).
 * The parent tilts it on a perspective so it reads as a finished patio
 * surface receding toward the horizon.
 */

const VB_W = 900;
const VB_H = 640;

const BRICK_W = 92;
const BRICK_H = 46;
const JOINT = 8; // polymeric-sand joint between pavers
const ROW_STEP = BRICK_H + JOINT;
const COL_STEP = BRICK_W + JOINT;

// Sandstone / travertine tones — the everyday pavers
const TONES = [
  '#C7AB7C',
  '#BB9A64',
  '#D0B98C',
  '#A98B5E',
  '#8F744F',
  '#7A6244',
];

type Brick = {
  key: string;
  x: number;
  y: number;
  fill: string;
};

const buildBricks = (): Brick[] => {
  const bricks: Brick[] = [];
  const rows = Math.ceil(VB_H / ROW_STEP) + 2;
  const cols = Math.ceil(VB_W / COL_STEP) + 2;

  for (let row = -1; row < rows; row += 1) {
    const offset = row % 2 === 0 ? 0 : -COL_STEP / 2;
    for (let col = -1; col < cols; col += 1) {
      const n = row * 7 + col * 3 + 40; // deterministic seed
      let fill = TONES[Math.abs(n) % TONES.length];
      if (Math.abs(n) % 19 === 0)
        fill = '#A8432B'; // occasional clay accent
      else if (Math.abs(n) % 23 === 0) fill = '#3B3228'; // occasional charcoal

      bricks.push({
        key: `${row}-${col}`,
        x: col * COL_STEP + offset,
        y: row * ROW_STEP,
        fill,
      });
    }
  }
  return bricks;
};

const BRICKS = buildBricks();

// million-ignore -- million's block optimizer drops the mapped SVG children
export const PaverField = ({ className }: { className?: string }) => {
  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <div
        className="absolute left-1/2 top-1/2 h-[160%] w-[150%]"
        style={{
          transform:
            'translate(-50%, -50%) perspective(1100px) rotateX(32deg) rotateZ(-2deg)',
          transformOrigin: 'center',
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          {/* darker grout bed so the joints read as lines */}
          <rect width={VB_W} height={VB_H} fill="#5F4C36" />
          {BRICKS.map((b) => (
            <g key={b.key}>
              <rect
                x={b.x}
                y={b.y}
                width={BRICK_W}
                height={BRICK_H}
                rx={2.5}
                fill={b.fill}
              />
              {/* top-edge catch-light */}
              <rect
                x={b.x}
                y={b.y}
                width={BRICK_W}
                height={5}
                rx={2}
                fill="#ffffff"
                opacity={0.28}
              />
              {/* bottom-edge shadow gives each paver depth */}
              <rect
                x={b.x}
                y={b.y + BRICK_H - 6}
                width={BRICK_W}
                height={6}
                rx={2}
                fill="#000000"
                opacity={0.24}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* haze the far edge so the field dissolves into desert light */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(229,217,195,0) 42%, rgba(229,217,195,0.55) 82%, rgba(229,217,195,0.92) 100%)',
        }}
      />
    </div>
  );
};
