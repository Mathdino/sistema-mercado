"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  DollarSign,
  Building,
  Truck,
  LogOut,
  Tag,
  PiggyBank,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";

interface GlobalCashback {
  id: string;
  isActive: boolean;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

interface Cashback {
  id: string;
  userId: string;
  percentage: number;
  previousOrderId?: string;
  previousOrder?: {
    id: string;
    totalAmount: number;
    createdAt: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface User {
  id: string;
  name: string;
  email?: string;
  cpf?: string;
  phone: string;
  role: string;
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "FIXED" | "PERCENTAGE";
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCashbackPage() {
  const { toast } = useToast();
  const [globalCashback, setGlobalCashback] = useState<GlobalCashback | null>(
    null
  );
  const [cashbacks, setCashbacks] = useState<Cashback[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o header fixo na esquerda
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: ShoppingBag, label: "Pedidos", path: "/admin/orders" },
    { icon: Package, label: "Produtos", path: "/admin/products" },
    { icon: Users, label: "Clientes", path: "/admin/users" },
    { icon: DollarSign, label: "Financeiro", path: "/admin/financial" },
    { icon: Building, label: "Estabelecimento", path: "/admin/establishment" },
    { icon: Truck, label: "Taxas", path: "/admin/fees" },
    { icon: Tag, label: "Promoções", path: "/admin/promotions" },
    { icon: PiggyBank, label: "Cashback", path: "/admin/cashback" }, // Usando Tag pois é o ícone mais próximo de cashback
  ];

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    router.push("/login");
  };

  // Global Cashback State
  const [isGlobalCashbackActive, setIsGlobalCashbackActive] = useState(false);
  const [globalCashbackPercentage, setGlobalCashbackPercentage] = useState(0);
  const [isUpdatingGlobalCashback, setIsUpdatingGlobalCashback] =
    useState(false);

  // Cashback State
  const [isAddCashbackOpen, setIsAddCashbackOpen] = useState(false);
  const [newCashback, setNewCashback] = useState({
    userId: "",
    percentage: 10,
  });
  const [isCreatingCashback, setIsCreatingCashback] = useState(false);

  // Coupon State
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: 0,
    type: "PERCENTAGE" as "FIXED" | "PERCENTAGE",
    expiresAt: "",
    maxUses: 0,
  });
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  // Fetch global cashback settings
  const fetchGlobalCashback = async () => {
    try {
      const response = await fetch("/api/admin/global-cashback", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGlobalCashback(data);
        setIsGlobalCashbackActive(data?.isActive || false);
        setGlobalCashbackPercentage(data?.percentage || 0);
      } else {
        // If no global cashback exists, set defaults
        setIsGlobalCashbackActive(false);
        setGlobalCashbackPercentage(0);
      }
    } catch (error) {
      console.error("Error fetching global cashback:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações de cashback global",
        variant: "destructive",
      });
    }
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [cashbacksRes, couponsRes, usersRes] = await Promise.all([
        fetch("/api/admin/cashbacks", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
        fetch("/api/admin/coupons", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
        fetch("/api/users", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      if (cashbacksRes.ok) {
        const cashbacksData = await cashbacksRes.json();
        setCashbacks(cashbacksData);
      }

      if (couponsRes.ok) {
        const couponsData = await couponsRes.json();
        setCoupons(couponsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchGlobalCashback();
      await fetchData();
    };
    loadData();
  }, []);

  // Update global cashback settings
  const updateGlobalCashback = async () => {
    setIsUpdatingGlobalCashback(true);
    try {
      const response = await fetch("/api/admin/global-cashback", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isActive: isGlobalCashbackActive,
          percentage: globalCashbackPercentage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGlobalCashback(data);
        toast({
          title: "Sucesso",
          description:
            "Configurações de cashback global atualizadas com sucesso",
        });
      } else {
        const errorData = await response.json();
        console.error("Error response from API:", errorData);
        throw new Error(
          `Failed to update global cashback: ${
            errorData.error || response.status
          }`
        );
      }
    } catch (error) {
      console.error("Error updating global cashback:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar configurações de cashback global",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingGlobalCashback(false);
    }
  };

  // Create new cashback for a user
  const createCashback = async () => {
    if (!newCashback.userId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCashback(true);
    try {
      const response = await fetch("/api/admin/cashbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newCashback),
      });

      if (response.ok) {
        const data = await response.json();
        setCashbacks([...cashbacks, data]);
        setNewCashback({ userId: "", percentage: 10 });
        setIsAddCashbackOpen(false);
        toast({
          title: "Sucesso",
          description: "Cashback criado com sucesso",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create cashback");
      }
    } catch (error) {
      console.error("Error creating cashback:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar cashback",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCashback(false);
    }
  };

  // Create new coupon
  const createCoupon = async () => {
    if (!newCoupon.code.trim()) {
      toast({
        title: "Erro",
        description: "Insira um código para o cupom",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCoupon(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newCoupon),
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons([...coupons, data]);
        setNewCoupon({
          code: "",
          discount: 0,
          type: "PERCENTAGE",
          expiresAt: "",
          maxUses: 0,
        });
        setIsAddCouponOpen(false);
        toast({
          title: "Sucesso",
          description: "Cupom criado com sucesso",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar cupom",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  // Delete cashback
  const deleteCashback = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/cashbacks/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setCashbacks(cashbacks.filter((cashback) => cashback.id !== id));
        toast({
          title: "Sucesso",
          description: "Cashback excluído com sucesso",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete cashback");
      }
    } catch (error) {
      console.error("Error deleting cashback:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir cashback",
        variant: "destructive",
      });
    }
  };

  // Delete coupon (actually deactivate it)
  const deleteCoupon = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // Adiciona o token de autorização como fallback
          ...(typeof window !== "undefined" && document.cookie
            ? {
                Authorization: `Bearer ${
                  document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("token="))
                    ?.split("=")[1] || ""
                }`,
              }
            : {}),
        },
      });

      if (response.ok) {
        setCoupons(coupons.filter((coupon) => coupon.id !== id));
        toast({
          title: "Sucesso",
          description: "Cupom excluído com sucesso",
        });
      } else {
        const errorData = await response.json();
        console.error("Erro da API ao deletar cupom:", errorData);
        throw new Error(errorData.error || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir cupom",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <AuthGuard requireRole="admin">
      <div className="flex min-h-screen bg-background">
        {/* Header fixo na esquerda */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 border-r bg-card transition-[width] duration-200",
            sidebarOpen ? "w-64" : "w-16"
          )}
        >
          <div className="flex h-full flex-col">
            <div
              className={cn(
                "flex items-center justify-between border-b p-4",
                !sidebarOpen && "justify-center"
              )}
            >
              {sidebarOpen && (
                <div>
                  <h2 className="text-xl font-bold">Admin</h2>
                  <p className="text-xs text-muted-foreground">
                    Mercado São Jorge
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Recolher menu" : "Expandir menu"}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
            </div>

            <nav className={cn("flex-1 space-y-1 p-4", !sidebarOpen && "px-2")}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === "/admin/cashback"; // Ativo apenas para esta página
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full",
                      !sidebarOpen ? "justify-center" : "justify-start"
                    )}
                    onClick={() => {
                      router.push(item.path);
                    }}
                  >
                    <Icon className={cn("h-5 w-5", sidebarOpen && "mr-3")} />
                    {sidebarOpen && item.label}
                  </Button>
                );
              })}
            </nav>

            <div className="border-t p-4">
              {sidebarOpen ? (
                <>
                  <div className="mb-3 flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    aria-label="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main
          className={cn(
            "flex-1 p-6 md:p-8",
            sidebarOpen ? "md:ml-64" : "md:ml-16"
          )}
        >
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Cashback e Promoções</h1>
              <p className="text-muted-foreground">
                Gerencie cashbacks recorrentes e cupons de desconto
              </p>
            </div>

            <Tabs defaultValue="global" className="space-y-6">
              <TabsList>
                <TabsTrigger value="global">Cashback Recorrente</TabsTrigger>
                <TabsTrigger value="coupons">Cupons</TabsTrigger>
              </TabsList>

              <TabsContent value="global" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cashback Recorrente Global</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="global-cashback-toggle">
                        Ativar Cashback Recorrente
                      </Label>
                      <Switch
                        id="global-cashback-toggle"
                        checked={isGlobalCashbackActive}
                        onCheckedChange={setIsGlobalCashbackActive}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="global-cashback-percentage">
                        Porcentagem de Cashback (%)
                      </Label>
                      <Input
                        id="global-cashback-percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={globalCashbackPercentage}
                        onChange={(e) =>
                          setGlobalCashbackPercentage(
                            parseFloat(e.target.value) || 0
                          )
                        }
                        disabled={!isGlobalCashbackActive}
                      />
                      <p className="text-sm text-muted-foreground">
                        Porcentagem de cashback que será aplicada a todos os
                        clientes quando o pedido anterior for finalizado
                      </p>
                    </div>

                    <Button
                      onClick={updateGlobalCashback}
                      disabled={isUpdatingGlobalCashback}
                      className="w-full"
                    >
                      {isUpdatingGlobalCashback
                        ? "Atualizando..."
                        : "Salvar Configurações"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cashbacks" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Cashbacks Individuais</h2>
                  <Dialog
                    open={isAddCashbackOpen}
                    onOpenChange={setIsAddCashbackOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>Adicionar Cashback</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Cashback</DialogTitle>
                        <DialogDescription>
                          Adicione um cashback para um usuário específico
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="user-select">Usuário</Label>
                          <Select
                            value={newCashback.userId}
                            onValueChange={(value) =>
                              setNewCashback({ ...newCashback, userId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.email || user.phone})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="cashback-percentage">
                            Porcentagem (%)
                          </Label>
                          <Input
                            id="cashback-percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={newCashback.percentage}
                            onChange={(e) =>
                              setNewCashback({
                                ...newCashback,
                                percentage: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={createCashback}
                          disabled={isCreatingCashback}
                        >
                          {isCreatingCashback ? "Criando..." : "Criar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cashbacks.map((cashback) => (
                    <Card key={cashback.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <div>
                            <div>{cashback.user.name}</div>
                            <div className="text-sm font-normal text-muted-foreground">
                              {cashback.percentage}% -{" "}
                              {cashback.isActive ? "Ativo" : "Inativo"}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCashback(cashback.id)}
                          >
                            Excluir
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Criado:</span>{" "}
                            {new Date(cashback.createdAt).toLocaleString(
                              "pt-BR"
                            )}
                          </div>
                          {cashback.previousOrder && (
                            <div>
                              <span className="font-medium">
                                Pedido anterior:
                              </span>{" "}
                              R$ {cashback.previousOrder.totalAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="coupons" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Cupons de Desconto</h2>
                  <Dialog
                    open={isAddCouponOpen}
                    onOpenChange={setIsAddCouponOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>Adicionar Cupom</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Cupom</DialogTitle>
                        <DialogDescription>
                          Crie um novo cupom de desconto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2" htmlFor="coupon-code">
                            Código
                          </Label>
                          <Input
                            id="coupon-code"
                            value={newCoupon.code}
                            onChange={(e) =>
                              setNewCoupon({
                                ...newCoupon,
                                code: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="EXEMPLO10"
                          />
                        </div>

                        <div>
                          <Label className="mb-2" htmlFor="coupon-type">
                            Tipo
                          </Label>
                          <Select
                            value={newCoupon.type}
                            onValueChange={(value) =>
                              setNewCoupon({
                                ...newCoupon,
                                type: value as "FIXED" | "PERCENTAGE",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PERCENTAGE">
                                Porcentagem
                              </SelectItem>
                              <SelectItem value="FIXED">
                                Valor Fixo (R$)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-2" htmlFor="coupon-discount">
                            Desconto
                          </Label>
                          <Input
                            id="coupon-discount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newCoupon.discount}
                            onChange={(e) =>
                              setNewCoupon({
                                ...newCoupon,
                                discount: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label className="mb-2" htmlFor="coupon-max-uses">
                            Máximo de Usos (0 = ilimitado)
                          </Label>
                          <Input
                            id="coupon-max-uses"
                            type="number"
                            min="0"
                            value={newCoupon.maxUses}
                            onChange={(e) =>
                              setNewCoupon({
                                ...newCoupon,
                                maxUses: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label className="mb-2" htmlFor="coupon-expires-at">
                            Data de Expiração
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newCoupon.expiresAt ? (
                                  format(new Date(newCoupon.expiresAt), "PPP", {
                                    locale: ptBR,
                                  })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={
                                  newCoupon.expiresAt
                                    ? new Date(newCoupon.expiresAt)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  setNewCoupon({
                                    ...newCoupon,
                                    expiresAt: date ? date.toISOString() : "",
                                  })
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={createCoupon}
                          disabled={isCreatingCoupon}
                        >
                          {isCreatingCoupon ? "Criando..." : "Criar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coupons.map((coupon) => (
                    <Card key={coupon.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <div>
                            <div>{coupon.code}</div>
                            <div className="text-sm font-normal text-muted-foreground">
                              {coupon.type === "PERCENTAGE"
                                ? `${coupon.discount}%`
                                : formatCurrency(coupon.discount)}{" "}
                              - {coupon.isActive ? "Ativo" : "Inativo"}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCoupon(coupon.id)}
                          >
                            Excluir
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Tipo:</span>{" "}
                            {coupon.type === "PERCENTAGE"
                              ? "Porcentagem"
                              : "Valor Fixo"}
                          </div>
                          <div>
                            <span className="font-medium">Expira:</span>{" "}
                            {coupon.expiresAt
                              ? new Date(coupon.expiresAt).toLocaleDateString(
                                  "pt-BR"
                                )
                              : "Nunca"}
                          </div>
                          <div>
                            <span className="font-medium">Usos:</span>{" "}
                            {coupon.usedCount}
                            {coupon.maxUses ? `/${coupon.maxUses}` : ""}
                          </div>
                          <div>
                            <span className="font-medium">Criado:</span>{" "}
                            {new Date(coupon.createdAt).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
