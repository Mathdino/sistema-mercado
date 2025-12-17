"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/lib/mock-data";

export default function FinalTestPage() {
  const { items, addItem, removeItem, getTotal, getItemCount } = useCartStore();
  const [testResults, setTestResults] = useState<any[]>([]);

  const runTest = async (productId: string, description: string) => {
    try {
      console.log(`Testing addItem with productId: "${productId}" (${description})`);
      await addItem(productId, 1);
      
      const result = {
        productId,
        description,
        status: "success",
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
    } catch (error: any) {
      const result = {
        productId,
        description,
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    // Test with valid mock product IDs
    await runTest("1", "Valid mock product ID '1'");
    await runTest("2", "Valid mock product ID '2'");
    await runTest("3", "Valid mock product ID '3'");
    
    // Test with invalid IDs
    await runTest("", "Empty string");
    await runTest("undefined", "String 'undefined'");
    await runTest("null", "String 'null'");
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Final Cart Test</h1>
      
      <div className="space-y-4">
        <Button onClick={runAllTests}>Run All Tests</Button>
        <Button onClick={() => setTestResults([])} variant="outline">Clear Results</Button>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results</h2>
        {testResults.length === 0 ? (
          <p>No tests run yet</p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${result.status === "success" ? "border-green-500" : "border-red-500"}`}>
                <h3 className="font-medium">{result.description} (ID: "{result.productId}")</h3>
                <p>Status: {result.status}</p>
                {result.error && <p className="text-red-500">Error: {result.error}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Current Cart</h2>
        <div className="border rounded-lg p-4">
          <p>Items in cart: {getItemCount()}</p>
          <p>Total value: {formatCurrency(getTotal())}</p>
          
          {items.length === 0 ? (
            <p className="text-muted-foreground mt-2">Cart is empty</p>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h3>Product ID: {item.productId}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeItem(item.productId)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Mock Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProducts.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="text-primary font-bold">ID: "{product.id}"</p>
              <p className="text-primary font-bold">Price: {formatCurrency(product.price)}</p>
              <Button onClick={() => runTest(product.id, `Mock product ${product.id}`)}>
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}