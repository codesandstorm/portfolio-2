import { describe, expect, it } from "vitest";
import { answer, SUGGESTIONS } from "./ask";
import { people } from "./data";

describe("ask the constellation", () => {
  it("answers skill questions from the graph and lights the skill", () => {
    const a = answer("Where has she used React?");
    expect(a.focus).toBe("s-react");
    expect(a.chapter).toBe("learn");
    for (const p of ["Enterprise HRMS", "BreastCare AI", "FoodHub"]) expect(a.text).toContain(p);
  });

  it("answers project questions and travels to the project", () => {
    const a = answer("what is PRAHARI?");
    expect(a.focus).toBe("p-prahari");
    expect(a.chapter).toBe("build");
    expect(a.text).toContain("early warnings");
    expect(a.say).toContain("Prahari");
  });

  it("routes internships, wins, leadership and contact", () => {
    expect(answer("Tell me about her internships").chapter).toBe("collaborate");
    expect(answer("What has she won?").text).toContain("Third prize at Tech Kutumb 5.0");
    expect(answer("Show me her leadership").chapter).toBe("lead");
    const c = answer("How do I contact her?");
    expect(c.chapter).toBe("continue");
    expect(c.text).toContain("mahajanakshita03@gmail.com");
  });

  it("says so instead of guessing when it can't ground an answer", () => {
    const a = answer("What is her favourite movie?");
    expect(a.unknown).toBe(true);
    expect(a.text).toMatch(/I only answer from what's verified/);
  });

  it("never names the people she credits", () => {
    const a = answer("Who are her mentors and teammates?");
    expect(a.text).toContain(`${people.length} people`);
    for (const name of ["Saikat", "Sandarbh", "Subhash"]) expect(a.text).not.toContain(name);
  });

  it("has a grounded answer for every suggested question", () => {
    for (const q of SUGGESTIONS) expect(answer(q).unknown, q).toBeFalsy();
  });
});
