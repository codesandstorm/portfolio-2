import {
  BrainCircuit, Binary, CalendarDays, Crown, GraduationCap, Handshake, Layers, Megaphone, MessagesSquare, Mic, Microscope, Share2, Workflow, type LucideIcon,
} from "lucide-react";
import {
  siAntdesign, siCloudinary, siCplusplus, siExpress, siFigma, siGit, siJavascript, siJsonwebtokens, siMongodb, siNodedotjs, siOpenapiinitiative,
  siOpenjdk, siPostgresql, siPrisma, siPython, siReact, siReacthookform, siReactquery, siRender, siTypescript, siVercel, siVite, siZod,
  type SimpleIcon,
} from "simple-icons";

type Logo = { brand: SimpleIcon } | { icon: LucideIcon; color: string };

/** Her skills, by id: the official logo where there is one, a plain symbol where the skill is a practice. */
const BY_SKILL: Record<string, Logo> = {
  "s-react": { brand: siReact },
  "s-typescript": { brand: siTypescript },
  "s-javascript": { brand: siJavascript },
  "s-node": { brand: siNodedotjs },
  "s-express": { brand: siExpress },
  "s-postgresql": { brand: siPostgresql },
  "s-mongodb": { brand: siMongodb },
  "s-prisma": { brand: siPrisma },
  "s-rest": { brand: siOpenapiinitiative },
  "s-auth": { brand: siJsonwebtokens },
  "s-deploy": { brand: siVercel },
  "s-fullstack": { icon: Layers, color: "#ffb27a" },
  "s-uiux": { brand: siFigma },
  "s-aiml": { icon: BrainCircuit, color: "#c9a7ff" },
  "s-java": { brand: siOpenjdk },
  "s-dsa": { icon: Binary, color: "#8fc3f5" },
  "s-cpp": { brand: siCplusplus },
  "s-python": { brand: siPython },
  "s-git": { brand: siGit },
  "s-agile": { icon: Workflow, color: "#8fc3f5" },
  "s-communication": { icon: MessagesSquare, color: "#ffb27a" },
  "s-speaking": { icon: Mic, color: "#ffb27a" },
  "s-pr": { icon: Megaphone, color: "#ffb27a" },
  "s-events": { icon: CalendarDays, color: "#ffb27a" },
  "s-networking": { icon: Share2, color: "#ffb27a" },
  "s-leadership": { icon: Crown, color: "#ffb27a" },
  "s-teaching": { icon: GraduationCap, color: "#ffb27a" },
  "s-teamwork": { icon: Handshake, color: "#ffb27a" },
  "s-research": { icon: Microscope, color: "#ffb27a" },
};

/** Technologies as named in a project's stack. */
const BY_NAME: Record<string, SimpleIcon> = {
  react: siReact, typescript: siTypescript, javascript: siJavascript, node: siNodedotjs, "node.js": siNodedotjs, express: siExpress,
  postgresql: siPostgresql, mongodb: siMongodb, prisma: siPrisma, jwt: siJsonwebtokens, vercel: siVercel, render: siRender, vite: siVite,
  "ant design": siAntdesign, cloudinary: siCloudinary, "tanstack query + table": siReactquery, "react hook form + zod": siReacthookform, zod: siZod,
};

/** Brand colours too dark to read on the night background are drawn in ivory instead. */
function visible(hex: string) {
  const n = parseInt(hex, 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum < 70 ? "#f4ecdf" : `#${hex}`;
}

function Brand({ icon, size }: { icon: SimpleIcon; size: number }) {
  return (
    <svg role="img" aria-label={icon.title} viewBox="0 0 24 24" width={size} height={size} fill={visible(icon.hex)} className="shrink-0">
      <path d={icon.path} />
    </svg>
  );
}

export function SkillLogo({ id, size = 16 }: { id: string; size?: number }) {
  const logo = BY_SKILL[id];
  if (!logo) return null;
  if ("brand" in logo) return <Brand icon={logo.brand} size={size} />;
  const Icon = logo.icon;
  return <Icon aria-hidden strokeWidth={1.6} width={size} height={size} color={logo.color} className="shrink-0" />;
}

/** Logos for the named technologies in a stack that have one. */
export function stackBrands(stack: string[]) {
  const out: SimpleIcon[] = [];
  for (const s of stack) {
    const key = s.toLowerCase();
    if (key === "pern stack") out.push(siPostgresql, siExpress, siReact, siNodedotjs);
    const b = BY_NAME[key];
    if (b && !out.includes(b)) out.push(b);
  }
  return out;
}

export function BrandLogo({ icon, size = 16 }: { icon: SimpleIcon; size?: number }) {
  return <Brand icon={icon} size={size} />;
}
