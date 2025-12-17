"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export default function CartDebugPage() {
  const { items, addItem, removeItem, getTotal, getItemCount } = useCartStore();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Debug function to test product fetching
  const debugProductFetch = async () => {
    try {
      // Test individual product fetch with a known good ID
      const productId = "1"; // Test with first product
      console.log("Fetching product with ID:", productId);
      
      const individualResponse = await fetch(`/api/products/${productId}`);
      const individualData = await individualResponse.json();
      
      // Test all products fetch
      const allResponse = await fetch(`/api/products`);
      const allData = await allResponse.json();
      
      setDebugInfo({
        individualFetch: {
          ok: individualResponse.ok,
          status: individualResponse.status,
          data: individualData
        },
        allFetch: {
          ok: allResponse.ok,
          status: allResponse.status,
          data: allData
        }
      });
    } catch (error: any) {
      console.error("Debug error:", error);
      setDebugInfo({ error: error.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    debugProductFetch();
  }, []);

  const handleAddItem = async (productId: string) => {
    console.log("Adding item with ID:", productId);
    await addItem(productId, 1);
  };

  if (loading) {
    return <div className="p-4">Loading debug info...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Cart Debug Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Debug Info</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Cart ({getItemCount()} items) - Total: {formatCurrency(getTotal())}
        </h2>
        {items.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3>Product ID: {item.productId}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                  </p>
                </div>
                <Button variant="destructive" onClick={() => removeItem(item.productId)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Adding Items</h2>
        <div className="flex gap-2">
          <Button onClick={() => handleAddItem("1")}>Add Product 1</Button>
          <Button onClick={() => handleAddItem("2")}>Add Product 2</Button>
          <Button onClick={() => handleAddItem("3")}>Add Product 3</Button>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Note: Make sure products with these IDs exist in your database. If they don't, try using actual product IDs from the debug info above.
          </p>
        </div>
      </div>
    </div>
  );
}