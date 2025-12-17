// Test component to debug cart functionality
"use client"

import { useEffect } from "react"
import { useCartStore } from "@/lib/store"

export default function TestCart() {
  const { items, addItem, removeItem, clearCart, getTotal, getItemCount } = useCartStore()
  
  useEffect(() => {
    console.log("Cart items:", items)
    console.log("Total items:", getItemCount())
    console.log("Total price:", getTotal())
  }, [items, getItemCount, getTotal])
  
  const testAddItem = () => {
    console.log("Adding test item...")
    addItem("1", 1) // Add product ID 1 (Pão Francês)
  }
  
  const testClearCart = () => {
    console.log("Clearing cart...")
    clearCart()
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cart Test</h1>
      <div className="space-y-2">
        <button 
          onClick={testAddItem}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Test Item (Pão Francês)
        </button>
        <button 
          onClick={testClearCart}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Clear Cart
        </button>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Cart Items:</h2>
        <pre>{JSON.stringify(items, null, 2)}</pre>
      </div>
    </div>
  )
}