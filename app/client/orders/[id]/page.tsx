"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ClientHeader } from "@/components/client/client-header"
import { BottomNav } from "@/components/client/bottom-nav"
import { LoginModal } from "@/components/client/login-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useOrderStore, useAuthStore } from "@/lib/store"
import { formatCurrency, formatDate } from "@/lib/currency"
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  MapPin, 
  CreditCard, 
  Smartphone, 
  DollarSign,
  ArrowLeft
} from "lucide-react"

const statusConfig = {
  pending: {
    label: "Pendente",
    icon: Clock,
    variant: "secondary" as const,
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    variant: "default" as const,
  },
  preparing: {
    label: "Preparando",
    icon: Package,
    variant: "default" as const,
  },
  delivering: {
    label: "Em entrega",
    icon: Truck,
    variant: "default" as const,
  },
  delivered: {
    label: "Entregue",
    icon: CheckCircle2,
    variant: "outline" as const,
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    variant: "destructive" as const,
  },
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const { orders } = useOrderStore()
  const { user, isAuthenticated } = useAuthStore()
  
  useEffect(() => {
    // Mark the component as hydrated after mount
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      setIsLoginModalOpen(true)
    }
  }, [isHydrated, isAuthenticated])

  const order = orders.find(o => o.id === params.id && o.userId === user?.id)
  
  const handleLoginSuccess = () => {
    // User successfully logged in, page will re-render with authenticated state
  }

  // Don't render anything until hydration is complete
  if (!isHydrated) {
    return null
  }

  // If user is not authenticated or order doesn't exist, redirect to orders page
  if (!isAuthenticated || !order) {
    router.push("/client/orders")
    return null
  }

  const config = statusConfig[order.status]
  const StatusIcon = config.icon
  
  const paymentMethodLabels = {
    pix: "Pix",
    credit: "Cartão de crédito",
    debit: "Cartão de débito",
    cash: "Dinheiro",
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader />
      <main className="space-y-4 px-4 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedido #{order.id}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                {order.estimatedDelivery && (
                  <p className="text-xs text-muted-foreground">
                    Previsão: {formatDate(order.estimatedDelivery)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                  <Image
                    src={item.productImage || "/placeholder.svg"}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-tight">{item.productName}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x {formatCurrency(item.price)}
                    </p>
                    <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span className="font-medium">
                  {order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Grátis"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm">
                {order.deliveryAddress.street}, {order.deliveryAddress.number}
                {order.deliveryAddress.complement && `, ${order.deliveryAddress.complement}`} - 
                {order.deliveryAddress.neighborhood}, {order.deliveryAddress.city} - 
                {order.deliveryAddress.state}, {order.deliveryAddress.zipCode}
              </p>
              <p className="text-sm">{user?.phone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {order.paymentMethod === "pix" && <Smartphone className="h-4 w-4" />}
              {order.paymentMethod === "credit" && <CreditCard className="h-4 w-4" />}
              {order.paymentMethod === "debit" && <CreditCard className="h-4 w-4" />}
              {order.paymentMethod === "cash" && <DollarSign className="h-4 w-4" />}
              <span>{paymentMethodLabels[order.paymentMethod]}</span>
            </div>
            {order.notes && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Observações:</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
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