"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/** Frutiger-Aero glass dialog. Rendered by the intercepted /products/[slug] route, so the URL is shareable. */
export default function Modal({ children, label }: { children: React.ReactNode; label: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => router.back();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.back();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [router]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-6"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.25 }}
    >
      <div className="aero-backdrop absolute inset-0" onClick={close} aria-hidden="true" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="aero-modal on-light relative max-h-[94svh] w-full max-w-6xl overflow-y-auto overscroll-contain"
        initial={reduce ? false : { opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 20 }}
      >
        <span className="aero-bubble left-[6%] top-[14%] h-24 w-24" aria-hidden="true" />
        <span className="aero-bubble bottom-[10%] right-[4%] h-40 w-40" aria-hidden="true" />
        <span className="aero-bubble right-[30%] top-[4%] h-10 w-10" aria-hidden="true" />
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="aero-close sticky right-3 top-3 z-20 float-right m-3 grid h-11 w-11 place-items-center rounded-full text-2xl leading-none"
        >
          &times;
        </button>
        <div className="relative z-10 px-5 pb-10 pt-6 sm:px-9">{children}</div>
      </motion.div>
    </motion.div>
  );
}
