"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, User, Address, Order } from "./types"
import { mockUser, mockProducts } from "./mock-data"

interface CartStore {
  items: CartItem[]
  addItem: (productId: string, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId, quantity = 1) => {
        const product = mockProducts.find((p) => p.id === productId)
        if (!product) return

        set((state) => {
          const existingItem = state.items.find((item) => item.productId === productId)
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
              ),
            }
          }
          return {
            items: [...state.items, { productId, quantity, price: product.price }],
          }
        })
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }))
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        }))
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (identifier: string, password: string) => Promise<boolean>
  loginWithOAuth: (user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  addAddress: (address: Omit<Address, "id">) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (identifier, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
          })
          const data = await res.json()
          if (res.ok && data.user) {
            set({ user: data.user, isAuthenticated: true })
            return true
          }
          return false
        } catch {
          return false
        }
      },
      loginWithOAuth: (oauthUser) => {
        set({ user: oauthUser, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },
      addAddress: (address) => {
        set((state) => {
          if (!state.user) return state
          const newAddress = { ...address, id: String(Date.now()) }
          return {
            user: {
              ...state.user,
              addresses: [...state.user.addresses, newAddress],
            },
          }
        })
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)

interface OrderStore {
  orders: Order[]
  addOrder: (order: Omit<Order, "id" | "createdAt">) => void
  updateOrderStatus: (orderId: string, status: Order["status"]) => void
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }))
      },
      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
        }))
      },
    }),
    {
      name: "order-storage",
    },
  ),
)
