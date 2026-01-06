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
    
    // Transform orders to match frontend types with coupon and cashback info
    const transformedOrders = orders.map(order => ({
      ...order,
      status: order.status.toLowerCase(),
      paymentMethod: order.paymentMethod.toLowerCase(),
      coupon: null, // We'll add coupon info separately if needed
      cashbackAmount: order.cashbackAmount // Use the cashbackAmount stored in the order
    }))
    
    // For each order, get the coupon information separately to avoid type conflicts
    const ordersWithCouponInfo = await Promise.all(transformedOrders.map(async (order) => {
      let coupon = null;
      try {
        // Try to get coupon info based on UserCoupon records around the order time
        const userCoupons = await prisma.userCoupon.findMany({
          where: {
            userId: order.userId,
            usedAt: {
              gte: new Date(order.createdAt.getTime() - 60000), // 1 minute before
              lte: new Date(order.createdAt.getTime() + 60000)  // 1 minute after
            }
          },
          include: {
            coupon: true
          }
        });
        
        if (userCoupons.length > 0) {
          // Find the most relevant one (closest to order creation time)
          const relevantUserCoupon = userCoupons.reduce((closest: any, current: any) => {
            const currentDiff = Math.abs(new Date(current.usedAt).getTime() - new Date(order.createdAt).getTime());
            const closestDiff = Math.abs(new Date(closest.usedAt).getTime() - new Date(order.createdAt).getTime());
            return currentDiff < closestDiff ? current : closest;
          });
          
          coupon = {
            id: relevantUserCoupon.coupon.id,
            code: relevantUserCoupon.coupon.code,
            discount: relevantUserCoupon.coupon.discount,
            type: relevantUserCoupon.coupon.type
          };
        }
      } catch (error) {
        console.error("Error fetching coupon info:", error);
        // Continue without coupon info if there's an error
      }
      
      return {
        ...order,
        coupon: coupon
      };
    }));
    
    return NextResponse.json(ordersWithCouponInfo)
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}