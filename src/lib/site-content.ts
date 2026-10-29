/** Copy comes from the badge artwork only. Titles, no sub-lines: the sub-lines in the reference are claims. */
export const TRUST = [
  { key: "natural", label: "100% Natural", src: "/stickers/natural.webp", w: 76, h: 75 },
  { key: "quality", label: "Premium Quality", src: "/stickers/quality.webp", w: 75, h: 76 },
  { key: "trusted", label: "Trusted Solutions", src: "/stickers/trusted.webp", w: 76, h: 76 },
  { key: "wellness", label: "For Your Wellness", src: "/stickers/wellness.webp", w: 76, h: 76 },
] as const;

export const VALUES = [
  { title: "Quality", body: "High-quality products you can trust." },
  { title: "Purity", body: "Purity, consistency, and safe preparation in everything we do." },
  { title: "Education", body: "We believe knowledge empowers better choices." },
  { title: "Transparency", body: "Building trust through honesty, integrity, and real results." },
  { title: "Community", body: "We grow together by supporting each other's wellness journey." },
] as const;

/** Readable ink for a pill background (WCAG-ish luminance split). */
export function inkFor(hex: string): "#001934" | "#ffffff" {
  const n = parseInt(hex.replace("#", ""), 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return L > 0.3 ? "#001934" : "#ffffff";
}
