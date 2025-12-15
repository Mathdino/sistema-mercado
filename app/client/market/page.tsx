"use client"

import { useState, useEffect } from "react"
import { ClientHeader } from "@/components/client/client-header"
import { BottomNav } from "@/components/client/bottom-nav"
import { ProductCard } from "@/components/client/product-card"
import { CategoryTabs } from "@/components/client/category-tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Star, Tag } from "lucide-react"
import Link from "next/link"

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

export default function MarketPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [promotionProducts, setPromotionProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch products and categories from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&category=${selectedCategory || ''}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products)
          setCategories(data.categories)
          setFeaturedProducts(data.featuredProducts)
          setPromotionProducts(data.promotionProducts)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchQuery, selectedCategory])

  // Initial load - fetch all data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products)
          setCategories(data.categories)
          setFeaturedProducts(data.featuredProducts)
          setPromotionProducts(data.promotionProducts)
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
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
              placeholder="Buscar produtos..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Destaques</h2>
              </div>
              <Link href="/client/promotions" className="text-sm text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Promotion Products Section */}
        {promotionProducts.length > 0 && (
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-red-500" />
                <h2 className="text-xl font-bold">Promoções</h2>
                <Badge variant="destructive">OFERTA</Badge>
              </div>
              <Link href="/client/promotions" className="text-sm text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {promotionProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="px-4">
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        
        {/* All Products */}
        <div className="px-4">
          <h2 className="text-xl font-bold mb-4">
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name || "Produtos" 
              : "Todos os Produtos"}
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p>Carregando produtos...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}