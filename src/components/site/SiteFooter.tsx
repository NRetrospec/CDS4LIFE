"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/** The homepage is the hero alone (its contact bar carries the contact details), so no footer there. */
export default function SiteFooter() {
  const path = usePathname();
  // an open product modal changes the URL but the homepage stays underneath it
  return path === "/" ? null : <Footer />;
}
