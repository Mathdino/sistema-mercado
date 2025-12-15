"use client"

import { useState, useEffect, useRef } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/currency"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Upload } from "lucide-react"
import Image from "next/image"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddPromotionOpen, setIsAddPromotionOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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
  const [editProduct, setEditProduct] = useState({
    id: "",
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
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    image: "",
    imageFile: null as File | null
  })
  const [newPromotion, setNewPromotion] = useState({
    productId: "",
    promotionalPrice: "",
    endDate: ""
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const categoryFileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false, isCategory: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result as string
      if (isEdit) {
        setEditProduct({ ...editProduct, imageFile: file })
        setEditImagePreview(imageUrl)
      } else if (isCategory) {
        setNewCategory({ ...newCategory, imageFile: file })
        setCategoryImagePreview(imageUrl)
      } else {
        setNewProduct({ ...newProduct, imageFile: file })
        setImagePreview(imageUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = (isEdit: boolean = false, isCategory: boolean = false) => {
    if (isEdit && editFileInputRef.current) {
      editFileInputRef.current.click()
    } else if (isCategory && categoryFileInputRef.current) {
      categoryFileInputRef.current.click()
    } else if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAddProduct = async () => {
    try {
      console.log('Adding product with data:', newProduct);
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
      
      console.log('Sending product data:', productData);
      
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const product = await response.json()
        console.log('Product created:', product);
        setProducts([product, ...products])
        setIsAddProductOpen(false)
        setNewProduct({
          name: "",
          description: "",
          price: "",
          originalPrice: "",
          image: "",
          imageFile: null,
          categoryId: "",
          unit: "",
          stock: "",
          featured: false
        })
        setImagePreview(null)
      } else {
        const error = await response.json()
        console.error("Error adding product:", error)
        // Show more detailed error to user
        alert(`Error adding product: ${error.error || 'Unknown error'}${error.details ? ` - ${JSON.stringify(error.details)}` : ''}`)
      }
    } catch (error) {
      console.error("Error adding product:", error)
      alert(`Network error adding product: ${error}`)
    }
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return

    try {
      // In a real implementation, you would upload the image file to a storage service
      // and get a URL back. For now, we'll just use a placeholder.
      const imageUrl = editImagePreview || selectedProduct.image
      
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editProduct,
          image: imageUrl,
          price: parseFloat(editProduct.price),
          originalPrice: editProduct.originalPrice ? parseFloat(editProduct.originalPrice) : undefined,
          stock: parseInt(editProduct.stock)
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p))
        setIsEditProductOpen(false)
        setSelectedProduct(null)
        setEditImagePreview(null)
      } else {
        const error = await response.json()
        console.error("Error updating product:", error)
        // Show more detailed error to user
        alert(`Error updating product: ${error.error || 'Unknown error'}${error.details ? ` - ${JSON.stringify(error.details)}` : ''}`)
      }
    } catch (error) {
      console.error("Error updating product:", error)
      alert(`Network error updating product: ${error}`)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
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
    }
  }

  const handleToggleFeatured = async (productId: string, featured: boolean) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          featured
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p))
      } else {
        const error = await response.json()
        console.error("Error updating product:", error)
      }
    } catch (error) {
      console.error("Error updating product:", error)
      alert(`Network error updating product: ${error}`)
    }
  }

  const handleAddCategory = async () => {
    try {
      // In a real implementation, you would upload the image file to a storage service
      // and get a URL back. For now, we'll just use a placeholder.
      const imageUrl = categoryImagePreview || "/placeholder.svg"
      
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newCategory,
          image: imageUrl
        }),
      })

      if (response.ok) {
        const category = await response.json()
        setCategories([...categories, category])
        setIsAddCategoryOpen(false)
        setNewCategory({
          name: "",
          icon: "",
          image: "",
          imageFile: null
        })
        setCategoryImagePreview(null)
      } else {
        const error = await response.json()
        console.error("Error adding category:", error)
        // Show more detailed error to user
        alert(`Error adding category: ${error.error || 'Unknown error'}${error.details ? ` - ${JSON.stringify(error.details)}` : ''}`)
      }
    } catch (error) {
      console.error("Error adding category:", error)
      alert(`Network error adding category: ${error}`)
    }
  }

  const handleAddPromotion = async () => {
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: newPromotion.productId,
          originalPrice: parseFloat(newPromotion.promotionalPrice),
          promotionEndDate: newPromotion.endDate
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p))
        setIsAddPromotionOpen(false)
        setNewPromotion({
          productId: "",
          promotionalPrice: "",
          endDate: ""
        })
      } else {
        const error = await response.json()
        console.error("Error adding promotion:", error)
      }
    } catch (error) {
      console.error("Error adding promotion:", error)
      alert(`Network error adding promotion: ${error}`)
    }
  }

  const handleRemovePromotion = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/promotions/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p))
      } else {
        const error = await response.json()
        console.error("Error removing promotion:", error)
      }
    } catch (error) {
      console.error("Error removing promotion:", error)
      alert(`Network error removing promotion: ${error}`)
    }
  }

  const openEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      image: product.image,
      imageFile: null,
      categoryId: product.categoryId,
      unit: product.unit,
      stock: product.stock.toString(),
      featured: product.featured
    })
    setEditImagePreview(product.image)
    setIsEditProductOpen(true)
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
            
            <div className="flex gap-2">
              <Button 
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                onClick={() => setIsAddCategoryOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Categoria
              </Button>
              <Button 
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                onClick={() => setIsAddProductOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
              <Button 
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                onClick={() => setIsAddPromotionOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Promoção
              </Button>
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
                        <div className="flex items-center justify-between">
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditProduct(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                              {product.featured ? (
                                <DropdownMenuItem onClick={() => handleToggleFeatured(product.id, false)}>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Remover destaque
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleFeatured(product.id, true)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Destacar
                                </DropdownMenuItem>
                              )}
                              {product.originalPrice ? (
                                <DropdownMenuItem onClick={() => handleRemovePromotion(product.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover promoção
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Add Product Dialog */}
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Produto</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo produto
              </DialogDescription>
            </DialogHeader>
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
                    onClick={() => triggerFileInput()}
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
                    onClick={() => triggerFileInput()}
                  >
                    Escolher Imagem
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e)}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProduct}>Adicionar Produto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>
                Edite as informações do produto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Produto</Label>
                <Input
                  id="edit-name"
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
                    onClick={() => triggerFileInput(true)}
                  >
                    {editImagePreview ? (
                      <Image 
                        src={editImagePreview} 
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
                    onClick={() => triggerFileInput(true)}
                  >
                    Escolher Imagem
                  </Button>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
                  placeholder="Descrição detalhada do produto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Preço (R$)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({...editProduct, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Estoque</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editProduct.stock}
                    onChange={(e) => setEditProduct({...editProduct, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unidade</Label>
                  <Input
                    id="edit-unit"
                    value={editProduct.unit}
                    onChange={(e) => setEditProduct({...editProduct, unit: e.target.value})}
                    placeholder="Ex: kg, un, L"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-categoryId">Categoria</Label>
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
                  id="edit-featured"
                  checked={editProduct.featured}
                  onChange={(e) => setEditProduct({...editProduct, featured: e.target.checked})}
                />
                <Label htmlFor="edit-featured">Produto em destaque</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateProduct}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Categoria</DialogTitle>
              <DialogDescription>
                Preencha as informações da nova categoria
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nome da Categoria</Label>
                <Input
                  id="category-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Ex: Padaria"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-icon">Ícone (Emoji)</Label>
                <Input
                  id="category-icon"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  placeholder="Ex: 🥖"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Imagem da Categoria</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
                    onClick={() => triggerFileInput(false, true)}
                  >
                    {categoryImagePreview ? (
                      <Image 
                        src={categoryImagePreview} 
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
                    onClick={() => triggerFileInput(false, true)}
                  >
                    Escolher Imagem
                  </Button>
                  <input
                    type="file"
                    ref={categoryFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false, true)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCategory}>Adicionar Categoria</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Promotion Dialog */}
        <Dialog open={isAddPromotionOpen} onOpenChange={setIsAddPromotionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Promoção</DialogTitle>
              <DialogDescription>
                Selecione um produto e defina o preço promocional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promotion-product">Produto</Label>
                <Select value={newPromotion.productId} onValueChange={(value) => setNewPromotion({...newPromotion, productId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotion-price">Preço Promocional (R$)</Label>
                <Input
                  id="promotion-price"
                  type="number"
                  step="0.01"
                  value={newPromotion.promotionalPrice}
                  onChange={(e) => setNewPromotion({...newPromotion, promotionalPrice: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotion-end">Data de Término</Label>
                <Input
                  id="promotion-end"
                  type="datetime-local"
                  value={newPromotion.endDate}
                  onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPromotionOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPromotion}>Adicionar Promoção</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  )
}