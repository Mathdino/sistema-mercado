// Test component to debug API functionality
"use client"

import { useEffect, useState } from "react"

export default function TestAPI() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/products")
        if (response.ok) {
          const data = await response.json()
          console.log("API Response:", data)
          setProducts(data.products)
          setError(null)
        } else {
          setError(`API Error: ${response.status}`)
        }
      } catch (err) {
        console.error("Fetch error:", err)
        setError(`Network Error: ${err}`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold">Products ({products.length}):</h2>
          <ul className="space-y-2">
            {products.map((product) => (
              <li key={product.id} className="border p-2 rounded">
                <strong>{product.name}</strong> - {product.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}