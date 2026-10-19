"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { sfx } from "@/audio/useSound";
import { useTour } from "@/lib/tour";

/**
 * Micro-demos: each project lets the visitor *use* the idea at its heart for a
 * few seconds. They are sketches of behaviour described in the research —
 * never her production code, never real data — and say so.
 */

function Frame({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="w-full border-y border-hair bg-void/70 px-4 py-3 backdrop-blur-sm" data-lenis-prevent>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="mono text-gold">Try it · {title}</p>
        <p className="mono hidden text-[10px] text-faint sm:block">{hint}</p>
      </div>
      {children}
      <p className="mono mt-3 text-[9.5px] leading-relaxed text-faint/80">Interactive sketch of what it does — not her production code or real data.</p>
    </div>
  );
}

const tap = () => sfx.tick();

/** During the guided tour the demo plays itself, one step at a time; visitors can still take over. */
function useAutoplay(step: () => void, ms: number) {
  const playing = useTour((t) => t.status === "playing");
  const ref = useRef(step);
  useEffect(() => {
    ref.current = step;
  });
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [playing, ms]);
}

/* Enterprise HRMS — the permission matrix (RBAC) she built. */
const ROLES = ["Admin", "HR", "Manager", "Employee"] as const;
const MODULES = ["Payroll", "Roster", "Hiring", "Profile"] as const;
const LEVELS = ["none", "view", "edit"] as const;
type Level = (typeof LEVELS)[number];
const START: Level[][] = [
  ["edit", "edit", "edit", "edit"],
  ["edit", "view", "edit", "edit"],
  ["none", "edit", "view", "view"],
  ["none", "view", "none", "edit"],
];
function Rbac() {
  const [m, setM] = useState(START);
  const [last, setLast] = useState("Click a cell to change a role's access.");
  const script = useRef(0);
  const cycle = (r: number, c: number) => {
    tap();
    setM((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = LEVELS[(LEVELS.indexOf(prev[r][c]) + 1) % 3];
      setLast(`${ROLES[r]} → ${MODULES[c]}: ${next[r][c]}`);
      return next;
    });
  };
  useAutoplay(() => {
    const seq: [number, number][] = [[2, 0], [3, 1], [1, 1], [2, 2]];
    const [r, c] = seq[script.current++ % seq.length];
    cycle(r, c);
  }, 1600);
  return (
    <Frame title="Permission matrix" hint="role × module">
      <table className="w-full border-separate border-spacing-y-1 text-left">
        <thead>
          <tr>
            <th />
            {MODULES.map((mod) => <th key={mod} className="mono pb-1 text-center text-[10px] font-normal text-faint">{mod}</th>)}
          </tr>
        </thead>
        <tbody>
          {ROLES.map((role, r) => (
            <tr key={role}>
              <th className="pr-2 text-[13px] font-normal text-ivory/85">{role}</th>
              {MODULES.map((mod, c) => {
                const v = m[r][c];
                return (
                  <td key={mod} className="text-center">
                    <button
                      type="button"
                      onClick={() => cycle(r, c)}
                      aria-label={`${role} access to ${mod}: ${v}. Change`}
                      className="mono inline-flex h-6 w-14 items-center justify-center gap-1 text-[10px] transition-colors hover:text-ivory"
                      data-cursor="link"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full transition-colors ${v === "edit" ? "bg-gold shadow-[0_0_6px_#ffb347]" : v === "view" ? "bg-electric" : "bg-hair"}`} />
                      <span className={v === "none" ? "text-faint" : "text-mist"}>{v}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[13px] text-mist" aria-live="polite">{last}</p>
    </Frame>
  );
}

/* BreastCare AI — seven role portals; she built the patient and radiologist views (and a nurse dashboard). */
const PORTALS: { role: string; hers: boolean; rows: string[] }[] = [
  { role: "Patient", hers: true, rows: ["Screening history", "Appointments", "Reports, in plain language"] },
  { role: "Doctor", hers: false, rows: ["Patient list", "Referrals", "Clinical notes"] },
  { role: "Radiologist", hers: true, rows: ["Scan queue", "AI-assisted findings", "Sign-off"] },
  { role: "Hospital", hers: false, rows: ["Capacity", "Departments", "Throughput"] },
  { role: "Researcher", hers: false, rows: ["Anonymised cohorts", "Exports", "Studies"] },
  { role: "Health worker", hers: false, rows: ["Village visits", "Offline queue", "Sync"] },
  { role: "Admin", hers: false, rows: ["Users & roles", "Audit", "Settings"] },
];
function Portals() {
  const [i, setI] = useState(0);
  const [online, setOnline] = useState(false);
  useAutoplay(() => setI((k) => (k + 1) % PORTALS.length), 1700);
  const p = PORTALS[i];
  return (
    <Frame title="Seven portals, one platform" hint="switch role">
      <div className="flex flex-wrap gap-x-3 gap-y-1" role="tablist" aria-label="Role">
        {PORTALS.map((x, k) => (
          <button
            key={x.role}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => { tap(); setI(k); }}
            className={`mono text-[10px] transition-colors ${k === i ? "text-gold" : "text-faint hover:text-ivory"}`}
            data-cursor="link"
          >
            {x.role}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={p.role} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mt-3">
          <p className="flex items-center justify-between text-[13px] text-ivory">
            {p.role} portal
            <span className={`mono text-[9.5px] ${p.hers ? "text-gold" : "text-faint"}`}>{p.hers ? "she built this view" : "team portal"}</span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {p.rows.map((r, k) => (
              <li key={r} className="flex items-center gap-3 text-[12px] text-mist">
                <span className="h-1 rounded-full bg-gradient-to-r from-gold/70 to-transparent" style={{ width: 40 + k * 22 }} />
                {r}
              </li>
            ))}
          </ul>
          {p.role === "Health worker" && (
            <button type="button" onClick={() => { tap(); setOnline((o) => !o); }} className="mono mt-2 text-[10px] text-electric" data-cursor="link">
              {online ? "● online — 3 visits synced" : "○ offline — 3 visits queued · tap to reconnect"}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </Frame>
  );
}

/* EventHub banquet module — bookings, venues, scheduling, conflicts. */
const VENUES = ["Hall A", "Lawn", "Terrace"];
const SLOTS = ["Morning", "Noon", "Evening", "Night"];
function Banquet() {
  const [booked, setBooked] = useState<Set<string>>(() => new Set(["Lawn-Evening"]));
  const [msg, setMsg] = useState("Book a slot. Try one that's taken.");
  const plan = useRef(0);
  useAutoplay(() => {
    const seq = ["Hall A-Evening", "Terrace-Noon", "Lawn-Evening", "Hall A-Morning"];
    book(seq[plan.current++ % seq.length]);
  }, 1500);
  function book(key: string) {
    tap();
    if (booked.has(key)) return setMsg(`Conflict — ${key.replace("-", " · ")} is already booked.`);
    setBooked((b) => new Set(b).add(key));
    setMsg(`Booked ${key.replace("-", " · ")}. Resources reserved.`);
  }
  return (
    <Frame title="Banquet scheduling" hint="venue × slot">
      <div className="grid grid-cols-[auto_repeat(4,1fr)] gap-1 text-[11px]">
        <span />
        {SLOTS.map((s) => <span key={s} className="mono text-center text-[9.5px] text-faint">{s}</span>)}
        {VENUES.map((v) => (
          <div key={v} className="contents">
            <span className="pr-2 text-mist">{v}</span>
            {SLOTS.map((s) => {
              const key = `${v}-${s}`;
              const on = booked.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => book(key)}
                  aria-label={`${v}, ${s}: ${on ? "booked" : "free"}`}
                  className={`h-6 border transition-colors ${on ? "border-gold/60 bg-gold/20" : "border-hair hover:border-ivory/40"}`}
                  data-cursor="link"
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-mist" aria-live="polite">{msg}</p>
    </Frame>
  );
}

/* FoodHub — restaurant to doorstep, with a JWT-secured checkout. */
const STEPS = ["Browse", "Cart", "Checkout", "Order", "Track"];
const NOTES = ["Restaurants and menus", "Items in the cart", "Signed in — the order carries a JWT", "Order confirmed and stored", "On its way"];
function Order() {
  const [s, setS] = useState(0);
  const [fav, setFav] = useState(false);
  useAutoplay(() => setS((x) => (x + 1) % STEPS.length), 1400);
  return (
    <Frame title="An order, end to end" hint="advance the order">
      <div className="flex items-center gap-1">
        {STEPS.map((x, k) => (
          <div key={x} className="flex flex-1 flex-col items-center gap-1">
            <span className={`h-1 w-full transition-colors duration-500 ${k <= s ? "bg-gold" : "bg-hair"}`} />
            <span className={`mono text-[9.5px] ${k === s ? "text-gold" : "text-faint"}`}>{x}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-mist" aria-live="polite">{s === 2 && "🔒 "}{NOTES[s]}</p>
      <div className="mt-2 flex gap-5">
        <button type="button" onClick={() => { tap(); setS((x) => (x + 1) % STEPS.length); }} className="mono text-[11px] text-ivory hover:text-gold" data-cursor="link">
          {s === STEPS.length - 1 ? "Order again ↺" : "Next step →"}
        </button>
        <button type="button" aria-pressed={fav} onClick={() => { tap(); setFav((f) => !f); }} className="mono text-[11px] text-mist hover:text-gold" data-cursor="link">
          {fav ? "♥ saved restaurant" : "♡ save restaurant"}
        </button>
      </div>
    </Frame>
  );
}

/* PRAHARI — an early warning before a major infrastructure project slips. */
function Warning() {
  const [delay, setDelay] = useState(12);
  const [cost, setCost] = useState(8);
  useAutoplay(() => {
    setDelay((d) => (d >= 40 ? 6 : d + 7));
    setCost((c) => (c >= 32 ? 4 : c + 5));
  }, 900);
  const risk = Math.min(100, Math.round(delay * 1.4 + cost * 1.1));
  const state = risk >= 60 ? ["Early warning raised", "text-crimson"] : risk >= 35 ? ["On watch", "text-gold"] : ["On track", "text-electric"];
  const slider = (label: string, v: number, set: (n: number) => void) => (
    <label className="block text-[12px] text-mist">
      <span className="flex justify-between">
        {label}
        <span className="mono text-ivory">{v}%</span>
      </span>
      <input type="range" min={0} max={50} value={v} onChange={(e) => set(Number(e.target.value))} className="mt-1 w-full accent-[#ffb347]" />
    </label>
  );
  return (
    <Frame title="Early warning" hint="move the sliders">
      <div className="space-y-2">
        {slider("Schedule slip", delay, setDelay)}
        {slider("Cost overrun", cost, setCost)}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="relative h-1 flex-1 bg-hair">
          <motion.span className="absolute inset-y-0 left-0 bg-gradient-to-r from-electric via-gold to-crimson" animate={{ width: `${risk}%` }} />
        </span>
        <span className={`mono text-[11px] ${state[1]}`} aria-live="polite">{state[0]}</span>
      </div>
      <p className="mono mt-2 text-[9.5px] text-faint">Illustrative scoring — not MoSPI data.</p>
    </Frame>
  );
}

/* PrakritiOS — Mitti Khata, an environmental passport for a farm. */
function Passport() {
  const [n, setN] = useState(0);
  useAutoplay(() => setN((x) => x + 1), 2000);
  const id = `MK-${(4721 + n * 137).toString().padStart(6, "0")}`;
  const vals = [
    ["Soil health", ["Good", "Fair", "Improving"][n % 3]],
    ["Trees on record", String(14 + ((n * 7) % 23))],
    ["Seedballs sown", String(120 + ((n * 53) % 300))],
  ];
  return (
    <Frame title="Mitti Khata" hint="issue a passport">
      <AnimatePresence mode="wait">
        <motion.div key={id} initial={{ opacity: 0, rotateX: -20 }} animate={{ opacity: 1, rotateX: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="border-l border-[#7bd88f]/60 pl-3">
          <p className="mono text-[10px] text-[#9be3a8]">Environmental passport · {id}</p>
          <dl className="mt-2 grid grid-cols-3 gap-2">
            {vals.map(([k, v]) => (
              <div key={k}>
                <dt className="mono text-[9px] text-faint">{k}</dt>
                <dd className="text-[13px] text-ivory">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </AnimatePresence>
      <button type="button" onClick={() => { tap(); setN((x) => x + 1); }} className="mono mt-3 text-[11px] text-ivory hover:text-gold" data-cursor="link">
        Issue a passport for another farm →
      </button>
      <p className="mt-1 text-[12px] text-mist">A digital identity for nature, the way Aadhaar gave one to citizens.</p>
    </Frame>
  );
}

/* AI fitness app — posture correction. */
function Posture() {
  const [lean, setLean] = useState(18);
  const dir = useRef(-1);
  useAutoplay(() => {
    setLean((l) => {
      if (l <= 2) dir.current = 1;
      if (l >= 22) dir.current = -1;
      return l + dir.current * 4;
    });
  }, 600);
  const ok = lean < 8;
  const x = 40 + lean;
  return (
    <Frame title="Posture check" hint="straighten the spine">
      <div className="flex items-center gap-4">
        <svg width="70" height="90" viewBox="0 0 80 100" aria-hidden>
          <circle cx={x} cy="14" r="8" fill="none" stroke={ok ? "#6fb6ff" : "#ffb347"} strokeWidth="1.5" />
          <path d={`M ${x} 24 Q ${40 + lean * 1.4} 55 40 92`} fill="none" stroke={ok ? "#6fb6ff" : "#ffb347"} strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="0" x2="40" y2="100" stroke="rgba(243,234,216,0.15)" strokeDasharray="2 3" />
        </svg>
        <div className="flex-1">
          <input type="range" min={0} max={30} value={lean} onChange={(e) => setLean(Number(e.target.value))} aria-label="Forward lean" className="w-full accent-[#ffb347]" />
          <p className={`mt-2 text-[13px] ${ok ? "text-electric" : "text-gold"}`} aria-live="polite">{ok ? "Good posture — hold it." : `Leaning ${lean}° — straighten your back.`}</p>
        </div>
      </div>
    </Frame>
  );
}

const DEMOS: Record<string, () => ReactNode> = {
  "p-hrms": () => <Rbac />,
  "p-breastcare": () => <Portals />,
  "p-banquet": () => <Banquet />,
  "p-foodhub": () => <Order />,
  "p-prahari": () => <Warning />,
  "p-prakriti": () => <Passport />,
  "p-fitness": () => <Posture />,
};

export function ProjectDemo({ id }: { id: string }) {
  const d = DEMOS[id];
  return d ? <>{d()}</> : null;
}
