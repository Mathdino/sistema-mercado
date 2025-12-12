"use client"

import { useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrderStore } from "@/lib/store"
import { mockOrders } from "@/lib/mock-data"
import { formatCurrency, formatDateShort } from "@/lib/currency"
import { DollarSign, TrendingUp, CreditCard, Banknote } from "lucide-react"

export default function AdminFinancialPage() {
  const { orders } = useOrderStore()

  const financialData = useMemo(() => {
    const allOrders = [...orders, ...mockOrders].filter((order) => order.status === "delivered")

    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalDeliveryFees = allOrders.reduce((sum, order) => sum + order.deliveryFee, 0)
    const totalProductsSold = allOrders.reduce((sum, order) => order.items.reduce((s, item) => s + item.quantity, 0), 0)

    const paymentBreakdown = allOrders.reduce(
      (acc, order) => {
        acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.totalAmount
        return acc
      },
      {} as Record<string, number>,
    )

    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return {
      totalRevenue,
      totalDeliveryFees,
      totalProductsSold,
      paymentBreakdown,
      recentOrders,
    }
  }, [orders])

  const paymentMethodLabels = {
    pix: "PIX",
    credit: "Cartão de Crédito",
    debit: "Cartão de Débito",
    cash: "Dinheiro",
  }

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Análise financeira e relatórios</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Pedidos entregues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxas de Entrega</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialData.totalDeliveryFees)}</div>
                <p className="text-xs text-muted-foreground">
                  {((financialData.totalDeliveryFees / financialData.totalRevenue) * 100).toFixed(1)}% da receita
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.totalProductsSold}</div>
                <p className="text-xs text-muted-foreground">Total de itens</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receita por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(financialData.paymentBreakdown).map(([method, amount]) => {
                  const percentage = (amount / financialData.totalRevenue) * 100
                  return (
                    <div key={method}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {paymentMethodLabels[method as keyof typeof paymentMethodLabels]}
                          </span>
                        </div>
                        <span className="font-bold">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{percentage.toFixed(1)}% do total</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">Pedido #{order.id}</p>
                      <p className="text-sm text-muted-foreground">{formatDateShort(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {paymentMethodLabels[order.paymentMethod as keyof typeof paymentMethodLabels]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
