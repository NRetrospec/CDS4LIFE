"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SITE } from "@/lib/env";
import { InstagramIcon, MailIcon, TruckIcon, WhatsAppIcon } from "./Icons";

const ROWS = [
  { label: "WhatsApp", value: SITE.whatsapp, href: SITE.whatsappUrl, icon: <WhatsAppIcon /> },
  { label: "Instagram", value: SITE.instagram, href: SITE.instagramUrl, icon: <InstagramIcon /> },
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}`, icon: <MailIcon /> },
  { label: "We ship", value: "Across the USA", href: undefined, icon: <TruckIcon /> },
];

/** The contact details, opened from the header's Contact link on any page. */
export default function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <div className="aero-backdrop absolute inset-0" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Contact CDS 4 Life"
            className="aero-modal on-light relative w-full max-w-md px-6 pb-8 pt-6"
            initial={reduce ? false : { y: 24, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 20 }}
          >
            <span className="aero-bubble -right-3 -top-3 h-16 w-16" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">Contact</h2>
                <button ref={closeRef} onClick={onClose} aria-label="Close" className="aero-close grid h-10 w-10 place-items-center rounded-full text-2xl leading-none">
                  &times;
                </button>
              </div>
              <ul className="mt-6 space-y-3">
                {ROWS.map((r) => {
                  const inner = (
                    <>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-white">{r.icon}</span>
                      <span>
                        <span className="tracked block text-xs font-extrabold text-navy">{r.label}</span>
                        <span className="block text-lg font-extrabold text-navy">{r.value}</span>
                      </span>
                    </>
                  );
                  const cls = "flex items-center gap-4 rounded-2xl border border-white bg-white/90 px-4 py-3";
                  return (
                    <li key={r.label}>
                      {r.href ? (
                        <a href={r.href} className={`${cls} transition hover:bg-white`} {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                          {inner}
                        </a>
                      ) : (
                        <div className={cls}>{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
