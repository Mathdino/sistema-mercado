"use client"

import { useState, useEffect } from "react"
import { ClientHeader } from "@/components/client/client-header"
import { BottomNav } from "@/components/client/bottom-nav"
import { ProductCard } from "@/components/client/product-card"
import { Input } from "@/components/ui/input"
import { Search, Star, Tag } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
  image: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  categoryId: string
  unit: string
  stock: number
  featured: boolean
  category?: Category
}

export default function PromotionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [promotionProducts, setPromotionProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch featured and promotion products
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          setFeaturedProducts(data.featuredProducts)
          setPromotionProducts(data.promotionProducts)
        }
      } catch (error) {
        console.error("Error fetching promotions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader showBack />
      <main className="space-y-6">
        <div className="sticky top-0 z-10 bg-background px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar promoções..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Produtos em Destaque</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p>Carregando produtos em destaque...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum produto em destaque no momento</p>
            </div>
          )}
        </div>

        {/* Promotion Products Section */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold">Promoções</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p>Carregando promoções...</p>
            </div>
          ) : promotionProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {promotionProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma promoção disponível no momento</p>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}