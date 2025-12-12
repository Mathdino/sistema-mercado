"use client"

import Image from "next/image"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/currency"
import { useCartStore, useAuthStore } from "@/lib/store"
import { LoginModal } from "@/components/client/login-modal"
import type { CartItem, Product } from "@/lib/types"

interface CartItemCardProps {
  item: CartItem & { product: Product }
}

export function CartItemCard({ item }: CartItemCardProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { updateQuantity, removeItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const handleIncrease = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }
    updateQuantity(item.productId, item.quantity + 1)
  }

  const handleDecrease = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }
    
    if (item.quantity === 1) {
      removeItem(item.productId)
    } else {
      updateQuantity(item.productId, item.quantity - 1)
    }
  }

  const handleRemove = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }
    removeItem(item.productId)
  }

  const handleLoginSuccess = () => {
    // After login, we can perform the action that was attempted
    // In this case, we'll just close the modal and let the user retry the action
  }

  return (
    <>
      <Card>
        <CardContent className="flex gap-4 p-3">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={item.product.image || "/placeholder.svg"} alt={item.product.name} fill className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-1">
              <h3 className="line-clamp-2 text-sm font-medium leading-tight">{item.product.name}</h3>
              <p className="text-sm font-bold text-primary">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-lg border bg-background">
                <Button variant="ghost" size="icon" onClick={handleDecrease} className="h-8 w-8">
                  {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                </Button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <Button variant="ghost" size="icon" onClick={handleIncrease} className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  )
}