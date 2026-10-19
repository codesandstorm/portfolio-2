"use client";

import { people } from "@/content/data";
import { getBridgePeople, getNeighbors, getNode, getStoriesForPerson, joinWords, stats } from "@/content/graph";
import { useUI } from "@/lib/store";
import { Chapter, Kicker, useFlow } from "./Chapter";

const groups = [
  { title: "IIT Indore", host: "x-iit" },
  { title: "PRAHARI", host: "p-prahari" },
  { title: "PrakritiOS", host: "p-prakriti" },
  { title: "ISRO exhibition, SUAS", host: "sig-p20" },
];

/** 03 — Connect. The people she names, as a living graph. */
export function ConnectChapter() {
  const flow = useFlow();
  const select = useUI((s) => s.select);
  const bridges = getBridgePeople();

  return (
    <Chapter id="connect" scrim="left">
      <div className={flow ? "mx-auto max-w-5xl" : "flex h-full flex-col justify-between pb-[8svh] pt-[16svh]"}>
        <div className="max-w-[28rem]">
          <Kicker id="connect" />
          <h2 id="connect-title" className="display mt-5 text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.98] text-ivory">
            She names <span className="italic text-gold">people.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-mist">
            Nearly every post she writes ends with a list of names<span className="hidden sm:inline"> — mentors, co-interns, teammates, organisers</span>. Here are the{" "}
            <span className="text-ivory">{stats.people} people</span> she has named across{" "}
            <span className="text-ivory">{stats.postsNamingPeople} posts</span>
            <span className="hidden sm:inline">, held in place by the stories they share with her</span>.
          </p>
          {!flow && (
            <>
              <p className="mono mt-5 text-faint [@media(pointer:coarse)]:hidden">Hover a name · click to follow its threads · drag to turn the network</p>
              <p className="mono mt-4 hidden text-faint [@media(pointer:coarse)]:block">Tap a name to follow its threads</p>
            </>
          )}
        </div>

        {bridges.length > 0 && (
          <p className="max-w-[24rem] border-l border-gold/50 pl-4 text-sm leading-relaxed text-mist">
            <span className="mono mb-1 block text-gold">Bridges</span>
            <button type="button" className="text-ivory underline decoration-gold/40 underline-offset-4 hover:text-gold" onClick={() => select(bridges[0].id)} data-cursor="link">
              One person
            </button>{" "}
            runs through two of her stories — {joinWords(getStoriesForPerson(bridges[0].id).map((h) => getNode(h)?.label ?? ""))}. The network bends back on itself.
          </p>
        )}

        {flow && (
          <div className="mt-12 grid gap-10 sm:grid-cols-2">
            {groups.map((g) => {
              const ids = getNeighbors(g.host, "person");
              return (
                <div key={g.host}>
                  <h3 className="mono text-gold">{g.title}</h3>
                  <ul className="mt-3 space-y-1">
                    {ids.map((id) => {
                      const p = people.find((x) => x.id === id)!;
                      return (
                        <li key={id}>
                          <button type="button" className="text-left text-ivory/90 hover:text-gold" onClick={() => select(id)} data-cursor="link">
                            {p.name} <span className="text-faint">— {p.context}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Chapter>
  );
}
