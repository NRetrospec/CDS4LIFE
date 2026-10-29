import Image from "next/image";
import Link from "next/link";

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label="CDS 4 Life — home">
      <Image src="/brand/logo.webp" alt="" width={266} height={230} className="h-8 w-auto" />
      <span className="font-display text-xl font-extrabold tracking-tight">CDS 4 Life</span>
    </Link>
  );
}
