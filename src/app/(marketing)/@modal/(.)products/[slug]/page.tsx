import { Suspense } from "react";
import Modal from "@/components/site/Modal";
import ProductView from "@/components/site/ProductView";
import ProductSkeleton from "@/components/site/ProductSkeleton";

export const revalidate = 60;

// The glass shell paints immediately; the product streams into it behind the skeleton.
export default async function ProductModal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Modal label="Product details">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView slug={slug} />
      </Suspense>
    </Modal>
  );
}
