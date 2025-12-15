"use client"

import { useState, useEffect, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { formatCurrency, formatDate } from "@/lib/currency"
import type { Order } from "@/lib/types"
import { Eye, Download } from "lucide-react"
import { toast } from "sonner"

const getPaymentMethodLabel = (method: string) => {
  switch (method.toLowerCase()) {
    case "credit": return "Crédito"
    case "debit": return "Débito"
    case "pix": return "PIX"
    case "cash": return "Dinheiro"
    default: return method
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const ordersPerPage = 10

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders?page=${currentPage}&limit=${ordersPerPage}`, { credentials: "include" })
        console.log("API Response Status:", response.status)
        if (response.ok) {
          const data = await response.json()
          console.log("API Response Data:", data)
          // Transform the API response to match our frontend Order type
          const transformedOrders: Order[] = data.orders.map((order: any) => {
            // Normalize the status to one of our valid statuses
            let normalizedStatus: Order["status"] = "pending"; // default fallback
            
            switch (order.status.toLowerCase()) {
              case "pending":
                normalizedStatus = "pending";
                break;
              case "confirmed":
              case "preparing":
              case "delivering":
              case "delivered":
                normalizedStatus = "confirmed";
                break;
              case "cancelled":
              case "canceled":
                normalizedStatus = "cancelled";
                break;
              default:
                normalizedStatus = "pending"; // fallback for any unexpected statuses
            }
            
            return {
              id: order.id,
              userId: order.userId,
              items: order.items,
              totalAmount: order.totalAmount,
              deliveryFee: order.deliveryFee,
              subtotal: order.subtotal,
              status: normalizedStatus,
              paymentMethod: order.paymentMethod.toLowerCase() as Order["paymentMethod"],
              deliveryAddress: {
                id: order.deliveryAddress.id,
                street: order.deliveryAddress.street,
                number: order.deliveryAddress.number,
                complement: order.deliveryAddress.complement || undefined,
                neighborhood: order.deliveryAddress.neighborhood,
                city: order.deliveryAddress.city,
                state: order.deliveryAddress.state,
                zipCode: order.deliveryAddress.zipCode,
                isDefault: order.deliveryAddress.isDefault,
              },
              createdAt: order.createdAt,
              estimatedDelivery: order.estimatedDelivery,
              notes: order.notes,
              // Add user information
              user: order.user ? {
                id: order.user.id,
                name: order.user.name,
                phone: order.user.phone,
                email: order.user.email,
                cpf: order.user.cpf,
              } : undefined
            }
          })
          console.log("Transformed Orders:", transformedOrders)
          setOrders(transformedOrders)
          setTotalPages(data.pagination.totalPages)
          setTotalOrders(data.pagination.totalOrders)
        } else {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          try {
            const errorJson = JSON.parse(errorText);
            console.error("Parsed error:", errorJson);
          } catch (parseError) {
            console.error("Could not parse error as JSON");
          }
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
        toast.error("Erro ao carregar pedidos")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [currentPage])

  const allOrders = useMemo(() => {
    return orders // Already sorted by API
  }, [orders])

  const filteredOrders = useMemo(() => {
    console.log("All Orders:", allOrders);
    console.log("Status Filter:", statusFilter);
    if (statusFilter === "all") {
      console.log("Returning all orders");
      return allOrders;
    }
    const filtered = allOrders.filter((order) => order.status === statusFilter);
    console.log("Filtered Orders:", filtered);
    return filtered;
  }, [allOrders, statusFilter])

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    try {
      console.log(`Updating order ${orderId} to status ${newStatus.toUpperCase()}`)
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus.toUpperCase() }), // Convert to uppercase for Prisma enum
      })

      console.log(`Response status: ${response.status}`)
      
      if (response.ok) {
        const updatedOrder = await response.json()
        // Normalize the status to one of our valid statuses
        let normalizedStatus: Order["status"] = "pending"; // default fallback
        
        switch (updatedOrder.status.toLowerCase()) {
          case "pending":
            normalizedStatus = "pending";
            break;
          case "confirmed":
          case "preparing":
          case "delivering":
          case "delivered":
            normalizedStatus = "confirmed";
            break;
          case "cancelled":
          case "canceled":
            normalizedStatus = "cancelled";
            break;
          default:
            normalizedStatus = "pending"; // fallback for any unexpected statuses
        }
        
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.id === orderId ? { 
            ...order, 
            status: normalizedStatus
          } : order
        ))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ 
            ...selectedOrder, 
            status: normalizedStatus
          })
        }
        toast.success("Status do pedido atualizado com sucesso!")
      } else {
        const errorText = await response.text()
        console.error("Failed to update order status:", response.status, errorText)
        // Show error to user
        toast.error(`Falha ao atualizar status do pedido: ${response.status}`)
      }
    } catch (error) {
      console.error("Network error updating order status:", error)
      // Show error to user
      toast.error("Erro de rede ao atualizar status do pedido")
    }
  }

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "Pendente"
      case "confirmed": return "Confirmado"
      case "cancelled": return "Cancelado"
      default: return status
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-orange-500"
      case "confirmed": return "bg-green-500"
      case "cancelled": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  // Function to shorten the order ID
  const shortenOrderId = (orderId: string) => {
    // Take first 8 characters and remove hyphens
    return orderId.replace(/-/g, '').substring(0, 8);
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
      
      // Order title with shortened ID
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(`PEDIDO #${shortenOrderId(order.id)}`, 20, 55)
      
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
      
      // Customer name and phone (now using actual user data)
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Nome: ${order.user?.name || 'Não disponível'}`, 20, 82)
      doc.text(`Telefone: ${order.user?.phone || 'Não disponível'}`, 20, 89)
      
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
      doc.save(`pedido-${shortenOrderId(order.id)}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      // Fallback: show alert to user
      toast.error("Erro ao gerar o PDF. Por favor, tente novamente.")
    }
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5
    
    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink 
          onClick={() => goToPage(1)} 
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    )
    
    // Show ellipsis if there are pages between first and current range
    if (currentPage > 3) {
      items.push(<PaginationEllipsis key="ellipsis-start" />)
    }
    
    // Show pages around current page
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => goToPage(i)} 
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    // Show ellipsis if there are pages between current range and last
    if (currentPage < totalPages - 2) {
      items.push(<PaginationEllipsis key="ellipsis-end" />)
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => goToPage(totalPages)} 
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    return items
  }

  if (loading) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p>Carregando pedidos...</p>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
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
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              <>
                {filteredOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          {/* Shortened order ID in the list view */}
                          <CardTitle className="text-base">Pedido #{shortenOrderId(order.id)}</CardTitle>
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
                            {order.user?.name || 'Não disponível'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.user?.phone || 'Telefone não disponível'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pagamento</p>
                          <p className="font-medium">{getPaymentMethodLabel(order.paymentMethod)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(order.totalAmount)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.status === "pending" && (
                          <Button className="bg-emerald-500 hover:bg-emerald-600" size="sm" onClick={() => handleStatusChange(order.id, "confirmed")}>
                            Confirmar
                          </Button>
                        )}
                        {order.status === "confirmed" && (
                          <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order.id, "cancelled")}>
                            Cancelar
                          </Button>
                        )}
                        {order.status === "pending" && (
                          <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order.id, "cancelled")}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => goToPage(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {renderPaginationItems()}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => goToPage(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-lg text-muted-foreground">Nenhum pedido encontrado</p>
                {statusFilter !== "all" && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setStatusFilter("all")}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              {/* Shortened order ID in the dialog header */}
              <DialogTitle>Detalhes do Pedido #{shortenOrderId(selectedOrder?.id || '')}</DialogTitle>
              <DialogDescription>{selectedOrder && formatDate(selectedOrder.createdAt)}</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold">Informações do Cliente</h3>
                  <p className="text-sm font-medium">{selectedOrder.user?.name || 'Não disponível'}</p>
                  <p className="text-sm">{selectedOrder.user?.phone || 'Telefone não disponível'}</p>
                </div>

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
                    <span className="text-green-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <h3 className="mb-2 font-semibold">Atualizar Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status !== "pending" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleStatusChange(selectedOrder.id, "pending")}
                      >
                        Pendente
                      </Button>
                    )}
                    {selectedOrder.status !== "confirmed" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleStatusChange(selectedOrder.id, "confirmed")}
                      >
                        Confirmar
                      </Button>
                    )}
                    {selectedOrder.status !== "cancelled" && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleStatusChange(selectedOrder.id, "cancelled")}
                      >
                        Cancelar
                      </Button>
                    )}
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