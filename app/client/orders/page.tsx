"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ClientHeader } from "@/components/client/client-header"
import { BottomNav } from "@/components/client/bottom-nav"
import { LoginModal } from "@/components/client/login-modal"
import { OrderCard } from "@/components/client/order-card"
import { useAuthStore } from "@/lib/store"
import { Clock } from "lucide-react"

export default function OrdersPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Mark the component as hydrated after mount
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      setIsLoginModalOpen(true)
    }
  }, [isHydrated, isAuthenticated])

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!isAuthenticated || !user?.id) return
    
    try {
      const response = await fetch("/api/orders/me")
      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      if (loading) {
        setLoading(false)
      }
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [isAuthenticated, user?.id])

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const interval = setInterval(() => {
      fetchOrders()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, user?.id])

  const userOrders = useMemo(() => {
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders])

  const handleLoginSuccess = () => {
    // User successfully logged in, page will re-render with authenticated state
  }

  // Don't render anything until hydration is complete
  if (!isHydrated) {
    return null
  }

  if (!isAuthenticated && !isLoginModalOpen) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <ClientHeader />
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <p>Carregando pedidos...</p>
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

  if (userOrders.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <ClientHeader />
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <Clock className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Nenhum pedido ainda</h2>
          <p className="mt-2 text-center text-muted-foreground">Seus pedidos aparecerão aqui</p>
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader />
      <main className="space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Meus pedidos</h1>
        <div className="space-y-3">
          {userOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
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