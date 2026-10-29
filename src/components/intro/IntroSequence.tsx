"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Image from "next/image";

/**
 * PLAYING1 --video 1 ended--> LOOPING2 --scroll / 1s idle--> COMPLETE
 *
 * Video 1's last frame and video 2's first frame are the same shot, so the handoff is a hard
 * swap (never a crossfade): video 2 is buffered under video 1, plays at `ended`, and video 1
 * is hidden on video 2's first `playing` event. `onHeroReady` fires at that moment and
 * drives the whole content reveal.
 */
type Phase = "playing1" | "looping2" | "complete";
type Action = "ended1" | "settle";
type Mode = "video" | "loop" | "poster"; // loop = returning visitor, poster = intro skipped

const SEEN_KEY = "cds-intro-seen";
const START_TIMEOUT_MS = 4000;
const HANDOFF_GRACE_MS = 250; // reveal anyway if video 2 is not rolling this soon after video 1 ends
const IDLE_SETTLE_MS = 1000;
const LOOP_RATE = 0.75; // the looping backdrop plays slower than real time

const reducer = (phase: Phase, a: Action): Phase => {
  if (a === "ended1") return phase === "playing1" ? "looping2" : phase;
  return "complete";
};

const videoSrc = (n: 1 | 2, hi: boolean) => `/video/intro-${n}-${hi ? 1080 : 720}.mp4`;

function shouldSkipVideo(): boolean {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (c.saveData === true || ["slow-2g", "2g", "3g"].includes(c.effectiveType ?? ""));
}

export default function IntroSequence({ onHeroReady }: { onHeroReady: (instant: boolean) => void }) {
  const [phase, dispatch] = useReducer(reducer, "playing1");
  const [mode, setMode] = useState<Mode>("video");
  const [v1Hidden, setV1Hidden] = useState(false);
  const v1 = useRef<HTMLVideoElement>(null);
  const v2 = useRef<HTMLVideoElement>(null);
  const fired = useRef(false);
  const readyCb = useRef(onHeroReady);
  readyCb.current = onHeroReady;
  const hi = useRef(true);

  const fireReady = useCallback((instant: boolean) => {
    if (fired.current) return;
    fired.current = true;
    readyCb.current(instant);
  }, []);

  // Anything that stops the intro from running: show poster-2 and the content, now.
  const skipToPoster = useCallback(() => {
    setMode("poster");
    dispatch("settle");
    fireReady(true);
  }, [fireReady]);

  // video 2 under video 1: attach the source only once video 1 is buffered so they never compete
  const loadV2 = useCallback(() => {
    const el = v2.current;
    if (!el || el.getAttribute("src")) return;
    el.src = videoSrc(2, hi.current);
    el.load();
  }, []);

  // ── boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    hi.current = matchMedia("(min-width: 1000px)").matches;
    if (v2.current) v2.current.defaultPlaybackRate = v2.current.playbackRate = LOOP_RATE;

    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch {}

    if (shouldSkipVideo()) return skipToPoster();

    if (seen) {
      // returning visitor: no intro, but keep the living backdrop if autoplay allows it
      setMode("loop");
      dispatch("settle");
      fireReady(true);
      const el = v2.current;
      if (el) {
        el.src = videoSrc(2, hi.current);
        el.play().catch((e) => { if (e?.name === "NotAllowedError") setMode("poster"); });
      }
      return;
    }

    const el = v1.current;
    if (!el) return;
    el.src = videoSrc(1, hi.current);
    const timeout = setTimeout(skipToPoster, START_TIMEOUT_MS); // never started: do not strand the user
    const started = () => clearTimeout(timeout);
    el.addEventListener("playing", started, { once: true });
    el.play().catch(() => { clearTimeout(timeout); skipToPoster(); }); // autoplay blocked
    return () => { clearTimeout(timeout); el.removeEventListener("playing", started); };
  }, [skipToPoster, fireReady]);

  // ── handoff ─────────────────────────────────────────────────────────────
  const onEnded1 = useCallback(() => {
    dispatch("ended1");
    const el = v2.current;
    if (!el) { fireReady(false); return; }
    if (!el.getAttribute("src")) {
      // video 1 never reached canplaythrough: reveal over its last frame, roll video 2 when it can
      fireReady(false);
      loadV2();
      el.addEventListener("canplay", () => el.play().catch(() => dispatch("settle")), { once: true });
      return;
    }
    el.currentTime = 0;
    const grace = setTimeout(() => fireReady(false), HANDOFF_GRACE_MS);
    el.play().catch(() => { clearTimeout(grace); fireReady(true); dispatch("settle"); });
  }, [fireReady, loadV2]);

  const onPlaying2 = useCallback(() => {
    if (v2.current) v2.current.playbackRate = LOOP_RATE;
    if (mode !== "video") return;
    setV1Hidden(true); // instant swap, same frame
    fireReady(false);
  }, [mode, fireReady]);

  // ── LOOPING2 -> COMPLETE: first scroll/interaction, or 1s of idle ───────────
  useEffect(() => {
    if (phase !== "looping2") return;
    const settle = () => dispatch("settle");
    const idle = setTimeout(settle, IDLE_SETTLE_MS);
    const evts = ["scroll", "wheel", "touchmove", "keydown"] as const;
    evts.forEach((e) => window.addEventListener(e, settle, { passive: true, once: true }));
    return () => { clearTimeout(idle); evts.forEach((e) => window.removeEventListener(e, settle)); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "complete") return;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
  }, [phase]);

  // The backdrop must always loop: revive video 2 if the browser paused it (bfcache, tab switch, stall)
  useEffect(() => {
    if (mode === "poster" || phase === "playing1") return;
    const revive = () => {
      const el = v2.current;
      if (el && el.getAttribute("src") && el.paused && document.visibilityState === "visible") {
        el.play().catch(() => {});
      }
    };
    const t = setInterval(revive, 1000);
    document.addEventListener("visibilitychange", revive);
    window.addEventListener("pageshow", revive);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", revive);
      window.removeEventListener("pageshow", revive);
    };
  }, [mode, phase]);

  const fill = "absolute inset-0 h-full w-full object-cover";
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy" data-intro-phase={phase} data-intro-mode={mode} aria-hidden="true">
      <Image
        src="/video/poster-1.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="intro-poster-1 object-cover"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/video/poster-2.jpg"
        alt=""
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
        className={`intro-poster-2 ${fill}`}
        style={mode === "poster" || mode === "loop" ? { display: "block" } : undefined}
      />
      {mode !== "poster" && (
        <>
          <video
            ref={v2}
            className={`intro-video ${fill}`}
            muted
            loop
            playsInline
            preload="none"
            onPlaying={onPlaying2}
          />
          {mode === "video" && (
            <video
              ref={v1}
              className={`intro-video ${fill}`}
              style={{ opacity: v1Hidden ? 0 : 1 }}
              muted
              autoPlay
              playsInline
              preload="auto"
              onCanPlayThrough={loadV2}
              onEnded={onEnded1}
              onError={skipToPoster}
            />
          )}
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/25 via-transparent to-navy/10" />
    </div>
  );
}
