"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { profile } from "@/content/data";
import { useTour } from "@/lib/tour";

/**
 * Her talking portrait (made with a tool like Hedra or HeyGen from her own
 * photo). It renders nothing unless a video is set AND her consent is
 * recorded in `profile.avatar` — a real person's face is never animated
 * without her agreement — and it always says it is AI-animated.
 */
export function AvatarPlayer({ visible }: { visible: boolean }) {
  const { video, consent } = profile.avatar;
  const el = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  if (!video || !consent) return null;

  const play = () => {
    useTour.getState().pause("Paused while Akshita speaks.");
    setPlaying(true);
    requestAnimationFrame(() => void el.current?.play());
  };

  return (
    <>
      <AnimatePresence>
        {playing && (
          <motion.div
            key="avatar"
            className="pointer-events-none absolute left-1/2 top-[1.5%] aspect-square h-[58%] -translate-x-1/2 md:h-[94%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <video
              ref={el}
              src={video}
              playsInline
              onEnded={() => setPlaying(false)}
              className="h-full w-full object-cover [mask-image:radial-gradient(ellipse_at_55%_40%,black_38%,transparent_70%)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {visible && (
        <div className="absolute right-[6vw] top-[38%] flex flex-col items-end gap-1 md:right-[14vw] md:top-[30%]">
          <button
            type="button"
            onClick={playing ? () => (el.current?.pause(), setPlaying(false)) : play}
            className="title-face rounded-full border border-gold/50 px-4 py-2 text-[0.68rem] uppercase tracking-[0.3em] text-ivory hover:border-gold hover:text-gold"
            data-cursor="link"
          >
            {playing ? "■ Stop" : "▸ Hear from Akshita"}
          </button>
          <span className="mono text-[9px] text-faint">AI-animated from her photo, with her permission</span>
        </div>
      )}
    </>
  );
}
