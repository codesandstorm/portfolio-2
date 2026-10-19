/**
 * The guided tour: one narrated stop per moment of the story. `text` is the
 * caption shown on screen; `say` (when present) is the same sentence spelled
 * for the narrator's pronunciation. Every claim comes from data.ts / the
 * research dossier. Scroll runs from `from` to `to` while the stop plays.
 */
import type { ChapterId } from "@/lib/chapters";

export type TourStop = {
  id: string;
  from: [ChapterId, number];
  to: [ChapterId, number];
  text: string;
  say?: string;
};

export const TOUR_DISCLOSURE = "Narrated by an AI voice generated with ElevenLabs — not Akshita's voice.";

export const tour: TourStop[] = [
  {
    id: "01-forces",
    from: ["signal", 0],
    to: ["signal", 0],
    text: "This is Akshita Mahajan. Two forces meet in her. Fire — her voice, her confidence, her will to act. And ice — the clarity and structure of an engineer. Where they collide, she begins.",
  },
  {
    id: "02-start",
    from: ["start", 0],
    to: ["start", 1],
    text: "About a year before IIT Indore, she was the quiet student in class, still learning JavaScript. She built projects, applied every day, and took the rejections. Then four internship offers arrived in fifteen days.",
  },
  {
    id: "03-akshita",
    from: ["akshita", 0.15],
    to: ["akshita", 1.12],
    text: "She studies computer science at Symbiosis University of Applied Sciences in Indore — a full-stack engineer whose headline closes with two words: public speaker. And every point of her becomes a connection.",
  },
  {
    id: "04-connect",
    from: ["connect", 0],
    to: ["connect", 1],
    text: "Nearly every post she writes ends by naming the people who helped her — mentors, co-interns, teammates, organisers. Twenty-two of them hold this network together.",
  },
  {
    id: "05-collaborate",
    from: ["collaborate", 0.6],
    to: ["collaborate", 1],
    text: "At i-SOFTZONE she built and deployed an HRMS on the PERN stack. At IIT Indore she worked on an AI platform for breast cancer detection, validated with a radiation oncologist at AIIMS Bhopal. What she took away: trust my ideas, take ownership, ask better questions.",
    say: "At i SOFTZONE she built and deployed an H R M S on the PERN stack. At I I T Indore she worked on an A I platform for breast cancer detection, validated with a radiation oncologist at AIIMS Bhopal. What she took away: trust my ideas, take ownership, ask better questions.",
  },
  {
    id: "06-build",
    from: ["build", 0],
    to: ["build", 0.14],
    text: "Her flagship is an enterprise HRMS with thirty-three data models, live on Vercel and Render. Every project here has a small demo — try its permission matrix yourself.",
    say: "Her flagship is an enterprise H R M S with thirty-three data models, live on Vercel and Render. Every project here has a small demo — try its permission matrix yourself.",
  },
  {
    id: "07-hackathons",
    from: ["build", 0.57],
    to: ["build", 0.85],
    text: "PRAHARI built early warnings for major infrastructure projects in twenty-four hours. PrakritiOS didn't win the first time — the team refined it, came back, and placed third.",
    say: "Prahari built early warnings for major infrastructure projects in twenty-four hours. Prakriti O S didn't win the first time — the team refined it, came back, and placed third.",
  },
  {
    id: "08-learn",
    from: ["learn", 0],
    to: ["learn", 1],
    text: "There are no skill bars here. Every skill is a point of light with a thread to the places she used it. Choose one, and the energy shows you where.",
  },
  {
    id: "09-lead",
    from: ["lead", 0.42],
    to: ["lead", 1],
    text: "She coordinated the first ISRO exhibition in Madhya Pradesh, anchored a thirty-six-hour hackathon, taught technology in rural schools, and represented her university at the IEEE Student Leadership Congress. Her sign-off: connect, collaborate, learn, lead.",
    say: "She coordinated the first ISRO exhibition in Madhya Pradesh, anchored a thirty-six-hour hackathon, taught technology in rural schools, and represented her university at the I triple E Student Leadership Congress. Her sign-off: connect, collaborate, learn, lead.",
  },
  {
    id: "10-converge",
    from: ["converge", 0],
    to: ["converge", 1],
    text: "Here, achievements are the moments where paths meet: four offers in fifteen days, third place for PrakritiOS, third prize at Tech Kutumb, and the first ISRO exhibition in her state.",
    say: "Here, achievements are the moments where paths meet: four offers in fifteen days, third place for Prakriti O S, third prize at Tech Kutumb, and the first ISRO exhibition in her state.",
  },
  {
    id: "11-continue",
    from: ["continue", 0.1],
    to: ["continue", 0.6],
    text: "Two forces became one person. One person became a network. The next connection hasn't been made yet — draw it, and continue it on LinkedIn.",
  },
];

/**
 * The recruiter cut: about a minute, the facts a hiring manager asks first.
 * Same rules — every claim from the research.
 */
export const recruiterTour: TourStop[] = [
  {
    id: "r1-who",
    from: ["signal", 0],
    to: ["signal", 0],
    text: "Akshita Mahajan: a full-stack engineer and public speaker from Indore, studying computer science at Symbiosis University of Applied Sciences.",
  },
  {
    id: "r2-work",
    from: ["collaborate", 0.6],
    to: ["collaborate", 1],
    text: "She has interned twice as a full-stack engineer — at i-SOFTZONE, where she built and deployed an HRMS, and at IIT Indore, on an AI platform for breast cancer detection.",
    say: "She has interned twice as a full-stack engineer — at i SOFTZONE, where she built and deployed an H R M S, and at I I T Indore, on an A I platform for breast cancer detection.",
  },
  {
    id: "r3-build",
    from: ["build", 0],
    to: ["build", 0.14],
    text: "Her flagship HRMS has thirty-three data models and runs live. Every project here has a demo you can try.",
    say: "Her flagship H R M S has thirty-three data models and runs live. Every project here has a demo you can try.",
  },
  {
    id: "r4-lead",
    from: ["lead", 0.42],
    to: ["lead", 1],
    text: "She leads, too: Membership Development Vice Chair at ACM-W, coordinator of the first ISRO exhibition in Madhya Pradesh, and anchor of a thirty-six-hour hackathon.",
    say: "She leads, too: Membership Development Vice Chair at A C M W, coordinator of the first ISRO exhibition in Madhya Pradesh, and anchor of a thirty-six-hour hackathon.",
  },
  {
    id: "r5-results",
    from: ["converge", 0],
    to: ["converge", 0.6],
    text: "Third place at two hackathons, and four internship offers in fifteen days.",
  },
  {
    id: "r6-next",
    from: ["continue", 0.1],
    to: ["continue", 0.6],
    text: "If you're hiring a full-stack engineer who can also hold a room, the next step is yours — connect with her on LinkedIn.",
  },
];

export type TourVariant = "full" | "recruiter";
export const tours: Record<TourVariant, TourStop[]> = { full: tour, recruiter: recruiterTour };
export const TOUR_LENGTH: Record<TourVariant, string> = { full: "about 2½ minutes", recruiter: "about a minute" };
