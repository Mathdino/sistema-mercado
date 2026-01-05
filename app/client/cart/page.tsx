"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientHeader } from "@/components/client/client-header";
import { BottomNav } from "@/components/client/bottom-nav";
import { LoginModal } from "@/components/client/login-modal";
import { CartItemCard } from "@/components/client/cart-item-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore, useAuthStore } from "@/lib/store";
import { mockProducts, mockMarket } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/currency";
import { ShoppingBag } from "lucide-react";
import type { CartItem, Product } from "@/lib/types";

export default function CartPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [cartProducts, setCartProducts] = useState<
    Array<CartItem & { product: Product }>
  >([]);
  const [activeFee, setActiveFee] = useState<{
    type: "FIXED" | "PER_KM";
    fixedValue: number | null;
    perKmValue: number | null;
    minValue: number | null;
    minRange: number | null;
  } | null>(null);
  const router = useRouter();
  const { items, getTotal } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [computedDeliveryFee, setComputedDeliveryFee] = useState(0);
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);

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
        // First try to find in mock data
        const mockCartProducts = items
          .map((item) => {
            const product = mockProducts.find((p) => p.id === item.productId);
            if (product) {
              return { ...item, product };
            }
            return null;
          })
          .filter(Boolean) as Array<CartItem & { product: Product }>;

        // If all items are found in mock data, use them
        if (mockCartProducts.length === items.length) {
          setCartProducts(mockCartProducts);
          return;
        }

        // Otherwise fetch from API
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

  // Fetch active delivery fee
  useEffect(() => {
    const fetchActiveFee = async () => {
      try {
        const res = await fetch("/api/fees/active");
        if (res.ok) {
          const data = await res.json();
          setActiveFee(data.fee);
        } else {
          setActiveFee(null);
        }
      } catch {
        setActiveFee(null);
      }
    };
    if (isHydrated) fetchActiveFee();
  }, [isHydrated]);

  useEffect(() => {
    const calc = async () => {
      setLoadingDeliveryFee(true);
      if (!activeFee) {
        setComputedDeliveryFee(0);
        setLoadingDeliveryFee(false);
        return;
      }
      if (activeFee.type === "FIXED") {
        setComputedDeliveryFee(Number(activeFee.fixedValue || 0));
        setLoadingDeliveryFee(false);
        return;
      }
      const addr =
        user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
      const body = addr
        ? {
            street: addr.street,
            number: addr.number,
            complement: addr.complement || undefined,
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
          }
        : {};
      try {
        const res = await fetch("/api/delivery-fee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          setComputedDeliveryFee(Number(data.fee || 0));
          setLoadingDeliveryFee(false);
        } else {
          const minVal = Number(activeFee.minValue || 0);
          setComputedDeliveryFee(minVal);
          setLoadingDeliveryFee(false);
        }
      } catch {
        const minVal = Number(activeFee.minValue || 0);
        setComputedDeliveryFee(minVal);
        setLoadingDeliveryFee(false);
      }
    };
    if (isHydrated && activeFee) {
      calc();
    }
  }, [isHydrated, activeFee, user?.addresses]);

  const subtotal = getTotal();
  const deliveryFee = computedDeliveryFee;
  const total = subtotal + deliveryFee;

  const canCheckout = subtotal >= mockMarket.minOrderValue;

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <ClientHeader showBack />
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">
            Seu carrinho está vazio
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Adicione produtos do mercado para continuar
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push("/client/market")}
          >
            Ir às compras
          </Button>
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

  return (
    <div className="min-h-screen bg-background pb-25">
      <ClientHeader showBack />
      <main className="space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Carrinho</h1>

        <div className="space-y-3">
          {cartProducts.map((item, index) => (
            <CartItemCard key={`${item.productId}-${index}`} item={item} />
          ))}
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span className="font-medium">
                {loadingDeliveryFee
                  ? "Calculando taxa"
                  : deliveryFee > 0
                  ? formatCurrency(deliveryFee)
                  : "Grátis"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
            {!canCheckout && (
              <p className="text-xs text-destructive">
                Pedido mínimo de {formatCurrency(mockMarket.minOrderValue)}
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <div className="left-0 right-0 border-t bg-background p-4">
        <Button
          className="w-full"
          size="lg"
          disabled={!canCheckout}
          onClick={() => router.push("/client/checkout")}
        >
          Finalizar pedido · {formatCurrency(total)}
        </Button>
      </div>
      <BottomNav />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
