"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import IntroSequence from "./IntroSequence";
import { useHeroReady } from "@/components/site/HeroReady";
import { BOTTLE_ART, type Product } from "@/lib/catalog";
import { inkFor, TRUST } from "@/lib/site-content";
import { warmAllWhenIdle, warmViewer } from "@/lib/warm";

const EASE = [0.16, 1, 0.3, 1] as const;
const BOTTLE_STAGGER = 0.09;

/** Everything is in the DOM from first paint; the reveal only animates opacity/transform/blur. */
export default function HomeHero({ products }: { products: Product[] }) {
  const { ready, setReady, skipMotion } = useHeroReady();
  const reduce = !!useReducedMotion() || skipMotion;
  const state = reduce || ready ? "show" : "hide";

  // once the hero is up, fetch the 3D chunk + label art in the background so a click opens instantly
  useEffect(() => {
    if (ready || reduce) warmAllWhenIdle(products.map((p) => p.slug));
  }, [ready, reduce, products]);

  const lockup: Variants = {
    hide: { y: 24, opacity: 0, filter: "blur(6px)" },
    show: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: reduce ? 0 : 0.7, ease: EASE } },
  };
  const bottle: Variants = {
    hide: { y: 90, opacity: 0, scale: 0.94 },
    show: (i: number) => ({
      y: 0, opacity: 1, scale: 1,
      transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 16, delay: 0.12 + i * BOTTLE_STAGGER },
    }),
  };
  const trust: Variants = {
    hide: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.42, ease: "easeOut" } },
  };

  // MMS + Activator are the kit (first two in sortOrder); the badge brackets them
  const kit = products.filter((p) => p.slug === "mms" || p.slug === "activator");
  const rest = products.filter((p) => p.slug !== "mms" && p.slug !== "activator");
  const order = [...kit, ...rest];

  const renderBottle = (p: Product) => {
    const art = BOTTLE_ART[p.slug];
    const idx = order.indexOf(p);
    return (
      <motion.div key={p.slug} custom={idx} variants={bottle} data-reveal className="flex flex-col items-center gap-2.5">
        <Link href={`/products/${p.slug}`} onPointerEnter={() => warmViewer(p.slug)} onFocus={() => warmViewer(p.slug)} onTouchStart={() => warmViewer(p.slug)} className="group flex flex-col items-center gap-2.5 rounded-xl" aria-label={`${p.name} — ${p.volume}`}>
          {art && (
            <Image
              src={`/bottles/${p.slug}@2x.webp`}
              alt={art.alt}
              width={art.w}
              height={art.h}
              priority
              sizes="(max-width: 767px) 22vw, 320px"
              className="bottle-shadow w-auto transition-transform duration-300 group-hover:-translate-y-1"
              style={{ height: `calc(var(--bh) * ${art.rel.toFixed(4)})` }}
            />
          )}
          <span
            className="rounded-full px-4 py-1 text-xs font-extrabold uppercase tracking-wide md:px-6 md:py-1.5 md:text-base"
            style={{ background: p.pillColor, color: inkFor(p.pillColor) }}
          >
            {p.name}
          </span>
        </Link>
      </motion.div>
    );
  };

  return (
    <section
      id="hero"
      className="relative isolate h-[100svh] min-h-[640px] overflow-hidden text-navy [--bh:clamp(120px,27svh,330px)] md:[--bh:clamp(170px,31svh,340px)] min-[1600px]:[--bh:clamp(300px,36svh,520px)] min-[2200px]:[--bh:clamp(400px,40svh,760px)]"
      aria-label="CDS 4 Life"
    >
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}`}</style>
      </noscript>
      <IntroSequence onHeroReady={setReady} />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center px-4 pb-6 pt-[76px] md:px-8 md:pb-10">
        <motion.div initial="hide" animate={state} variants={lockup} data-reveal className="mt-[2svh] text-center md:mt-[4svh]">
          <Image src="/brand/logo.webp" alt="" width={266} height={230} className="mx-auto mb-2 h-[9svh] min-h-10 w-auto md:h-[11svh]" priority />
          <h1 className="font-display text-[clamp(2.4rem,7vw,5.5rem)] font-extrabold uppercase leading-none tracking-tight [text-shadow:0_2px_24px_rgba(255,255,255,.55)]">
            CDS 4 Life
          </h1>
          <p className="tracked mx-auto mt-3 max-w-[22ch] text-[11px] font-bold sm:max-w-none md:text-base [text-shadow:0_1px_14px_rgba(255,255,255,.7)]">
            Pure Solutions. Powerful Results. Naturally.
          </p>
        </motion.div>

        <motion.div initial="hide" animate={state} className="relative mt-auto w-full max-w-[1500px]">
          {/* kit bracket spans the first two columns; small, and hidden on short screens so it never touches the title */}
          <motion.div
            data-reveal
            variants={{ hide: { opacity: 0 }, show: { opacity: 1, transition: { duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.35 } } }}
            className="pointer-events-none absolute left-[3%] top-0 hidden h-10 w-[44%] rounded-t-xl border border-b-0 border-white/70 sm:block [@media(max-height:760px)]:!hidden"
            aria-hidden="true"
          />
          <motion.p
            data-reveal
            variants={{ hide: { opacity: 0 }, show: { opacity: 1, transition: { duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.35 } } }}
            className="absolute left-[25%] top-0 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-navy px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white sm:block md:text-xs [@media(max-height:760px)]:!hidden"
          >
            MMS &amp; Activator Kit
          </motion.p>
          <div className="grid grid-cols-4 items-end justify-items-center gap-2 sm:pt-12 [@media(max-height:760px)]:sm:pt-0">
            {order.map(renderBottle)}
          </div>
        </motion.div>

        <motion.ul
          initial="hide"
          animate={state}
          variants={trust}
          data-reveal
          aria-label="Why CDS 4 Life"
          className="mt-4 grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-2 rounded-2xl bg-navy/60 px-5 py-3 text-white backdrop-blur-md md:mt-6 md:flex md:w-auto md:max-w-none md:justify-center md:gap-10 md:rounded-full md:px-8"
        >
          {TRUST.map((t) => (
            <li key={t.key} className="flex items-center gap-2.5">
              <Image src={t.src} alt="" width={t.w} height={t.h} className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
              <span className="text-xs font-bold md:text-sm">{t.label}</span>
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div
        initial="hide"
        animate={state}
        variants={trust}
        data-reveal
        className="pointer-events-none absolute bottom-6 right-3 z-10 md:bottom-10 md:right-8 min-[1600px]:right-16"
      >
        <Image
          src="/stickers/lab.webp"
          alt="Lab Tested — Quality Assured"
          width={186}
          height={185}
          className="h-[72px] w-[72px] drop-shadow-[0_8px_16px_rgba(0,25,52,0.35)] sm:h-24 sm:w-24 md:h-32 md:w-32 min-[1600px]:h-44 min-[1600px]:w-44"
        />
      </motion.div>

    </section>
  );
}
