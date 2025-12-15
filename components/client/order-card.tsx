"use client"

import Image from "next/image"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/currency"
import type { Order } from "@/lib/types"
import { Package, Clock, CheckCircle2, XCircle, Truck, ChevronDown, ChevronUp } from "lucide-react"

interface OrderCardProps {
  order: any // Updated to accept the new order structure from the API
}

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "secondary" | "default" | "outline" | "destructive";
}

const statusConfig: Record<string, StatusConfig> = {
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

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = config.icon

  // Function to shorten the order ID for display
  const shortenOrderId = (orderId: string) => {
    // Take first 8 characters and remove hyphens
    return orderId.replace(/-/g, '').substring(0, 8);
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pedido #{shortenOrderId(order.id)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>
          <Badge 
            variant={config.variant} 
            className={`flex items-center gap-1 ${order.status === 'pending' ? 'bg-orange-500 hover:bg-orange-600 text-white' : order.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600 text-white' : order.status === 'cancelled' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        <div className="space-y-2">
          {order.items.slice(0, 2).map((item: any) => (
            <div key={item.productId} className="flex gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                <Image
                  src={item.productImage || "/placeholder.svg"}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-tight">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity}x {formatCurrency(item.price)}
                </p>
              </div>
            </div>
          ))}
          {order.items.length > 2 && <p className="text-xs text-muted-foreground">+ {order.items.length - 2} itens</p>}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
        </div>

        <Separator />

        <div className="space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-between font-normal text-muted-foreground hover:text-foreground" 
            onClick={toggleExpand}
          >
            <span>Detalhe</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {isExpanded && (
            <div className="space-y-3 pl-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Itens do Pedido</h4>
                {order.items.map((item: any) => (
                  <div key={item.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-muted">
                        <Image
                          src={item.productImage || "/placeholder.svg"}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium leading-tight">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span className="font-medium">
                    {order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Grátis"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}