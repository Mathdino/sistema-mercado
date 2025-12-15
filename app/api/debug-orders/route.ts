import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"

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

    // Fetch all orders to check their statuses
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Check for any invalid statuses
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];
    const invalidOrders = orders.filter(order => !validStatuses.includes(order.status));
    
    return NextResponse.json({
      totalOrders: orders.length,
      orders,
      invalidOrders: {
        count: invalidOrders.length,
        orders: invalidOrders
      }
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "internal_server_error", details: error.message }, { status: 500 });
  }
}