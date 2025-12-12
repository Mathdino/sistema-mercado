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
import { Eye, Download } from "lucide-react"

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

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "Pendente"
      case "confirmed": return "Confirmado"
      case "preparing": return "Preparando"
      case "delivering": return "Em entrega"
      case "delivered": return "Entregue"
      case "cancelled": return "Cancelado"
      default: return status
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-orange-500"
      case "delivered": return "bg-green-500"
      case "cancelled": return "bg-red-500"
      default: return "bg-blue-500"
    }
  }

  const generateOrderPDF = async (order: Order) => {
    try {
      // Dynamically import jsPDF
      const jsPDF = (await import("jspdf")).default
      
      // Create jsPDF instance
      const doc = new jsPDF()
      
      // Header with logo (using text as placeholder for logo)
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("MERCADO SÃO JORGE", 105, 20, { align: "center" } as any)
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Av. dos Automóveis, 1696", 105, 30, { align: "center" } as any)
      doc.text("(11) 3456-7890", 105, 37, { align: "center" } as any)
      
      // Horizontal line separator
      doc.line(20, 45, 190, 45)
      
      // Order title
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(`PEDIDO #${order.id}`, 20, 55)
      
      // Order date
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Data: ${formatDate(order.createdAt)}`, 150, 55)
      
      // Status
      doc.text(`Status: ${getStatusLabel(order.status)}`, 150, 62)
      
      // Customer info
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Informações do Cliente", 20, 72)
      
      // Customer name and phone (in a real implementation, this would come from the user data)
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      // TODO: Fetch actual user data based on order.userId
      // For now, using placeholder data - in a real app, you would look up the user by order.userId
      doc.text(`Nome: João Silva`, 20, 82)
      doc.text(`Telefone: (11) 98765-4321`, 20, 89)
      
      // Full address in one line (moved to be after phone number)
      const fullAddress = `Endereço: ${order.deliveryAddress.street}, ${order.deliveryAddress.number}${order.deliveryAddress.complement ? `, ${order.deliveryAddress.complement}` : ''} - ${order.deliveryAddress.neighborhood}, ${order.deliveryAddress.city} - ${order.deliveryAddress.state}, ${order.deliveryAddress.zipCode}`
      doc.text(fullAddress, 20, 96)
      
      // Horizontal line separator after customer info (moved to be below address)
      doc.line(20, 102, 190, 102)
       
      // Items table - manually create table structure
      let yPosition = 115
       
      // Table header
      doc.setFont("helvetica", "bold")
      doc.text('Produto', 20, yPosition)
      doc.text('Qtde', 110, yPosition)  // Further reduced space for product name
      doc.text('Preço Unit.', 130, yPosition)
      doc.text('Subtotal', 170, yPosition)
      yPosition += 10
       
      // Table rows
      doc.setFont("helvetica", "normal")
      order.items.forEach(item => {
        // Product name (with wrapping if needed) - reduced width to prevent cutting
        const productNameLines = doc.splitTextToSize(item.productName, 80)
        doc.text(productNameLines, 20, yPosition)
        
        // Adjust yPosition based on number of lines
        const lineHeight = 7
        const linesHeight = productNameLines.length * lineHeight
        doc.text(`${item.quantity}x`, 110, yPosition)
        doc.text(formatCurrency(item.price), 130, yPosition)
        doc.text(formatCurrency(item.subtotal), 170, yPosition)
        
        yPosition += linesHeight
      })
       
      // Totals
      yPosition += 10
      doc.setFont("helvetica", "bold")
      doc.text(`Subtotal:`, 130, yPosition)
      doc.text(formatCurrency(order.subtotal), 170, yPosition)
      yPosition += 10
      
      doc.text(`Taxa de entrega:`, 130, yPosition)
      doc.text(formatCurrency(order.deliveryFee), 170, yPosition)
      yPosition += 10
      
      doc.setFontSize(14)
      doc.text(`TOTAL:`, 130, yPosition)
      doc.text(formatCurrency(order.totalAmount), 170, yPosition)
      
      // Thank you message
      yPosition += 90
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Obrigado pela sua compra!", 105, yPosition, { align: "center" } as any)
      yPosition += 7
      doc.text("Volte sempre!", 105, yPosition, { align: "center" } as any)
       
      // Save the PDF
      doc.save(`pedido-${order.id}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      // Fallback: show alert to user
      alert("Erro ao gerar o PDF. Por favor, tente novamente.")
    }
  }

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
                      <Badge className={`${getStatusColor(order.status)} text-white`}>{getStatusLabel(order.status)}</Badge>
                      <Button variant="outline" size="icon" onClick={() => generateOrderPDF(order)}>
                        <Download className="h-4 w-4" />
                      </Button>
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