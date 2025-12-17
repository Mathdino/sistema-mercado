"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store";

export default function CleanupCartPage() {
  const { cleanupInvalidItems, items } = useCartStore();

  useEffect(() => {
    console.log("Cleaning up invalid cart items...");
    cleanupInvalidItems();
    console.log("Cart items after cleanup:", items);
  }, [cleanupInvalidItems, items]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cart Cleanup</h1>
      <p>Cleaning up invalid cart items...</p>
      <p>Check the console for details.</p>
    </div>
  );
}