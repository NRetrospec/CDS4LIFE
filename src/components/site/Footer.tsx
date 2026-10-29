import Link from "next/link";
import Wordmark from "./Wordmark";
import { SITE } from "@/lib/env";

export default function Footer() {
  return (
    <footer id="contact" className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr_1fr] md:px-8">
        <div>
          <Wordmark />
          <p className="tracked mt-4 max-w-xs text-xs leading-relaxed text-sky/80">{SITE.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <h2 className="tracked mb-3 text-[11px] font-semibold text-sky/70">Shop</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-sky">All products</Link></li>
            <li><Link href="/about" className="hover:text-sky">Our story</Link></li>
            <li><Link href="/cart" className="hover:text-sky">Cart</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="tracked mb-3 text-[11px] font-semibold text-sky/70">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li><a href={SITE.whatsappUrl} className="hover:text-sky">WhatsApp {SITE.whatsapp}</a></li>
            <li><a href={SITE.instagramUrl} className="hover:text-sky">Instagram {SITE.instagram}</a></li>
            <li><a href={`mailto:${SITE.email}`} className="hover:text-sky">{SITE.email}</a></li>
            <li>We ship across the USA</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-6 text-center text-xs leading-relaxed text-white/70 md:px-8">
        <p className="mx-auto max-w-3xl">
          THESE STATEMENTS HAVE NOT BEEN EVALUATED BY THE FDA. THIS PRODUCT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE OR PREVENT ANY DISEASE.
        </p>
        <p className="mt-3">© {new Date().getFullYear()} CDS 4 Life</p>
      </div>
    </footer>
  );
}
