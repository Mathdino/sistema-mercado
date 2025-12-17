"use client";

import { useEffect, useState } from "react";
import { mockProducts, mockCategories } from "@/lib/mock-data";

export default function ProductDataDebugPage() {
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products from API
        const productsResponse = await fetch("/api/products");
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setApiProducts(productsData.products || []);
          setApiCategories(productsData.categories || []);
        } else {
          setError(`Failed to fetch products: ${productsResponse.status}`);
        }
      } catch (err: any) {
        setError(`Error fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading data...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Product Data Debug</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">API Products</h2>
        {apiProducts.length === 0 ? (
          <p>No products found in API</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiProducts.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <p className="text-primary font-bold">ID: "{product.id}"</p>
                <p className="text-primary font-bold">Price: {product.price}</p>
                <p className="text-sm">Type of ID: {typeof product.id}</p>
                <p className="text-sm">Is ID truthy: {product.id ? "Yes" : "No"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">API Categories</h2>
        {apiCategories.length === 0 ? (
          <p>No categories found in API</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiCategories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-primary font-bold">ID: "{category.id}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mock Products (for comparison)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProducts.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 space-y-2 bg-gray-50">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="text-primary font-bold">ID: "{product.id}"</p>
              <p className="text-primary font-bold">Price: {product.price}</p>
              <p className="text-sm">Type of ID: {typeof product.id}</p>
              <p className="text-sm">Is ID truthy: {product.id ? "Yes" : "No"}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mock Categories (for comparison)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCategories.map((category) => (
            <div key={category.id} className="border rounded-lg p-4 space-y-2 bg-gray-50">
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-primary font-bold">ID: "{category.id}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}