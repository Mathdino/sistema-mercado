"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/currency"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [error, setError] = useState("")

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/debug-db", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      })

      const data = await response.json()
      
      if (response.ok) {
        setDebugData(data)
      } else {
        setError(`Error: ${data.error} - ${data.details || ""}`)
      }
    } catch (err) {
      setError(`Network error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const seedSampleData = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/seed-sample-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      })

      const data = await response.json()
      
      if (response.ok) {
        setDebugData(data)
        alert("Sample data seeded successfully!")
      } else {
        setError(`Error: ${data.error} - ${data.details || ""}`)
      }
    } catch (err) {
      setError(`Network error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Debug Database</h1>
            <p className="text-muted-foreground">View database contents</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={fetchData} disabled={loading}>
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
            <Button onClick={seedSampleData} variant="secondary" disabled={loading}>
              Seed Sample Data
            </Button>
          </div>
          
          {error && (
            <Card>
              <CardContent className="p-4">
                <p className="text-red-500">{error}</p>
              </CardContent>
            </Card>
          )}
          
          {debugData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded">
                      <p className="text-2xl font-bold">{debugData.categoryCount}</p>
                      <p className="text-muted-foreground">Categories</p>
                    </div>
                    <div className="p-4 bg-muted rounded">
                      <p className="text-2xl font-bold">{debugData.productCount}</p>
                      <p className="text-muted-foreground">Products</p>
                    </div>
                    <div className="p-4 bg-muted rounded">
                      <p className="text-2xl font-bold">{debugData.orderCount}</p>
                      <p className="text-muted-foreground">Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Categories ({debugData.categoryCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugData.categories.length > 0 ? (
                    <div className="grid gap-2">
                      {debugData.categories.map((category: any) => (
                        <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{category.name}</span>
                            <span className="text-muted-foreground ml-2">({category.id})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <img src={category.image} alt={category.name} className="w-8 h-8 object-cover rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No categories found</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Products ({debugData.productCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugData.products.length > 0 ? (
                    <div className="grid gap-2">
                      {debugData.products.map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="text-muted-foreground ml-2">({product.id})</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span>{formatCurrency(product.price)}</span>
                            <span className="text-muted-foreground">{product.stock} in stock</span>
                            <img src={product.image} alt={product.name} className="w-8 h-8 object-cover rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No products found</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Orders ({debugData.orderCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugData.orders.length > 0 ? (
                    <div className="grid gap-2">
                      {debugData.orders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">Order {order.id.substring(0, 8)}</span>
                            <span className="text-muted-foreground ml-2">({order.status})</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span>{formatCurrency(order.totalAmount)}</span>
                            <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No orders found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}