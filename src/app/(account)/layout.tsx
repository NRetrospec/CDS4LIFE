import { HeroReadyProvider } from "@/components/site/HeroReady";
import TransparentHeader from "@/components/site/TransparentHeader";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeroReadyProvider>
      <TransparentHeader />
      <main id="main" className="on-light mx-auto max-w-5xl px-5 pb-24 pt-32 md:px-8">
        {children}
      </main>
    </HeroReadyProvider>
  );
}
