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
    
    // Fetch orders for the authenticated user
    const orders = await prisma.order.findMany({
      where: {
        userId: decoded.sub
      },
      include: {
        items: true,
        deliveryAddress: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    
    // Transform orders to match frontend types
    const transformedOrders = orders.map(order => ({
      ...order,
      status: order.status.toLowerCase(),
      paymentMethod: order.paymentMethod.toLowerCase(),
    }))
    
    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}