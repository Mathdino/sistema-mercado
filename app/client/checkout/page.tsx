"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientHeader } from "@/components/client/client-header";
import { BottomNav } from "@/components/client/bottom-nav";
import { LoginModal } from "@/components/client/login-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore, useAuthStore, useOrderStore } from "@/lib/store";
import { mockProducts, mockMarket } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import type { Order, CartItem, Product } from "@/lib/types";
import {
  MapPin,
  CreditCard,
  Smartphone,
  DollarSign,
  StickyNote,
  Phone,
  User,
} from "lucide-react";

export default function CheckoutPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<Order["paymentMethod"]>("pix");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartProducts, setCartProducts] = useState<
    Array<CartItem & { product: Product }>
  >([]);
  const router = useRouter();
  const { toast } = useToast();
  const { items, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addOrder } = useOrderStore();

  useEffect(() => {
    // Mark the component as hydrated after mount
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      setIsLoginModalOpen(true);
    }
  }, [isHydrated, isAuthenticated]);

  // Fetch real product data for cart items
  useEffect(() => {
    const fetchCartProducts = async () => {
      if (items.length === 0) {
        setCartProducts([]);
        return;
      }

      try {
        // Fetch from API
        const response = await fetch(`/api/products`);
        if (response.ok) {
          const data = await response.json();
          const apiCartProducts = items
            .map((item) => {
              const product = data.products.find(
                (p: any) => p.id === item.productId
              );
              if (product) {
                return { ...item, product };
              }
              // Fallback to mock data if not found in API
              const mockProduct = mockProducts.find(
                (p) => p.id === item.productId
              );
              return mockProduct ? { ...item, product: mockProduct } : null;
            })
            .filter(Boolean) as Array<CartItem & { product: Product }>;

          setCartProducts(apiCartProducts);
        } else {
          // Fallback to mock data if API fails
          const mockCartProducts = items
            .map((item) => {
              const product = mockProducts.find((p) => p.id === item.productId);
              if (product) {
                return { ...item, product };
              }
              return null;
            })
            .filter(Boolean) as Array<CartItem & { product: Product }>;
          setCartProducts(mockCartProducts);
        }
      } catch (error) {
        console.error("Error fetching cart products:", error);
        // Fallback to mock data if there's an error
        const mockCartProducts = items
          .map((item) => {
            const product = mockProducts.find((p) => p.id === item.productId);
            return product ? { ...item, product } : null;
          })
          .filter(Boolean) as Array<CartItem & { product: Product }>;

        setCartProducts(mockCartProducts);
      }
    };

    if (isHydrated && isAuthenticated && items.length > 0) {
      fetchCartProducts();
    } else if (items.length === 0) {
      setCartProducts([]);
    }
  }, [items, isHydrated, isAuthenticated]);

  const subtotal = getTotal();
  const deliveryFee =
    subtotal >= mockMarket.minOrderValue ? mockMarket.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Get the default address
      const defaultAddress = user!.addresses.find((addr) => addr.isDefault);

      if (!defaultAddress) {
        toast({
          title: "Erro ao realizar pedido",
          description: "Você precisa ter um endereço padrão configurado.",
          variant: "destructive",
        });
        return;
      }

      // Prepare order data for API
      const orderData = {
        items: cartProducts.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.image,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        totalAmount: total,
        deliveryFee,
        subtotal,
        paymentMethod: paymentMethod.toUpperCase(), // Convert to uppercase to match Prisma enum
        deliveryAddressId: defaultAddress.id,
        notes: notes || undefined,
      };

      // Send order to API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const createdOrder = await response.json();

      // Add order to local store for immediate UI update
      // We need to map the API response to match our frontend Order type
      const orderToAdd: Order = {
        id: createdOrder.id,
        userId: createdOrder.userId,
        items: createdOrder.items,
        totalAmount: createdOrder.totalAmount,
        deliveryFee: createdOrder.deliveryFee,
        subtotal: createdOrder.subtotal,
        status: createdOrder.status.toLowerCase() as Order["status"],
        paymentMethod:
          createdOrder.paymentMethod.toLowerCase() as Order["paymentMethod"],
        deliveryAddress: {
          id: createdOrder.deliveryAddress.id,
          street: createdOrder.deliveryAddress.street,
          number: createdOrder.deliveryAddress.number,
          complement: createdOrder.deliveryAddress.complement || undefined,
          neighborhood: createdOrder.deliveryAddress.neighborhood,
          city: createdOrder.deliveryAddress.city,
          state: createdOrder.deliveryAddress.state,
          zipCode: createdOrder.deliveryAddress.zipCode,
          isDefault: createdOrder.deliveryAddress.isDefault,
        },
        createdAt: createdOrder.createdAt,
        estimatedDelivery: createdOrder.estimatedDelivery,
        notes: createdOrder.notes,
      };

      addOrder(orderToAdd);

      // Clear cart
      clearCart();

      // Show success message
      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado com sucesso.",
      });

      // Navigate to orders page
      router.push("/client/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro ao realizar pedido",
        description:
          "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginSuccess = () => {
    // User successfully logged in, page will re-render with authenticated state
  };

  // Don't render anything until hydration is complete
  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated && !isLoginModalOpen) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader showBack />
      <main className="space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Finalizar pedido</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <User className="h-4 w-4" /> {user?.name}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {user?.addresses.find((addr) => addr.isDefault)?.street},{" "}
                  {user?.addresses.find((addr) => addr.isDefault)?.number}
                  {user?.addresses.find((addr) => addr.isDefault)?.complement &&
                    `, ${
                      user?.addresses.find((addr) => addr.isDefault)?.complement
                    }`}{" "}
                  -
                  {user?.addresses.find((addr) => addr.isDefault)?.neighborhood}
                  , {user?.addresses.find((addr) => addr.isDefault)?.city} -
                  {user?.addresses.find((addr) => addr.isDefault)?.state},{" "}
                  {user?.addresses.find((addr) => addr.isDefault)?.zipCode}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {user?.phone}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Método de pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as Order["paymentMethod"])
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Pix
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão de crédito
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debit" id="debit" />
                  <Label htmlFor="debit" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão de débito
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Dinheiro
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Alguma observação sobre o pedido?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span className="font-medium">
                  {deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? "Processando..." : "Confirmar"}
          </Button>
        </form>
      </main>
      <BottomNav />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
