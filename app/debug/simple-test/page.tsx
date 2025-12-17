"use client";

import { useEffect, useState } from "react";

export default function SimpleTestPage() {
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    const runTest = async () => {
      try {
        // Test direct API call
        const response = await fetch("/api/products");
        const data = await response.json();
        
        // Log the raw data
        console.log("Raw API response:", data);
        
        // Check first product
        if (data.products && data.products.length > 0) {
          const firstProduct = data.products[0];
          console.log("First product:", firstProduct);
          console.log("First product ID:", firstProduct.id);
          console.log("Type of ID:", typeof firstProduct.id);
          console.log("Is ID truthy:", !!firstProduct.id);
          
          // Try to fetch this specific product
          if (firstProduct.id) {
            const productResponse = await fetch(`/api/products/${firstProduct.id}`);
            console.log("Individual product fetch status:", productResponse.status);
            if (productResponse.ok) {
              const productData = await productResponse.json();
              console.log("Individual product data:", productData);
            } else {
              const errorText = await productResponse.text();
              console.log("Individual product error:", errorText);
            }
          }
        }
        
        setTestResult(data);
      } catch (error) {
        console.error("Test error:", error);
        setTestResult({ error: error.message });
      }
    };

    runTest();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Simple Test</h1>
      <pre className="bg-gray-100 p-4 mt-4 rounded overflow-auto">
        {JSON.stringify(testResult, null, 2)}
      </pre>
    </div>
  );
}