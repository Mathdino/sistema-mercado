"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "./store";
import { toast } from "@/hooks/use-toast";

interface CashbackData {
  isActive: boolean;
  eligible: boolean;
  percentage: number;
  amount: number;
  lastOrderTotal: number;
  lastOrderDate: string | null;
}

export function useCashbackNotification() {
  const { isAuthenticated, user } = useAuthStore();
  const [hasCheckedCashback, setHasCheckedCashback] = useState(false);

  useEffect(() => {
    const checkCashback = async () => {
      if (!isAuthenticated || !user || hasCheckedCashback) return;

      try {
        const token =
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1] || "";

        const response = await fetch("/api/client/cashback", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (response.ok) {
          const data: CashbackData = await response.json();
          
          // Verifica se o usuário é elegível e tem cashback disponível
          if (data.isActive && data.eligible && data.amount > 0) {
            // Mostra notificação apenas uma vez por sessão
            if (!sessionStorage.getItem("cashbackNotified")) {
              toast({
                title: "🎉 Você tem cashback disponível!",
                description: `Parabéns! Você tem R$ ${data.amount.toFixed(2)} em cashback para usar em sua próxima compra.`,
                duration: 8000,
              });
              
              // Marca que a notificação já foi mostrada nesta sessão
              sessionStorage.setItem("cashbackNotified", "true");
            }
          }
        }
      } catch (error) {
        console.error("Error checking cashback:", error);
      } finally {
        setHasCheckedCashback(true);
      }
    };

    // Delay pequeno para garantir que o componente está montado
    const timer = setTimeout(checkCashback, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, hasCheckedCashback]);

  // Reset flag quando o usuário faz logout
  useEffect(() => {
    if (!isAuthenticated) {
      setHasCheckedCashback(false);
      sessionStorage.removeItem("cashbackNotified");
    }
  }, [isAuthenticated]);
}