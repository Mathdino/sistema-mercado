"use client"

import { useState, useEffect, useRef } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Upload, MoreHorizontal, Edit, Trash2, ChevronRight } from "lucide-react"
import Image from "next/image"

interface Category {
  id: string
  name: string
  icon: string
  image: string
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    image: "",
    imageFile: null as File | null
  })
  const [editCategory, setEditCategory] = useState({
    id: "",
    name: "",
    icon: "",
    image: "",
    imageFile: null as File | null
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result as string
      if (isEdit) {
        setEditCategory({ ...editCategory, imageFile: file })
        setEditImagePreview(imageUrl)
      } else {
        setNewCategory({ ...newCategory, imageFile: file })
        setImagePreview(imageUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = (isEdit: boolean = false) => {
    if (isEdit && editFileInputRef.current) {
      editFileInputRef.current.click()
    } else if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAddCategory = async () => {
    try {
      // In a real implementation, you would upload the image file to a storage service
      // and get a URL back. For now, we'll just use a placeholder.
      const imageUrl = imagePreview || "/placeholder.svg"
      
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
        setImagePreview(null)
      } else {
        const error = await response.json()
        console.error("Error adding category:", error)
        alert(`Error adding category: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error adding category:", error)
      alert(`Network error adding category: ${error}`)
    }
  }

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return

    try {
      // In a real implementation, you would upload the image file to a storage service
      // and get a URL back. For now, we'll just use a placeholder.
      const imageUrl = editImagePreview || selectedCategory.image
      
      const response = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editCategory,
          image: imageUrl
        }),
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c))
        setIsEditCategoryOpen(false)
        setSelectedCategory(null)
        setEditImagePreview(null)
      } else {
        const error = await response.json()
        console.error("Error updating category:", error)
        alert(`Error updating category: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error updating category:", error)
      alert(`Network error updating category: ${error}`)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== categoryId))
      } else {
        const error = await response.json()
        console.error("Error deleting category:", error)
        alert(`Error deleting category: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert(`Network error deleting category: ${error}`)
    }
  }

  const openEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setEditCategory({
      id: category.id,
      name: category.name,
      icon: category.icon,
      image: category.image,
      imageFile: null
    })
    setEditImagePreview(category.image)
    setIsEditCategoryOpen(true)
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
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">Gerencie as categorias de produtos</p>
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
          
          <div className="flex justify-end">
            <Button onClick={() => setIsAddCategoryOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Adicionar Categoria
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="relative h-32 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCategory}>Adicionar Categoria</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
              <DialogDescription>
                Edite as informações da categoria
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Nome da Categoria</Label>
                <Input
                  id="edit-category-name"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                  placeholder="Ex: Padaria"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-icon">Ícone (Emoji)</Label>
                <Input
                  id="edit-category-icon"
                  value={editCategory.icon}
                  onChange={(e) => setEditCategory({...editCategory, icon: e.target.value})}
                  placeholder="Ex: 🥖"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Imagem da Categoria</Label>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCategory}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  )
}