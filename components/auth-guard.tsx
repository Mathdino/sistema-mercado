"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: "client" | "admin";
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireRole,
}: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, loginWithOAuth } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const tryRestoreFromCookie = async () => {
      try {
        const res = await fetch("/api/users/me", { method: "PUT" });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            loginWithOAuth(data.user);
          }
        }
      } catch {}
    };
    if (hydrated && !isAuthenticated) {
      tryRestoreFromCookie();
    }
  }, [hydrated, isAuthenticated, loginWithOAuth]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (requireAuth && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (requireRole && user?.role !== requireRole) {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, user, requireAuth, requireRole, router]);

  if (!hydrated) {
    return null;
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireRole && user?.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}
