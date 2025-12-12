"use client"

import { useState, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useOrderStore } from "@/lib/store"
import { mockOrders } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/currency"
import type { Order } from "@/lib/types"
import { Eye } from "lucide-react"

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useOrderStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const allOrders = useMemo(() => {
    return [...orders, ...mockOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return allOrders
    return allOrders.filter((order) => order.status === statusFilter)
  }, [allOrders, statusFilter])

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus)
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
  }

  const statusColors = {
    pending: "secondary",
    confirmed: "default",
    preparing: "default",
    delivering: "default",
    delivered: "outline",
    cancelled: "destructive",
  } as const

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pedidos</h1>
              <p className="text-muted-foreground">Gerencie todos os pedidos</p>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="delivering">Em entrega</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">Pedido #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[order.status]}>{order.status}</Badge>
                      <Button variant="outline" size="icon" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">
                        {order.deliveryAddress.street}, {order.deliveryAddress.number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pagamento</p>
                      <p className="font-medium">{order.paymentMethod.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <Button size="sm" onClick={() => handleStatusChange(order.id, "confirmed")}>
                        Confirmar
                      </Button>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" onClick={() => handleStatusChange(order.id, "preparing")}>
                        Preparar
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button size="sm" onClick={() => handleStatusChange(order.id, "delivering")}>
                        Enviar
                      </Button>
                    )}
                    {order.status === "delivering" && (
                      <Button size="sm" onClick={() => handleStatusChange(order.id, "delivered")}>
                        Marcar como entregue
                      </Button>
                    )}
                    {!["delivered", "cancelled"].includes(order.status) && (
                      <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order.id, "cancelled")}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>{selectedOrder && formatDate(selectedOrder.createdAt)}</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold">Endereço de Entrega</h3>
                  <p className="text-sm">
                    {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.number}
                  </p>
                  {selectedOrder.deliveryAddress.complement && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.deliveryAddress.complement}</p>
                  )}
                  <p className="text-sm">
                    {selectedOrder.deliveryAddress.neighborhood} - {selectedOrder.deliveryAddress.city},{" "}
                    {selectedOrder.deliveryAddress.state}
                  </p>
                  <p className="text-sm">CEP: {selectedOrder.deliveryAddress.zipCode}</p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="mb-2 font-semibold">Observações</h3>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  )
}
