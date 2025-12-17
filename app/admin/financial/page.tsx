"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateShort } from "@/lib/currency";
import { DollarSign, TrendingUp, CreditCard, Banknote } from "lucide-react";

export default function AdminFinancialPage() {
  const [financialData, setFinancialData] = useState<any>({
    totalRevenue: 0,
    totalDeliveryFees: 0,
    totalProductsSold: 0,
    paymentBreakdown: {},
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1)
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear())
  );
  const [recentPage, setRecentPage] = useState<number>(1);

  useEffect(() => {
    const fetchFinancial = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/financial?month=${selectedMonth}&year=${selectedYear}&page=${recentPage}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setFinancialData(data);
        }
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancial();
  }, [selectedMonth, selectedYear, recentPage]);

  const paymentMethodLabels = {
    pix: "PIX",
    credit: "Cartão de Crédito",
    debit: "Cartão de Débito",
    cash: "Dinheiro",
  };

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">
              Análise financeira e relatórios
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "1", label: "Janeiro" },
                  { value: "2", label: "Fevereiro" },
                  { value: "3", label: "Março" },
                  { value: "4", label: "Abril" },
                  { value: "5", label: "Maio" },
                  { value: "6", label: "Junho" },
                  { value: "7", label: "Julho" },
                  { value: "8", label: "Agosto" },
                  { value: "9", label: "Setembro" },
                  { value: "10", label: "Outubro" },
                  { value: "11", label: "Novembro" },
                  { value: "12", label: "Dezembro" },
                ].map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) =>
                  String(new Date().getFullYear() - i)
                ).map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : formatCurrency(financialData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pedidos confirmados (exclui cancelados)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxas de Entrega
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : formatCurrency(financialData.totalDeliveryFees)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading
                    ? "..."
                    : `${(
                        (financialData.totalDeliveryFees /
                          (financialData.totalRevenue || 1)) *
                        100
                      ).toFixed(1)}% da receita`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produtos Vendidos
                </CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : financialData.totalProductsSold}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de produtos
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receita por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(financialData.paymentBreakdown).map(
                  ([method, amount]) => {
                    const percentage =
                      (Number(amount) / financialData.totalRevenue) * 100;
                    return (
                      <div key={method}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {
                                paymentMethodLabels[
                                  method as keyof typeof paymentMethodLabels
                                ]
                              }
                            </span>
                          </div>
                          <span className="font-bold">
                            {loading ? "..." : formatCurrency(Number(amount))}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        Pedido #{String(order.id).slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateShort(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {loading ? "..." : formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {
                          paymentMethodLabels[
                            order.paymentMethod as keyof typeof paymentMethodLabels
                          ]
                        }
                      </p>
                    </div>
                  </div>
                ))}
                {financialData.recentPagination &&
                  financialData.recentPagination.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Página {recentPage} de{" "}
                        {financialData.recentPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRecentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={recentPage <= 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRecentPage((p) =>
                              Math.min(
                                financialData.recentPagination.totalPages,
                                p + 1
                              )
                            )
                          }
                          disabled={
                            recentPage >=
                            financialData.recentPagination.totalPages
                          }
                        >
                          Próximo
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
