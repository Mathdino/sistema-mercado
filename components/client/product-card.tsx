"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useCartStore, useAuthStore } from "@/lib/store";
import { LoginModal } from "@/components/client/login-modal";
import { useCartAnimation } from "@/hooks/use-cart-animation";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { items, addItem, updateQuantity } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const cartItem = items.find((item) => item.productId === product.id);
  const quantity = cartItem?.quantity || 0;
  const cardRef = useRef<HTMLDivElement>(null);
  const { triggerAnimation } = useCartAnimation();

  const handleAdd = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    
    // Trigger animation
    setIsAdding(true);
    triggerAnimation(product.id);
    
    // Add item to cart
    addItem(product.id, 1);
    
    // Reset animation after delay
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  const handleIncrease = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = () => {
    updateQuantity(product.id, quantity - 1);
  };

  const handleLoginSuccess = () => {
    // Add the product to cart after successful login
    addItem(product.id, 1);
  };

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  return (
    <>
      <Card 
        className={`overflow-hidden py-0 pb-2 transition-all duration-300 ${
          isAdding ? "scale-95 bg-green-50 border-green-200" : ""
        }`}
        ref={cardRef}
      >
        {/* Floating cart animation */}
        {isAdding && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <div 
              className="absolute animate-float-to-cart"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              <ShoppingCart className="h-6 w-6 text-green-500" />
            </div>
          </div>
        )}
        
        <CardContent className="p-0">
          <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
            />
            {hasDiscount && (
              <Badge className="absolute right-2 top-2 bg-destructive text-destructive-foreground">
                {Math.round(
                  ((product.originalPrice! - product.price) /
                    product.originalPrice!) *
                    100
                )}
                % OFF
              </Badge>
            )}
          </div>
          <div className="space-y-2 p-3">
            <h3 className="line-clamp-2 text-sm font-medium leading-tight">
              {product.name}{" "}
            </h3>
            <div className="space-y-1">
              <div className="h-4">
                {hasDiscount && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice!)}
                  </p>
                )}
              </div>
              <p
                className={`${
                  hasDiscount ? "text-xl" : "text-lg"
                } font-bold text-primary`}
              >
                {formatCurrency(product.price)}
                <span className="ml-2 align-middle text-xs font-medium text-muted-foreground">
                  / {product.unit}
                </span>
              </p>
            </div>
            {quantity === 0 ? (
              <Button 
                onClick={handleAdd} 
                className={`w-full transition-all duration-300 ${
                  isAdding ? "bg-green-500 hover:bg-green-600" : ""
                }`}
                size="sm"
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <span className="animate-pulse">✓</span>
                    <span className="ml-1">Adicionado</span>
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-background">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDecrease}
                  className="h-8 w-8"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleIncrease}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}