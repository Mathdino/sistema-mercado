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
import { useAuthStore } from "@/lib/store"
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

interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
  subtotal: number
}

interface DeliveryAddress {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

interface Order {
  id: string
  userId: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  totalAmount: number
  status: string
  paymentMethod: string
  deliveryAddress: DeliveryAddress
  createdAt: string
  estimatedDelivery?: string
  notes?: string
}

const statusConfig: Record<string, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
  variant: "secondary" | "default" | "outline" | "destructive";
}> = {
  pending: {
    label: "Pendente",
    icon: Clock,
    variant: "secondary",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    variant: "default",
  },
  preparing: {
    label: "Preparando",
    icon: Package,
    variant: "default",
  },
  delivering: {
    label: "Em entrega",
    icon: Truck,
    variant: "default",
  },
  delivered: {
    label: "Entregue",
    icon: CheckCircle2,
    variant: "outline",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    variant: "destructive",
  },
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
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

  // Fetch order from API
  useEffect(() => {
    const fetchOrder = async () => {
      if (!isAuthenticated || !user?.id) return
      
      try {
        setLoading(true)
        const response = await fetch("/api/orders/me")
        if (response.ok) {
          const ordersData = await response.json()
          const foundOrder = ordersData.find((o: Order) => o.id === params.id)
          setOrder(foundOrder || null)
        }
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [isAuthenticated, user?.id, params.id])

  const handleLoginSuccess = () => {
    // User successfully logged in, page will re-render with authenticated state
  }

  // Don't render anything until hydration is complete
  if (!isHydrated) {
    return null
  }

  // If user is not authenticated or order doesn't exist, redirect to orders page
  if (!isAuthenticated || (!order && !loading)) {
    router.push("/client/orders")
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <ClientHeader />
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <p>Carregando pedido...</p>
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

  if (!order) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <ClientHeader />
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <p>Pedido não encontrado.</p>
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

  const config = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = config.icon
  
  const paymentMethodLabels: Record<string, string> = {
    pix: "PIX",
    credit: "Crédito",
    debit: "Débito",
    cash: "Dinheiro",
  }
  
  // Function to shorten the order ID for display
  const shortenOrderId = (orderId: string) => {
    // Take first 8 characters and remove hyphens
    return orderId.replace(/-/g, '').substring(0, 8);
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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Pedido #{shortenOrderId(order.id)}</CardTitle>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">Itens do Pedido</h3>
              <div className="space-y-4">
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
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{item.productName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Grátis"}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="mb-3 font-semibold">Endereço de Entrega</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p>{order.deliveryAddress.street}, {order.deliveryAddress.number}</p>
                    {order.deliveryAddress.complement && (
                      <p className="text-muted-foreground">{order.deliveryAddress.complement}</p>
                    )}
                    <p>
                      {order.deliveryAddress.neighborhood} - {order.deliveryAddress.city},{" "}
                      {order.deliveryAddress.state}
                    </p>
                    <p>CEP: {order.deliveryAddress.zipCode}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-semibold">Detalhes do Pagamento</h3>
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
            </div>
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