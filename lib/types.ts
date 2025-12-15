export interface User {
  id: string
  email?: string
  cpf?: string
  name: string
  phone: string
  role: "client" | "admin"
  addresses: Address[]
  createdAt: string
}

export interface Address {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  image: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  categoryId: string
  unit: string
  size?: string
  stock: number
  featured: boolean
}

export interface CartItem {
  productId: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  deliveryFee: number
  subtotal: number
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled"
  paymentMethod: "credit" | "debit" | "pix" | "cash"
  deliveryAddress: Address
  createdAt: string
  estimatedDelivery?: string
  notes?: string
  user?: {
    id: string
    name: string
    phone: string
    email?: string
    cpf?: string
  }
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
  subtotal: number
}

export interface Market {
  id: string
  name: string
  address: string
  phone: string
  openingHours: string
  deliveryFee: number
  minOrderValue: number
  estimatedDeliveryTime: string
  rating: number
  logo: string
  banner: string
}