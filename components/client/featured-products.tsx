"use client"

import { useRouter } from "next/navigation"
import { mockProducts } from "@/lib/mock-data"
import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"

export function FeaturedProducts() {
  const router = useRouter()
  const featuredProducts = mockProducts.filter((p) => p.featured)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ofertas do dia</h2>
        <Button variant="link" className="text-primary" onClick={() => router.push("/client/market")}>
          Ver todos
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
