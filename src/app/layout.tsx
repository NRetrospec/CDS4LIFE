import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { CartProvider } from "@/components/site/CartProvider";
import CartSync from "@/components/site/CartSync";
import { HAS_CLERK, HAS_CONVEX, SITE } from "@/lib/env";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Inter_Tight({ subsets: ["latin"], variable: "--font-display", weight: ["800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: "CDS 4 Life: MMS, Activator, CDS and DMSO. We ship across the USA.",
  openGraph: { title: SITE.name, description: SITE.tagline, images: ["/video/poster-2.jpg"], type: "website" },
};
export const viewport: Viewport = { themeColor: "#001934", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const app = (
    <ConvexClientProvider>
      <CartProvider>
        {HAS_CLERK && HAS_CONVEX && <CartSync />}
        {children}
      </CartProvider>
    </ConvexClientProvider>
  );
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        {HAS_CLERK ? <ClerkProvider>{app}</ClerkProvider> : app}
        <Analytics />
      </body>
    </html>
  );
}
