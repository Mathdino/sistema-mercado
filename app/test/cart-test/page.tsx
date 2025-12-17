"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export default function CartTestPage() {
  const { items, addItem, removeItem, getTotal, getItemCount } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products for testing
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddItem = async (productId: string) => {
    await addItem(productId, 1);
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Cart Test Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-primary font-bold">{formatCurrency(product.price)}</p>
              <Button onClick={() => handleAddItem(product.id)}>Add to Cart</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Cart ({getItemCount()} items) - Total: {formatCurrency(getTotal())}
        </h2>
        {items.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <div key={`${item.productId}-${index}`} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h3>{product?.name || "Unknown Product"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => removeItem(item.productId)}>
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}