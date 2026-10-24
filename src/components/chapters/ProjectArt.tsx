import type { Project } from "@/content/types";

const W = 320, H = 150;

/**
 * Line art for each project, drawn from the same form its artifact takes in
 * the world (and the same count): 33 data models as a lattice, seven role
 * portals as rings, a 24-hour early-warning sentinel as a radar, and so on.
 */
function Form({ p, color }: { p: Project; color: string }) {
  const n = p.artifact.count;
  const cx = W / 2, cy = H / 2 - 6;
  const stroke = { stroke: color, fill: "none", strokeWidth: 1 } as const;
  switch (p.artifact.form) {
    case "lattice": {
      const cols = 11, rows = Math.ceil(n / cols);
      const nodes = Array.from({ length: n }, (_, i) => [70 + (i % cols) * 18, 32 + Math.floor(i / cols) * 26 + ((i % cols) % 2) * 6] as const);
      return (
        <g>
          {nodes.map(([x, y], i) => {
            const right = nodes[i + 1], down = nodes[i + cols];
            return (
              <g key={i}>
                {right && (i + 1) % cols !== 0 && <line x1={x} y1={y} x2={right[0]} y2={right[1]} {...stroke} strokeOpacity={0.35} />}
                {down && <line x1={x} y1={y} x2={down[0]} y2={down[1]} {...stroke} strokeOpacity={0.25} />}
              </g>
            );
          })}
          {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 2.6 : 1.6} fill={color} opacity={i % 7 === 0 ? 1 : 0.7} />)}
          <text x={70} y={32 + rows * 26 + 4} fill={color} opacity={0.7} fontSize={9} letterSpacing={2}>{`${n} ${p.artifact.countMeaning}`.toUpperCase()}</text>
        </g>
      );
    }
    case "rings":
      return (
        <g>
          {[22, 38, 54].map((r) => <ellipse key={r} cx={cx} cy={cy} rx={r * 1.5} ry={r * 0.75} {...stroke} strokeOpacity={0.4} />)}
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2, r = [22, 38, 54][i % 3];
            return <circle key={i} cx={cx + Math.cos(a) * r * 1.5} cy={cy + Math.sin(a) * r * 0.75} r={3} fill={color} />;
          })}
          <circle cx={cx} cy={cy} r={6} fill={color} className="animate-pulse" />
        </g>
      );
    case "grid":
      return (
        <g>
          {Array.from({ length: n }, (_, i) => (
            <rect key={i} x={cx - 62 + (i % 2) * 66} y={cy - 38 + Math.floor(i / 2) * 42} width={58} height={34} rx={5} {...stroke} strokeOpacity={0.7} />
          ))}
          {Array.from({ length: n }, (_, i) => (
            <line key={i} x1={cx - 52 + (i % 2) * 66} y1={cy - 24 + Math.floor(i / 2) * 42} x2={cx - 18 + (i % 2) * 66} y2={cy - 24 + Math.floor(i / 2) * 42} stroke={color} strokeOpacity={0.5} />
          ))}
        </g>
      );
    case "loop": {
      const d = `M ${cx} ${cy} C ${cx + 30} ${cy - 40}, ${cx + 90} ${cy - 40}, ${cx + 90} ${cy} S ${cx + 30} ${cy + 40}, ${cx} ${cy} S ${cx - 90} ${cy - 40}, ${cx - 90} ${cy} S ${cx - 30} ${cy + 40}, ${cx} ${cy}`;
      return (
        <g>
          <path d={d} {...stroke} strokeOpacity={0.7} strokeWidth={1.4} />
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2;
            return <circle key={i} cx={cx + Math.sin(a) * 90} cy={cy + Math.sin(a * 2) * 22} r={3} fill={color} />;
          })}
        </g>
      );
    }
    case "sentinel":
      return (
        <g>
          {[16, 32, 48, 64].map((r) => <circle key={r} cx={cx} cy={cy} r={r} {...stroke} strokeOpacity={0.3} />)}
          <g className="origin-center animate-[spin_4s_linear_infinite]" style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <path d={`M ${cx} ${cy} L ${cx + 64} ${cy} A 64 64 0 0 0 ${cx + 45} ${cy - 45} Z`} fill={color} opacity={0.22} />
            <line x1={cx} y1={cy} x2={cx + 64} y2={cy} stroke={color} strokeWidth={1.4} />
          </g>
          {[[30, -20], [-40, 18], [12, 44], [-22, -46]].map(([x, y], i) => <circle key={i} cx={cx + x} cy={cy + y} r={2.6} fill={color} className="animate-pulse" />)}
        </g>
      );
    case "seed":
      return (
        <g>
          <path d={`M ${cx - 50} ${cy + 40} q 0 -30 -18 -44 q 22 4 18 44`} {...stroke} strokeOpacity={0.45} />
          <path d={`M ${cx + 30} ${cy + 40} C ${cx + 30} ${cy + 10}, ${cx + 26} ${cy - 18}, ${cx + 30} ${cy - 40}`} {...stroke} strokeWidth={1.6} />
          <path d={`M ${cx + 30} ${cy - 8} c -30 -6 -40 -26 -36 -40 c 22 2 34 18 36 40`} {...stroke} strokeWidth={1.4} />
          <path d={`M ${cx + 30} ${cy - 20} c 24 -10 40 -30 34 -46 c -22 6 -34 24 -34 46`} {...stroke} strokeWidth={1.4} />
          <line x1={cx - 100} y1={cy + 40} x2={cx + 100} y2={cy + 40} stroke={color} strokeOpacity={0.35} />
          <text x={cx - 70} y={cy + 54} fill={color} opacity={0.6} fontSize={8} letterSpacing={2}>1ST</text>
          <text x={cx + 22} y={cy + 54} fill={color} opacity={0.9} fontSize={8} letterSpacing={2}>2ND</text>
        </g>
      );
    case "arc":
    default:
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const r = 26 + i * 18;
            return <path key={i} d={`M ${cx - r} ${cy + 30} A ${r} ${r} 0 0 1 ${cx + r} ${cy + 30}`} {...stroke} strokeWidth={1.4} strokeOpacity={1 - i * 0.2} />;
          })}
          <circle cx={cx} cy={cy + 30} r={5} fill={color} className="animate-pulse" />
        </g>
      );
  }
}

/** The picture at the top of a project card: its form in light. */
export function ProjectArt({ p }: { p: Project }) {
  const warm = p.status === "live" || p.status === "internship";
  const color = warm ? "#ffb27a" : "#9fd0ff";
  return (
    <div
      aria-hidden
      className={`relative -mx-6 -mt-6 mb-5 overflow-hidden border-b border-hair ${warm ? "bg-[radial-gradient(ellipse_at_50%_40%,rgba(229,130,55,0.22),transparent_70%)]" : "bg-[radial-gradient(ellipse_at_50%_40%,rgba(110,170,240,0.22),transparent_70%)]"}`}
    >
      <span className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:16px_16px]" />
      <svg viewBox={`0 0 ${W} ${H}`} className="relative block h-auto w-full transition-[filter] duration-500 [filter:drop-shadow(0_0_4px_rgba(255,170,90,0.35))] group-hover:[filter:drop-shadow(0_0_8px_rgba(255,170,90,0.7))]">
        <Form p={p} color={color} />
      </svg>
    </div>
  );
}
