"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClientHeader } from "@/components/client/client-header"
import { BottomNav } from "@/components/client/bottom-nav"
import { LoginModal } from "@/components/client/login-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { User, MapPin, Phone, Mail, LogOut, ChevronRight, Edit, FileSearch } from "lucide-react"

export default function ProfilePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    }
  })
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout, isAuthenticated, updateUser } = useAuthStore()

  useEffect(() => {
    // Mark the component as hydrated after mount
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      setIsLoginModalOpen(true)
    } else if (isHydrated && user) {
      // Initialize form data with user information
      const defaultAddress = user.addresses.find((addr) => addr.isDefault) || user.addresses[0]
      setFormData({
        name: user.name || "",
        cpf: user.cpf ? formatCPF(user.cpf) : "", // Apply CPF mask when loading data
        phone: user.phone ? formatPhone(user.phone) : "", // Apply phone mask when loading data
        address: {
          street: defaultAddress?.street || "",
          number: defaultAddress?.number || "",
          complement: defaultAddress?.complement || "",
          neighborhood: defaultAddress?.neighborhood || "",
          city: defaultAddress?.city || "",
          state: defaultAddress?.state || "",
          zipCode: defaultAddress?.zipCode ? formatZipCode(defaultAddress.zipCode) : "", // Apply ZIP code mask when loading data
        }
      })
    }
  }, [isHydrated, isAuthenticated, user])

  const handleLogout = () => {
    logout()
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    })
    router.push("/client")
  }

  const handleLoginSuccess = () => {
    // User successfully logged in, page will re-render with authenticated state
  }

  const handleSave = async () => {
    if (!user) return
    
    console.log("Updating user with ID:", user.id)
    
    setIsLoading(true)
    try {
      // Make API call to update user data (token will be sent automatically via cookies)
      const res = await fetch(`/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        }),
      })
      
      const data = await res.json()
      console.log("API response:", data)
      
      if (res.ok && data.user) {
        // Update local store with new data
        updateUser(data.user)
        
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
        })
        
        setIsEditing(false)
      } else {
        throw new Error(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format CPF with mask (xxx.xxx.xxx-xx)
  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Format phone with mask (xx) xxxxx-xxxx
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  // Format ZIP code with mask (xxxxx-xxx)
  const formatZipCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    return digits.replace(/(\d{5})(\d)/, '$1-$2')
  }

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhone(e.target.value)
    setFormData({...formData, phone: formattedValue})
  }

  // Handle ZIP code input change
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatZipCode(e.target.value)
    setFormData({
      ...formData,
      address: {...formData.address, zipCode: formattedValue}
    })
  }

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "UN"
    const names = name.trim().split(" ")
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
  }

  // Format CPF for display
  const displayCPF = (cpf: string) => {
    return formatCPF(cpf)
  }

  // Don't render anything until hydration is complete
  if (!isHydrated) {
    return null
  }

  // Don't show the page content if user is not authenticated and modal isn't open
  if (!isAuthenticated && !isLoginModalOpen) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader />
      <main className="space-y-4 px-4 py-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                {getUserInitials(user?.name || "")}
              </span>
            </div>
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={() => setIsEditing(!isEditing)}
            >
              Editar Conta<Edit className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Editar informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Endereço padrão</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, street: e.target.value}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.address.number}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, number: e.target.value}
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.address.complement}
                    onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, complement: e.target.value}
                    })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.address.neighborhood}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, neighborhood: e.target.value}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={handleZipCodeChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, city: e.target.value}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, state: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Informações pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{user?.phone}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <FileSearch className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{user?.cpf ? displayCPF(user.cpf) : ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereço padrão</CardTitle>
              </CardHeader>
              <CardContent>
                {user?.addresses.find((addr) => addr.isDefault) ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {user.addresses.find((addr) => addr.isDefault)?.street}, {user.addresses.find((addr) => addr.isDefault)?.number}
                        {user.addresses.find((addr) => addr.isDefault)?.complement && 
                          `, ${user.addresses.find((addr) => addr.isDefault)?.complement}`} - 
                        {user.addresses.find((addr) => addr.isDefault)?.neighborhood}, {user.addresses.find((addr) => addr.isDefault)?.city} - 
                        {user.addresses.find((addr) => addr.isDefault)?.state}, {user.addresses.find((addr) => addr.isDefault)?.zipCode}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum endereço cadastrado</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </main>
      <BottomNav />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}