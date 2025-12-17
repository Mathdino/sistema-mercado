"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/currency";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  Clock,
} from "lucide-react";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  categoryId: string;
  unit: string;
  stock: number;
  featured: boolean;
  category?: Category;
  promotionEndsAt?: string;
}

function PromotionTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        setIsExpired(false);
      } else {
        setTimeLeft("Expirado");
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div
      className={`flex items-center gap-1 text-xs ${
        isExpired ? "text-red-500" : "text-amber-600"
      }`}
    >
      <Clock className="h-3 w-3" />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function AdminPromotionsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPromotionOpen, setIsAddPromotionOpen] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    productId: "",
    promotionalPrice: "",
    endDate: "",
    isDateBased: false,
  });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products (both with and without promotions)
        const response = await fetch("/api/admin/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddPromotion = async () => {
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: newPromotion.productId,
          originalPrice: parseFloat(newPromotion.promotionalPrice),
          promotionEndDate: newPromotion.isDateBased
            ? newPromotion.endDate
            : null,
        }),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(
          products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
        setIsAddPromotionOpen(false);
        setNewPromotion({
          productId: "",
          promotionalPrice: "",
          endDate: "",
          isDateBased: false,
        });
      } else {
        const error = await response.json();
        console.error("Error adding promotion:", error);
        alert(`Error adding promotion: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding promotion:", error);
      alert(`Network error adding promotion: ${error}`);
    }
  };

  const handleRemovePromotion = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/promotions/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(
          products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
      } else {
        const error = await response.json();
        console.error("Error removing promotion:", error);
        alert(`Error removing promotion: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error removing promotion:", error);
      alert(`Network error removing promotion: ${error}`);
    }
  };

  // Filter products to show only those with promotions
  const promotionProducts = products.filter(
    (product) =>
      product.originalPrice !== undefined && product.originalPrice !== null
  );

  if (loading) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p>Carregando promoções...</p>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Promoções</h1>
            <p className="text-muted-foreground">
              Gerencie as promoções dos produtos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
              onClick={() => router.push("/admin/categories")}
            >
              <div>
                <h3 className="font-medium text-gray-900">Categorias</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Gerenciar categorias de produtos
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            <div
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
              onClick={() => router.push("/admin/products")}
            >
              <div>
                <h3 className="font-medium text-gray-900">Produtos</h3>
                <p className="text-sm text-gray-500 mt-1">Gerenciar produtos</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            <div
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
              onClick={() => router.push("/admin/promotions")}
            >
              <div>
                <h3 className="font-medium text-gray-900">Promoções</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Gerenciar promoções
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsAddPromotionOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Promoção
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promotionProducts.map((product) => {
              const category = product.category;
              return (
                <Card key={product.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRemovePromotion(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover Promoção
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {category?.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(product.price)}
                            </p>
                            {product.originalPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.originalPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="text-xs text-muted-foreground">
                              Válido até:{" "}
                              {product.promotionEndsAt
                                ? new Date(
                                    product.promotionEndsAt
                                  ).toLocaleDateString() +
                                  " " +
                                  new Date(
                                    product.promotionEndsAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Indeterminado"}
                            </p>
                            {product.promotionEndsAt && (
                              <PromotionTimer
                                endDate={product.promotionEndsAt}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {promotionProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma promoção cadastrada
              </p>
            </div>
          )}
        </div>

        {/* Add Promotion Dialog */}
        <Dialog open={isAddPromotionOpen} onOpenChange={setIsAddPromotionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Promoção</DialogTitle>
              <DialogDescription>
                Selecione um produto e defina o preço promocional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promotion-product">Produto</Label>
                <Select
                  value={newPromotion.productId}
                  onValueChange={(value) =>
                    setNewPromotion({ ...newPromotion, productId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotion-price">Preço Promocional (R$)</Label>
                <Input
                  id="promotion-price"
                  type="number"
                  step="0.01"
                  value={newPromotion.promotionalPrice}
                  onChange={(e) =>
                    setNewPromotion({
                      ...newPromotion,
                      promotionalPrice: e.target.value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="date-based"
                  checked={newPromotion.isDateBased}
                  onCheckedChange={(checked) =>
                    setNewPromotion({ ...newPromotion, isDateBased: checked })
                  }
                />
                <Label htmlFor="date-based">Promoção por tempo limitado</Label>
              </div>

              {newPromotion.isDateBased && (
                <div className="space-y-2">
                  <Label htmlFor="promotion-end">Data de Término</Label>
                  <Input
                    id="promotion-end"
                    type="datetime-local"
                    value={newPromotion.endDate}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddPromotionOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddPromotion}>Adicionar Promoção</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  );
}
