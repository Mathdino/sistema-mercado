"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/currency"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, EyeOff, ChevronRight, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

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

export default function AdminProductsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(new Set())

  // Fetch products and categories
  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const response = await fetch("/api/admin/products")
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products)
          setCategories(data.categories)
        }
      } catch (error) {
        console.error("Error fetching products and categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProductsAndCategories()
  }, [])

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Prevent multiple clicks on the same product
      if (updatingProductIds.has(productId)) return;
      
      setUpdatingProductIds(prev => new Set(prev).add(productId));
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
      } else {
        const error = await response.json()
        console.error("Error deleting product:", error)
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      alert(`Network error deleting product: ${error}`)
    } finally {
      setUpdatingProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }

  const handleToggleFeatured = async (productId: string, featured: boolean) => {
    try {
      // Prevent multiple clicks on the same product
      if (updatingProductIds.has(productId)) return;
      
      setUpdatingProductIds(prev => new Set(prev).add(productId));
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featured
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
        )
      } else {
        const error = await response.json()
        console.error("Error updating product:", error)
      }
    } catch (error) {
      console.error("Error updating product:", error)
      alert(`Network error updating product: ${error}`)
    } finally {
      setUpdatingProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }

  const handleRemovePromotion = async (productId: string) => {
    try {
      // Prevent multiple clicks on the same product
      if (updatingProductIds.has(productId)) return;
      
      setUpdatingProductIds(prev => new Set(prev).add(productId));
      
      const response = await fetch(`/api/admin/promotions/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
        )
      } else {
        const error = await response.json()
        console.error("Error removing promotion:", error)
      }
    } catch (error) {
      console.error("Error removing promotion:", error)
      alert(`Network error removing promotion: ${error}`)
    } finally {
      setUpdatingProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }

  if (loading) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p>Carregando produtos...</p>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
          </div>
          
          <div className="flex flex-col gap-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
                onClick={() => router.push("/admin/categories")}
              >
                <div>
                  <h3 className="font-medium text-gray-900">Categorias</h3>
                  <p className="text-sm text-gray-500 mt-1">Crie novas categorias de produtos</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
              
              <div 
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
                onClick={() => router.push("/admin/products/create")}
              >
                <div>
                  <h3 className="font-medium text-gray-900">Produtos</h3>
                  <p className="text-sm text-gray-500 mt-1">Adicionar novos produtos</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
              
              <div 
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
                onClick={() => router.push("/admin/promotions")}
              >
                <div>
                  <h3 className="font-medium text-gray-900">Promoções</h3>
                  <p className="text-sm text-gray-500 mt-1">Gerenciar promoções</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const category = categories.find((c) => c.id === product.categoryId)
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
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold leading-tight line-clamp-2">{product.name}</h3>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/admin/products/edit/${product.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={updatingProductIds.has(product.id)}
                                >
                                  {updatingProductIds.has(product.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  {updatingProductIds.has(product.id) ? "Excluindo..." : "Excluir"}
                                  {!updatingProductIds.has(product.id) && <Trash2 className="ml-2 h-4 w-4" />}
                                </DropdownMenuItem>
                                {product.featured ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleFeatured(product.id, false)}
                                    disabled={updatingProductIds.has(product.id)}
                                  >
                                    {updatingProductIds.has(product.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {updatingProductIds.has(product.id) ? "Removendo..." : "Remover destaque"}
                                    {!updatingProductIds.has(product.id) && <EyeOff className="ml-2 h-4 w-4" />}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleFeatured(product.id, true)}
                                    disabled={updatingProductIds.has(product.id)}
                                  >
                                    {updatingProductIds.has(product.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {updatingProductIds.has(product.id) ? "Destacando..." : "Destacar"}
                                    {!updatingProductIds.has(product.id) && <Eye className="ml-2 h-4 w-4" />}
                                  </DropdownMenuItem>
                                )}
                                {product.originalPrice ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleRemovePromotion(product.id)}
                                    disabled={updatingProductIds.has(product.id)}
                                  >
                                    {updatingProductIds.has(product.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {updatingProductIds.has(product.id) ? "Removendo..." : "Remover promoção"}
                                    {!updatingProductIds.has(product.id) && <Trash2 className="ml-2 h-4 w-4" />}
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                        <div className="flex items-center gap-2 flex-wrap mt-2">
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