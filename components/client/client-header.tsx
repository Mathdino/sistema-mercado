"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface ClientHeaderProps {
  showBack?: boolean;
}

export function ClientHeader({ showBack = false }: ClientHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Get the default address for the user
  const defaultAddress =
    user?.addresses?.find((address) => address.isDefault) ||
    user?.addresses?.[0];

  // Format user's name to show first and last name
  const formatUserName = (name: string | undefined) => {
    if (!name) return "";
    const nameParts = name.trim().split(" ");
    if (nameParts.length === 1) return nameParts[0];
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex flex-col">
            {user ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Olá, {formatUserName(user?.name)}
                </p>
                {defaultAddress && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-sm font-medium">
                      {defaultAddress.street}, {defaultAddress.number} -{" "}
                      {defaultAddress.city}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Bem-vindo,</p>
                <p className="text-sm font-medium">
                  faça seu login e aproveite nossas ofertas de casa
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
