"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ApiTestPage() {
  const [results, setResults] = useState<any[]>([]);

  const testApiCall = async (id: string, description: string) => {
    try {
      console.log(`Testing API call with ID: "${id}" (${description})`);
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();
      
      const result = {
        id,
        description,
        status: response.status,
        ok: response.ok,
        data,
        timestamp: new Date().toISOString()
      };
      
      console.log("API test result:", result);
      setResults(prev => [...prev, result]);
    } catch (error: any) {
      const result = {
        id,
        description,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log("API test error:", result);
      setResults(prev => [...prev, result]);
    }
  };

  const runTests = async () => {
    setResults([]);
    
    // Test with various ID values
    await testApiCall("1", "String '1'");
    await testApiCall("2", "String '2'");
    await testApiCall("", "Empty string");
    await testApiCall("undefined", "String 'undefined'");
    await testApiCall("null", "String 'null'");
    
    // Wait a bit and then test with a valid ID from mock data
    setTimeout(async () => {
      await testApiCall("prod-1", "Valid test ID");
    }, 1000);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">API Test Page</h1>
      
      <div className="space-y-4">
        <Button onClick={runTests}>Run API Tests</Button>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results</h2>
        {results.length === 0 ? (
          <p>No tests run yet</p>
        ) : (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium">{result.description} (ID: "{result.id}")</h3>
                <p>Status: {result.status || "Error"}</p>
                <p>OK: {result.ok ? "Yes" : "No"}</p>
                <pre className="bg-gray-100 p-2 mt-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}