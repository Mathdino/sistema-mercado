"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  icon: string
  image: string
}

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const router = useRouter()

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categorias</h2>
        <Button variant="link" className="text-primary" onClick={() => router.push("/client/market")}>
          Ver mais
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {categories.slice(0, 8).map((category) => (
          <button
            key={category.id}
            onClick={() => router.push(`/client/market?category=${category.id}`)}
            className="flex flex-col items-center gap-2 transition-transform hover:scale-105"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl shadow-sm">
              {category.icon}
            </div>
            <span className="text-center text-xs font-medium leading-tight">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}