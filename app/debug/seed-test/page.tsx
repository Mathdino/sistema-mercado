"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SeedTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSeedProducts = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/seed-test-products", {
        method: "POST",
      });
      
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Seed Test Products</h1>
      
      <div className="space-y-4">
        <p>This page will seed the database with test products if none exist.</p>
        <Button onClick={handleSeedProducts} disabled={loading}>
          {loading ? "Seeding..." : "Seed Test Products"}
        </Button>
      </div>
      
      {result && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}