"use client"

import { useState } from "react"
import { ClientHeader } from "@/components/client/client-header"
import { BottomNav } from "@/components/client/bottom-nav"
import { ProductCard } from "@/components/client/product-card"
import { CategoryTabs } from "@/components/client/category-tabs"
import { mockProducts, mockCategories } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function MarketPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader showBack />
      <main className="space-y-4">
        <div className="sticky top-0 z-10 bg-background px-4 py-4">
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
        </div>
        <div className="px-4">
          <CategoryTabs
            categories={mockCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 px-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}