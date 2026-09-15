import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A video that plays itself, quietly and only when someone is looking.
 *
 * Three things have to be true before a browser will start a video on its
 * own: it must be muted, it must be inline, and the muting must have reached
 * the element as a property rather than only as markup. The `muted` prop at
 * each call site covers the first; the effect below covers the third, which
 * React is unreliable about across a prerendered island's hydration.
 *
 * `observe` is what separates the two places this is used. In the grid every
 * card is a video, so playback follows the viewport: nothing downloads or
 * decodes until its tile is actually on screen, which is what keeps a page
 * of clips from costing a reader on cell data the whole gallery at once. In
 * the lightbox there is one video and it has the screen, so it simply plays.
 */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Enough of the tile showing to be worth playing. */
const VISIBLE_ENOUGH = 0.35;

export const useMutedAutoplay = (observe: boolean) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [wanted, setWanted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (video) video.muted = true;
  }, []);

  // Someone who asks their system for less movement gets a still poster and
  // a play button, not a loop they have to chase down.
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION).matches) setWanted(false);
  }, []);

  // The label has to say what the video is doing, not what we asked it to
  // do: autoplay can be refused outright, and the lightbox's native controls
  // pause without going through us.
  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    const sync = () => setPlaying(!video.paused);
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    sync();
    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
    };
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    // A refused play is normal — a background tab, a data-saver setting —
    // and leaves the poster showing, which is a fine thing to be left with.
    const start = () => void video.play().catch(() => undefined);

    if (!observe) {
      if (wanted) start();
      else video.pause();
      return undefined;
    }

    const watcher = new IntersectionObserver(
      (entries) => {
        const onScreen = entries[entries.length - 1]?.isIntersecting ?? false;
        if (onScreen && wanted) start();
        else video.pause();
      },
      { threshold: VISIBLE_ENOUGH },
    );
    watcher.observe(video);
    return () => watcher.disconnect();
  }, [observe, wanted]);

  const toggle = useCallback(() => setWanted((current) => !current), []);

  return { ref, playing, toggle };
};
