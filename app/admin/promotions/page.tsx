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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  Clock,
  ArrowLeft,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { PromotionBannerCreator } from "@/components/admin/promotion-banner-creator";
import { useToast } from "@/hooks/use-toast";

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

interface PromotionCard {
  id: string;
  title: string;
  description?: string;
  discountPrice?: number;
  backgroundImage?: string;
  productImage?: string;
  config: any;
  productId?: string;
  isActive: boolean;
  createdAt: string;
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
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [promotionCards, setPromotionCards] = useState<PromotionCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple Promotion State
  const [isAddPromotionOpen, setIsAddPromotionOpen] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    productId: "",
    promotionalPrice: "",
    endDate: "",
    isDateBased: false,
  });

  // Banner Creator State
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionCard | null>(
    null
  );

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchPromotionCards = async () => {
    try {
      const response = await fetch("/api/admin/promotion-cards");
      if (response.ok) {
        const data = await response.json();
        setPromotionCards(data);
      }
    } catch (error) {
      console.error("Error fetching promotion cards:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchPromotionCards()]);
      setLoading(false);
    };
    init();
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
        toast({ title: "Promoção adicionada com sucesso!" });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao adicionar promoção",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de rede",
        description: String(error),
        variant: "destructive",
      });
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
        toast({ title: "Promoção removida com sucesso!" });
      } else {
        toast({ title: "Erro ao remover promoção", variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Erro de rede",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return;

    try {
      const response = await fetch(`/api/admin/promotion-cards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPromotionCards(promotionCards.filter((c) => c.id !== id));
        toast({ title: "Banner removido com sucesso!" });
      } else {
        toast({ title: "Erro ao remover banner", variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Erro de rede",
        description: String(error),
        variant: "destructive",
      });
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
            <p>Carregando...</p>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  if (isCreatingBanner || editingBanner) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsCreatingBanner(false);
                  setEditingBanner(null);
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">
                {editingBanner ? "Editar Banner" : "Novo Banner de Promoção"}
              </h1>
            </div>

            <PromotionBannerCreator
              products={products}
              initialData={editingBanner}
              onSuccess={() => {
                setIsCreatingBanner(false);
                setEditingBanner(null);
                fetchPromotionCards();
              }}
              onCancel={() => {
                setIsCreatingBanner(false);
                setEditingBanner(null);
              }}
            />
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
              Gerencie as promoções e banners da loja
            </p>
          </div>

          <Tabs defaultValue="banners" className="space-y-6">
            <TabsList>
              <TabsTrigger value="banners">Banners Personalizados</TabsTrigger>
              <TabsTrigger value="simple">Promoções Simples</TabsTrigger>
            </TabsList>

            <TabsContent value="banners" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setIsCreatingBanner(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Novo Banner
                </Button>
              </div>

              {promotionCards.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Nenhum banner criado
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Crie banners personalizados para destacar seus produtos.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {promotionCards.map((card) => (
                    <Card key={card.id} className="overflow-hidden group p-0">
                      <div className="aspect-video relative bg-gray-100">
                        {card.backgroundImage ? (
                          <img
                            src={card.backgroundImage}
                            alt={card.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              background:
                                card.config?.backgroundType === "gradient"
                                  ? `linear-gradient(${card.config?.gradientDirection || "to right"}, ${card.config?.gradientStart || "#ef4444"}, ${card.config?.gradientEnd || "#b91c1c"})`
                                  : card.config?.backgroundColor || "#f3f4f6",
                            }}
                          >
                            {card.productImage && (
                              <img
                                src={card.productImage}
                                className="h-32 w-32 object-contain"
                                alt={card.title}
                              />
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setEditingBanner(card)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteBanner(card.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="p-0">
                        <CardTitle className="text-lg truncate p-4">
                          {card.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <p className="text-sm text-gray-500 line-clamp-2 p-4 pt-0">
                          {card.description || "Sem descrição"}
                        </p>
                        {card.discountPrice && (
                          <div className="font-bold text-green-600 p-4 pt-0">
                            {formatCurrency(card.discountPrice)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="simple" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setIsAddPromotionOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Promoção Simples
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {promotionProducts.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {product.name}
                        </CardTitle>
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
                        <div className="h-20 w-20 relative flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          <Image
                            src={product.image || "/placeholder.png"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(product.price)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          {product.promotionEndsAt && (
                            <div className="mt-2">
                              <PromotionTimer
                                endDate={product.promotionEndsAt}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {promotionProducts.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    Nenhuma promoção ativa no momento.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Dialog
            open={isAddPromotionOpen}
            onOpenChange={setIsAddPromotionOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Promoção Simples</DialogTitle>
                <DialogDescription>
                  Selecione um produto e defina o novo preço promocional.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produto</Label>
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
                      {products
                        .filter((p) => !p.originalPrice)
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço Promocional</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPromotion.promotionalPrice}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        promotionalPrice: e.target.value,
                      })
                    }
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
                  <Label htmlFor="date-based">Definir data de término</Label>
                </div>

                {newPromotion.isDateBased && (
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Data de Término</Label>
                    <Input
                      id="end-date"
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
                <Button
                  onClick={handleAddPromotion}
                  disabled={
                    !newPromotion.productId || !newPromotion.promotionalPrice
                  }
                >
                  Salvar Promoção
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
