"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const seedCategories = async () => {
    setLoading(true)
    setMessage("")
    try {
      const response = await fetch("/api/seed-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`Success: ${data.message}`)
      } else {
        setMessage(`Error: ${data.error} - ${data.details || ""}`)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Seed Data</h1>
            <p className="text-muted-foreground">Populate the database with initial data</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Seed Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Click the button below to add default categories to the database:</p>
              <Button onClick={seedCategories} disabled={loading}>
                {loading ? "Seeding..." : "Seed Categories"}
              </Button>
              {message && (
                <div className="mt-4 p-3 rounded bg-muted">
                  <p>{message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}