"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/currency"
import type { Order } from "@/lib/types"
import { Package, Clock, CheckCircle2, XCircle, Truck } from "lucide-react"

interface OrderCardProps {
  order: Order
}

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

export function OrderCard({ order }: OrderCardProps) {
  const config = statusConfig[order.status]
  const StatusIcon = config.icon

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pedido #{order.id}</p>
            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>
          <Badge variant={config.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        <div className="space-y-2">
          {order.items.slice(0, 2).map((item) => (
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
          <span className="text-lg font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
