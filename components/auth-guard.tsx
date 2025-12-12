"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: "client" | "admin"
}

export function AuthGuard({ children, requireAuth = true, requireRole }: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (requireRole && user?.role !== requireRole) {
      router.push("/")
    }
  }, [isAuthenticated, user, requireAuth, requireRole, router])

  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (requireRole && user?.role !== requireRole) {
    return null
  }

  return <>{children}</>
}
