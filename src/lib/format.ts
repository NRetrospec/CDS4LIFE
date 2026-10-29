export function formatPrice(cents: number, currency = "USD"): string | null {
  if (!cents) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
