"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Wordmark from "./Wordmark";
import AccountMenu from "./AccountMenu";
import { useHeroReady } from "./HeroReady";
import { useCart } from "./CartProvider";
import ContactDialog from "./ContactDialog";
import { CartIcon, CloseIcon, MenuIcon } from "./Icons";

const NAV = [
  { href: "/products", label: "Shop" },
  { href: "/about", label: "Our Story" },
];

export default function TransparentHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const pathname = usePathname();
  const { ready, skipMotion } = useHeroReady();
  const reduce = useReducedMotion() || skipMotion;
  const { count } = useCart();
  const solid = scrolled || pathname !== "/" || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <motion.header
      initial={false}
      animate={reduce || ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
      transition={{ duration: reduce ? 0 : 0.5 }}
      className="fixed inset-x-0 top-0 z-50 text-white"
      style={{
        background: solid ? "rgba(0,25,52,0.72)" : "linear-gradient(to bottom, rgba(0,25,52,0.5), rgba(0,25,52,0))",
        backdropFilter: solid ? "blur(18px)" : "none",
        WebkitBackdropFilter: solid ? "blur(18px)" : "none",
        borderBottom: solid ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
        transition: "background 260ms, backdrop-filter 260ms, border-color 260ms",
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 md:px-8">
        <Wordmark />
        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="text-sm font-semibold tracking-wide hover:text-sky">
              {n.label}
            </Link>
          ))}
          <button onClick={() => setContactOpen(true)} className="text-sm font-semibold tracking-wide hover:text-sky">Contact</button>
        </nav>
        <div className="flex items-center gap-1">
          <AccountMenu />
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-sky px-1 text-[10px] font-bold text-navy">
                {count}
              </span>
            )}
          </Link>
          <button
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="flex flex-col gap-1 px-5 pb-5 md:hidden">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="rounded-lg px-2 py-3 text-base font-semibold hover:bg-white/10">
              {n.label}
            </Link>
          ))}
          <button onClick={() => { setOpen(false); setContactOpen(true); }} className="rounded-lg px-2 py-3 text-left text-base font-semibold hover:bg-white/10">Contact</button>
        </nav>
      )}
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </motion.header>
  );
}
