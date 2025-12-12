"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());

  const navItems = [
    { icon: Home, label: "Início", path: "/client" },
    { icon: ShoppingBag, label: "Mercado", path: "/client/market" },
    { icon: ShoppingCart, label: "Carrinho", path: "/client/cart" },
    {
      icon: Clock,
      label: "Pedidos",
      path: "/client/orders",
      requireAuth: true,
    },
    { icon: User, label: "Perfil", path: "/client/profile", requireAuth: true },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background">
        <div className="relative flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const isCart = item.path === "/client/cart";

            if (isCart) {
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className="relative -translate-y-3 transform"
                >
                  <div
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg transition-all",
                      isActive ? "ring-2 ring-primary" : ""
                    )}
                  >
                    <Icon className="h-6 w-6 text-primary-foreground" />
                    {itemCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center">
                        <Badge className="absolute h-5 w-5 rounded-full p-0 text-xs">
                          {itemCount}
                        </Badge>
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-1 block text-center text-xs font-semibold",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
