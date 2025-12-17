"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, User, Address, Order } from "./types"
import { mockUser, mockProducts } from "./mock-data"

interface CartStore {
  items: CartItem[]
  addItem: (productId: string, quantity?: number) => Promise<void>
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  // New method to clean up invalid items
  cleanupInvalidItems: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (productId, quantity = 1) => {
        console.log("=== CART STORE DEBUG ===");
        console.log("addItem called with:", { productId, quantity });
        console.log("Product ID type:", typeof productId);
        console.log("Product ID value:", `"${productId}"`);
        console.log("Product ID truthy:", !!productId);
        console.log("Product ID strict equals 'undefined':", productId === "undefined");
        console.log("Product ID strict equals 'null':", productId === "null");
        console.log("========================");
        
        // Comprehensive validation of product ID
        if (!productId || 
            productId === "undefined" || 
            productId === "null" || 
            productId === "" || 
            typeof productId !== "string") {
          console.error("Invalid product ID provided:", productId, typeof productId);
          
          // Try to find any valid mock product as fallback
          const defaultProduct = mockProducts.find(p => p.id && p.id !== "undefined" && p.id !== "null");
          if (defaultProduct) {
            console.log("Using default mock product:", defaultProduct);
            set((state) => ({
              items: [...state.items, { 
                productId: defaultProduct.id, 
                quantity, 
                price: defaultProduct.price 
              }],
            }));
          } else {
            console.log("No valid mock products found, using unknown product");
            set((state) => ({
              items: [...state.items, { productId: "unknown", quantity, price: 0 }],
            }));
          }
          return;
        }
        
        // First check if we already have the product in state
        const existingItemIndex = get().items.findIndex((item) => item.productId === productId);
        
        if (existingItemIndex !== -1) {
          // If item exists, update quantity
          set((state) => ({
            items: state.items.map((item, index) =>
              index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item,
            ),
          }));
          return;
        }

        // Try to fetch the specific product from the database
        try {
          // Additional validation before making the API call
          if (!productId || productId.trim() === "") {
            console.error("Cannot fetch product: Product ID is empty or invalid", productId);
            set((state) => ({
              items: [...state.items, { productId: "unknown", quantity, price: 0 }],
            }));
            return;
          }
          
          // Log the URL we're about to call
          const apiUrl = `/api/products/${encodeURIComponent(productId)}`;
          console.log("Fetching product from URL:", apiUrl);
          
          const response = await fetch(apiUrl);
          console.log("Product fetch response status:", response.status);
          
          if (response.ok) {
            const product = await response.json();
            console.log("Fetched product:", product);
            
            // Ensure we have a valid price - only use 0 as fallback if product.price is truly invalid
            let price = 0;
            if (typeof product.price === 'number') {
              price = product.price;
            }
            console.log("Using price:", price);
            
            set((state) => ({
              items: [...state.items, { productId, quantity, price }],
            }));
            return;
          } else {
            const errorText = await response.text();
            console.error("Failed to fetch product:", response.status, response.statusText, "Body:", errorText);
            
            // If product not found (404), we should not add it to cart
            if (response.status === 404) {
              console.error("Product not found in database, not adding to cart");
              return;
            }
            
            // For other errors, add item with default price
            set((state) => ({
              items: [...state.items, { productId, quantity, price: 0 }],
            }));
            return; // Return early to prevent duplication
          }
        } catch (error) {
          console.error("Error fetching product price:", error);
          
          // Add item with default price if fetch fails
          set((state) => ({
            items: [...state.items, { productId, quantity, price: 0 }],
          }));
          return; // Return early to prevent duplication
        }
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
      // New method to clean up invalid items
      cleanupInvalidItems: () => {
        set((state) => ({
          items: state.items.filter((item) => 
            item.productId && 
            item.productId !== "undefined" && 
            item.productId !== "null" && 
            item.productId !== ""
          ),
        }))
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
