"use client"

import { useState, useEffect } from "react"
import { ClientHeader } from "@/components/client/client-header"
import { BottomNav } from "@/components/client/bottom-nav"
import { LoginModal } from "@/components/client/login-modal"
import { CategoryGrid } from "@/components/client/category-grid"
import { PromoBanner } from "@/components/client/promo-banner"
import { FeaturedProducts } from "@/components/client/featured-products"
import { useAuthStore } from "@/lib/store"

export default function ClientPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // This page doesn't require authentication, but we might want to show the modal
    // if the user was redirected here after trying to access a protected feature
  }, [])

  const handleLoginSuccess = () => {
    // User successfully logged in
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader />
      <main className="space-y-6 px-4 py-6">
        <PromoBanner />
        <CategoryGrid />
        <FeaturedProducts />
      </main>
      <BottomNav />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}