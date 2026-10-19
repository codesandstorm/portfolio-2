/**
 * Content model for the constellation. Every entity is a node; relationships
 * are declared as id references on the entity and turned into edges by
 * `graph.ts`. Nothing in the UI declares a relationship itself.
 */

/** Where a claim comes from. Ids map to the research dossier. */
export type SourceId =
  | "li-profile"
  | "li-about"
  | "li-experience"
  | "li-education"
  | "li-certifications"
  | "li-skills"
  | `li-p${number}`
  | "gh-profile"
  | `gh-${string}`;

export type Confidence = "verified" | "inferred";

export type NodeKind =
  | "core"
  | "experience"
  | "project"
  | "skill"
  | "person"
  | "signal"
  | "achievement";

export type SkillFamily = "built" | "human";

export type Skill = {
  id: string;
  name: string;
  family: SkillFamily;
  /** One-line, evidence-based note on how it shows up. */
  note?: string;
  sources: SourceId[];
};

export type Experience = {
  id: string;
  organization: string;
  place?: string;
  role: string;
  period: string;
  /** Sort key, ISO yyyy-mm of start. */
  start: string;
  kind: "internship" | "leadership" | "community" | "education";
  opportunity?: string;
  work: string[];
  people?: string[];
  learning?: string[];
  enabled?: string;
  skills: string[];
  projects?: string[];
  signals?: string[];
  sources: SourceId[];
};

export type ArtifactForm =
  | "lattice"
  | "rings"
  | "loop"
  | "sentinel"
  | "seed"
  | "grid"
  | "arc";

export type Project = {
  id: string;
  name: string;
  tagline: string;
  /** Why it existed / problem — omitted when not evidenced. */
  problem?: string;
  role: string;
  built: string[];
  difficult?: string;
  learned?: string[];
  stack: string[];
  skills: string[];
  experience?: string;
  /** Strength of the experience link. */
  experienceConfidence?: Confidence;
  people?: string[];
  signals?: string[];
  after?: string;
  github?: string;
  live?: boolean;
  period: string;
  status: "live" | "internship" | "built" | "hackathon";
  artifact: { form: ArtifactForm; count: number; countMeaning: string };
  sources: SourceId[];
};

export type PersonRole =
  | "mentor"
  | "clinical"
  | "acknowledged"
  | "co-intern"
  | "teammate"
  | "organiser";

export type Person = {
  id: string;
  name: string;
  role: PersonRole;
  context: string;
  sources: SourceId[];
};

export type LinkedInSignal = {
  id: string;
  /** Post number in the dossier, e.g. 8 for LI-P8. */
  post: number;
  date: string;
  title: string;
  summary: string;
  /** A short line in her words, only where quoted in the dossier. */
  quote?: string;
  featured?: boolean;
  experiences?: string[];
  projects?: string[];
  skills?: string[];
  people?: string[];
  achievements?: string[];
  /** Exact post URL. Undefined until the activity id is re-added. */
  sourceUrl?: string;
};

export type Achievement = {
  id: string;
  title: string;
  result: string;
  date: string;
  detail: string;
  experiences?: string[];
  projects?: string[];
  skills?: string[];
  signals: string[];
};

export type Credential = {
  name: string;
  issuer: string;
  date: string;
  source: SourceId;
};

export type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  sublabel?: string;
};

export type GraphEdge = {
  a: string;
  b: string;
  confidence: Confidence;
};
