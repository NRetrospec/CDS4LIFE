import { redirect } from "next/navigation";

// The wishlist lives in the account area; this route is kept for direct links.
export default function WishlistPage() {
  redirect("/account");
}
