"use client"

import { useRouter } from "next/navigation"
import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"

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

interface FeaturedProductsProps {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const router = useRouter()

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ofertas do dia</h2>
        <Button variant="link" className="text-primary" onClick={() => router.push("/client/market")}>
          Ver todos
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}