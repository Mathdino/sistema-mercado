"use client";

import { useEffect, useState } from "react";
import { mockProducts } from "@/lib/mock-data";

export default function ProductTestPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products);
        } else {
          setError(`Failed to fetch products: ${response.status} ${response.statusText}`);
          // Fallback to mock data
          setProducts(mockProducts);
        }
      } catch (err: any) {
        setError(`Error fetching products: ${err.message}`);
        // Fallback to mock data
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="p-4">Loading products...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Product Test Page</h1>
      
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
          <p className="font-bold">Warning:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Products</h2>
        {products.length === 0 ? (
          <p>No products found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <p className="text-primary font-bold">ID: {product.id}</p>
                <p className="text-primary font-bold">Price: {product.price}</p>
                {product.originalPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    Original Price: {product.originalPrice}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mock Products (for reference)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProducts.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 space-y-2 bg-gray-50">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="text-primary font-bold">ID: {product.id}</p>
              <p className="text-primary font-bold">Price: {product.price}</p>
              {product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  Original Price: {product.originalPrice}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}