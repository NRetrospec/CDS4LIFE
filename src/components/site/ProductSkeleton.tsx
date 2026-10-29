import Image from "next/image";

/** Shown while a product route streams in: the logo swipes while grey blocks hold the layout. */
export default function ProductSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
      <span className="sr-only">Loading product</span>
      <div className="relative mx-auto grid aspect-[1/1.16] max-h-[78svh] w-full place-items-center">
        <span className="logo-swipe h-24 sm:h-32" aria-hidden="true">
          <Image src="/brand/logo.webp" alt="" width={266} height={230} priority />
          <Image src="/brand/logo.webp" alt="" width={266} height={230} priority />
        </span>
      </div>
      <div className="space-y-4 lg:pt-24" aria-hidden="true">
        <div className="skel h-5 w-full" />
        <div className="skel h-5 w-11/12" />
        <div className="skel h-5 w-2/3" />
        <div className="skel mt-6 h-9 w-32" />
        <div className="mt-6 flex gap-3">
          <div className="skel h-12 w-40 !rounded-full" />
          <div className="skel h-12 w-40 !rounded-full" />
        </div>
        <div className="skel mt-8 h-14 w-full" />
        <div className="skel h-14 w-full" />
        <div className="skel h-14 w-full" />
      </div>
    </div>
  );
}
