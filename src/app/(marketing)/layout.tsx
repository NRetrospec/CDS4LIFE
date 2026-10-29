import { HeroReadyProvider } from "@/components/site/HeroReady";
import TransparentHeader from "@/components/site/TransparentHeader";
import SiteFooter from "@/components/site/SiteFooter";

export default function MarketingLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <HeroReadyProvider>
      <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-[60] rounded-full bg-sky px-4 py-2 text-sm font-bold text-navy">
        Skip to content
      </a>
      <TransparentHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      {modal}
    </HeroReadyProvider>
  );
}
