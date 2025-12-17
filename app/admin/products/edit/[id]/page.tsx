"use client"

import { useState, useRef, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Upload, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"

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
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [editProduct, setEditProduct] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    imageFile: null as File | null,
    categoryId: "",
    unit: "",
    stock: "",
    featured: false
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch product and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch("/api/admin/categories")
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }
        
        // Fetch product
        const productResponse = await fetch(`/api/admin/products/${productId}`)
        if (productResponse.ok) {
          const productData = await productResponse.json()
          setProduct(productData)
          
          // Populate form with product data
          setEditProduct({
            name: productData.name,
            description: productData.description,
            price: productData.price.toString(),
            originalPrice: productData.originalPrice?.toString() || "",
            image: productData.image,
            imageFile: null,
            categoryId: productData.categoryId,
            unit: productData.unit,
            stock: productData.stock.toString(),
            featured: productData.featured
          })
          setImagePreview(productData.image)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchData()
    }
  }, [productId])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result as string
      setEditProduct({ ...editProduct, imageFile: file })
      setImagePreview(imageUrl)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleUpdateProduct = async () => {
    try {
      // In a real implementation, you would upload the image file to a storage service
      // and get a URL back. For now, we'll just use a placeholder.
      const imageUrl = imagePreview || product?.image || "/placeholder.svg"
      
      const productData = {
        ...editProduct,
        image: imageUrl,
        price: parseFloat(editProduct.price),
        originalPrice: editProduct.originalPrice ? parseFloat(editProduct.originalPrice) : undefined,
        stock: parseInt(editProduct.stock)
      };
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        // Redirect back to products page after successful update
        router.push("/admin/products")
      } else {
        const error = await response.json()
        console.error("Error updating product:", error)
        alert(`Error updating product: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error updating product:", error)
      alert(`Network error updating product: ${error}`)
    }
  }

  if (loading) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p>Carregando produto...</p>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  if (!product) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p>Produto não encontrado</p>
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
            <h1 className="text-3xl font-bold">Editar Produto</h1>
            <p className="text-muted-foreground">Atualize as informações do produto</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
              onClick={() => router.push("/admin/categories")}
            >
              <div>
                <h3 className="font-medium text-gray-900">Categorias</h3>
                <p className="text-sm text-gray-500 mt-1">Gerenciar categorias de produtos</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            
            <div 
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
              onClick={() => router.push("/admin/products")}
            >
              <div>
                <h3 className="font-medium text-gray-900">Produtos</h3>
                <p className="text-sm text-gray-500 mt-1">Gerenciar produtos</p>
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
          
          <div className="max-w-2xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                  placeholder="Ex: Pão Francês"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Foto do Produto</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
                    onClick={triggerFileInput}
                  >
                    {imagePreview ? (
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <Upload className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={triggerFileInput}
                  >
                    Escolher Imagem
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
                  placeholder="Descrição detalhada do produto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({...editProduct, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editProduct.stock}
                    onChange={(e) => setEditProduct({...editProduct, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Input
                    id="unit"
                    value={editProduct.unit}
                    onChange={(e) => setEditProduct({...editProduct, unit: e.target.value})}
                    placeholder="Ex: kg, un, L"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <Select value={editProduct.categoryId} onValueChange={(value) => setEditProduct({...editProduct, categoryId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={editProduct.featured}
                  onChange={(e) => setEditProduct({...editProduct, featured: e.target.checked})}
                />
                <Label htmlFor="featured">Produto em destaque</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => router.push("/admin/products")}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateProduct}>Atualizar Produto</Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}