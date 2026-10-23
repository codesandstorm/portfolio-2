/**
 * Suggests how a new LinkedIn post fits the portfolio — what kind of post it
 * is, a short title and summary, and which of her listed skills and projects
 * it shows. Only a suggestion: she reviews every field before publishing.
 * Server only; needs ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { projects, skills } from "@/content/data";

const Suggestion = z.object({
  kind: z.enum(["update", "achievement", "participation", "certification"]),
  title: z.string(),
  summary: z.string(),
  quote: z.string().nullable(),
  achievement: z.object({ result: z.string(), title: z.string(), detail: z.string() }).nullable(),
  role: z.string().nullable(),
  certification: z.object({ name: z.string(), issuer: z.string() }).nullable(),
  skills: z.array(z.string()),
  newSkills: z.array(z.string()),
  projects: z.array(z.string()),
});
export type Suggestion = z.infer<typeof Suggestion>;

const SYSTEM = `You file Akshita Mahajan's LinkedIn posts into her portfolio website. She is a CSIT student and full-stack developer from Indore.

Given one post, decide:
- kind: "achievement" if she won, placed, was selected, or reached a measurable milestone; "participation" if she took part in, attended, organised, anchored or taught at an event without a placing; "certification" if it announces a certificate or course completion; otherwise "update".
- title: 2-7 words naming the event or subject, no emojis.
- summary: one or two plain sentences in the third person ("She…"), only facts stated in the post.
- quote: a short line in her own words from the post if one stands out, else null.
- achievement: only for kind "achievement" — result is the headline outcome in 1-3 words ("3rd place", "Top 2,000"), title names what it was, detail is one sentence. Otherwise null.
- role: only for kind "participation" — what she did there in a few words. Otherwise null.
- certification: only for kind "certification" — the certificate's name and issuer. Otherwise null.
- skills: ids from the skill list below that the post clearly shows her using. Never invent ids.
- newSkills: skills the post clearly shows that are not in the list, as short names (at most 3). Usually empty.
- projects: ids from the project list below that the post is about. Never invent ids.

Never add facts the post does not state. People she names are not needed.`;

const catalogue = () =>
  [
    "Skills (id: name):",
    ...skills.map((s) => `${s.id}: ${s.name}`),
    "",
    "Projects (id: name):",
    ...projects.map((p) => `${p.id}: ${p.name}`),
  ].join("\n");

export function taggerConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function suggest(post: { url: string; title: string; text: string }): Promise<Suggestion | null> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    // Filing one short post is light work.
    output_config: { effort: "low", format: zodOutputFormat(Suggestion) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `${catalogue()}\n\nPost URL: ${post.url}\nPost title: ${post.title || "(none)"}\nPost text:\n${post.text}`,
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const s = response.parsed_output;
  // Keep only ids the site knows, whatever came back.
  const skillIds = new Set(skills.map((k) => k.id));
  const projectIds = new Set(projects.map((p) => p.id));
  return { ...s, skills: s.skills.filter((id) => skillIds.has(id)), projects: s.projects.filter((id) => projectIds.has(id)), newSkills: s.newSkills.slice(0, 3) };
}
