import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"
import { OrderStatus, PaymentMethod } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token: string | null = null
    const authHeader = req.headers.get("authorization")
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // If not in header, try to get from cookies
      const cookieHeader = req.headers.get("cookie")
      if (cookieHeader) {
        // Split cookies by semicolon and trim whitespace
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split("=")
          if (name && value) {
            acc[name] = value
          }
          return acc
        }, {} as Record<string, string>)
        
        token = cookies.token || null
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    
    // Verify the JWT token
    let decoded
    try {
      decoded = await verifyJwt(token)
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 })
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    })
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    
    // Fetch all orders with user data
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            cpf: true,
          }
        },
        items: true,
        deliveryAddress: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token: string | null = null
    const authHeader = req.headers.get("authorization")
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // If not in header, try to get from cookies
      const cookieHeader = req.headers.get("cookie")
      if (cookieHeader) {
        // Split cookies by semicolon and trim whitespace
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split("=")
          if (name && value) {
            acc[name] = value
          }
          return acc
        }, {} as Record<string, string>)
        
        token = cookies.token || null
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    
    // Verify the JWT token
    let decoded
    try {
      decoded = await verifyJwt(token)
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 })
    }
    
    const body = await req.json()
    
    const { 
      items, 
      totalAmount, 
      deliveryFee, 
      subtotal, 
      paymentMethod, 
      deliveryAddressId, 
      notes 
    } = body
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }
    
    if (!totalAmount || !deliveryFee || !subtotal) {
      return NextResponse.json({ error: "Amount fields are required" }, { status: 400 })
    }
    
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 })
    }
    
    if (!deliveryAddressId) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 })
    }
    
    // Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }
    
    // Validate delivery address belongs to user
    const address = await prisma.address.findUnique({
      where: {
        id: deliveryAddressId,
        userId: decoded.sub
      }
    })
    
    if (!address) {
      return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 })
    }
    
    // Validate all products exist
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    })
    
    const productMap = new Map(products.map(product => [product.id, product]))
    
    for (const item of items) {
      if (!productMap.has(item.productId)) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      }
    }
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: decoded.sub,
        totalAmount,
        deliveryFee,
        subtotal,
        paymentMethod,
        deliveryAddressId,
        notes,
        status: OrderStatus.PENDING,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: productMap.get(item.productId)!.name,
            productImage: productMap.get(item.productId)!.image,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          }))
        }
      },
      include: {
        items: true,
        deliveryAddress: true,
        user: true
      }
    })
    
    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}