"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockProducts, mockCategories } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/currency"
import { Search, Plus } from "lucide-react"
import Image from "next/image"

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Produtos</h1>
              <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const category = mockCategories.find((c) => c.id === product.categoryId)
              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold leading-tight">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">{category?.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                            {product.originalPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.originalPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {product.stock} em estoque
                          </Badge>
                          {product.featured && (
                            <Badge variant="default" className="text-xs">
                              Destaque
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
