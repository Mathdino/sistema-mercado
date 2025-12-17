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
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  icon: string
  image: string
}

export default function CreateProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newProduct, setNewProduct] = useState({
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result as string
      setNewProduct({ ...newProduct, imageFile: file })
      setImagePreview(imageUrl)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAddProduct = async () => {
    try {
      // In a real implementation, you would upload the image file to a storage service
      // and get a URL back. For now, we'll just use a placeholder.
      const imageUrl = imagePreview || "/placeholder.svg"
      
      const productData = {
        ...newProduct,
        image: imageUrl,
        price: parseFloat(newProduct.price),
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : undefined,
        stock: parseInt(newProduct.stock)
      };
      
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const product = await response.json()
        // Redirect back to products page after successful creation
        router.push("/admin/products")
      } else {
        const text = await response.text()
        console.error("Error response text:", text)
        try {
            const error = JSON.parse(text)
            console.error("Error adding product:", error)
            alert(`Error adding product: ${error.error || 'Unknown error'}`)
        } catch (e) {
            console.error("Failed to parse error response:", e)
            alert(`Error adding product: ${text}`)
        }
      }
    } catch (error) {
      console.error("Error adding product:", error)
      alert(`Network error adding product: ${error}`)
    }
  }

  if (loading) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p>Carregando categorias...</p>
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
            <h1 className="text-3xl font-bold">Adicionar Produto</h1>
            <p className="text-muted-foreground">Cadastre um novo produto no catálogo</p>
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
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
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
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
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
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Input
                    id="unit"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    placeholder="Ex: kg, un, L"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({...newProduct, categoryId: value})}>
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
                  checked={newProduct.featured}
                  onChange={(e) => setNewProduct({...newProduct, featured: e.target.checked})}
                />
                <Label htmlFor="featured">Produto em destaque</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => router.push("/admin/products")}>
                Cancelar
              </Button>
              <Button onClick={handleAddProduct}>Adicionar Produto</Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}