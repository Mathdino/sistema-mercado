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
    
    // Get pagination parameters from query string
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Fetch orders with pagination
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
      skip,
      take: limit,
    });
    
    // Normalize orders to handle legacy status values
    const normalizedOrders = orders.map(order => {
      // Normalize the status to one of our valid statuses
      let normalizedStatus: any = "PENDING"; // default fallback
      
      // Since we've changed the enum, we need to handle string comparison
      // We need to convert the enum value to string first
      const statusString = String(order.status);
      
      switch (statusString) {
        case "PENDING":
          normalizedStatus = "PENDING";
          break;
        case "CONFIRMED":
        case "PREPARING":
        case "DELIVERING":
        case "DELIVERED":
          normalizedStatus = "CONFIRMED";
          break;
        case "CANCELLED":
        case "CANCELED": // Handle potential variation
          normalizedStatus = "CANCELLED";
          break;
        default:
          normalizedStatus = "PENDING"; // fallback for any unexpected statuses
      }
      
      return {
        ...order,
        status: normalizedStatus
      };
    });

    // Get total count for pagination
    const totalOrders = await prisma.order.count();

    return NextResponse.json({
      orders: normalizedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page < Math.ceil(totalOrders / limit),
        hasPrevPage: page > 1,
      }
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    // Log more detailed error information
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    
    // Try to fetch orders with raw query to bypass Prisma validation
    try {
      console.log("Attempting to fetch orders with raw query...");
      const rawOrders: any[] = await prisma.$queryRaw`SELECT id, status FROM "Order" ORDER BY "createdAt" DESC LIMIT 5`;
      console.log("Raw orders:", rawOrders);
    } catch (rawError: any) {
      console.error("Error with raw query:", rawError);
    }
    
    return NextResponse.json({ 
      error: "internal_server_error", 
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== New Simplified Order Creation Started ===");
    
    // Simple authentication - get token from cookies
    const cookieHeader = req.headers.get("cookie");
    let token = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split("=");
        if (name && value) {
          acc[name] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies.token || null;
    }
    
    if (!token) {
      console.log("No token found in cookies");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    
    // Verify the JWT token
    let decoded;
    try {
      decoded = await verifyJwt(token);
      console.log("Token verified for user:", decoded.sub);
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }
    
    const body = await req.json();
    console.log("Order request body:", JSON.stringify(body, null, 2));
    
    const { 
      items, 
      totalAmount, 
      deliveryFee, 
      subtotal, 
      paymentMethod, 
      deliveryAddressId, 
      notes,
      couponId,
      cashbackAmount
    } = body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }
    
    if (totalAmount === undefined || deliveryFee === undefined || subtotal === undefined) {
      return NextResponse.json({ error: "Amount fields are required" }, { status: 400 });
    }
    
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }
    
    if (!deliveryAddressId) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }
    
    // Validate payment method
    const validPaymentMethods = ["PIX", "CREDIT", "DEBIT", "CASH"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    
    // Validate delivery address belongs to user
    const address = await prisma.address.findUnique({
      where: {
        id: deliveryAddressId,
        userId: decoded.sub
      }
    });
    
    if (!address) {
      return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 });
    }
    
    console.log("All validations passed, creating order...");
    
    // If couponId provided, validate coupon eligibility again server-side
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId }
      });
      if (!coupon) {
        return NextResponse.json({ error: "invalid_coupon" }, { status: 400 });
      }
      if (!coupon.isActive) {
        return NextResponse.json({ error: "coupon_inactive" }, { status: 400 });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: "coupon_expired" }, { status: 400 });
      }
      if (typeof coupon.maxUses === "number" && coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "coupon_max_uses_reached" }, { status: 400 });
      }
      const alreadyUsed = await prisma.userCoupon.findFirst({
        where: { userId: decoded.sub, couponId }
      });
      if (alreadyUsed) {
        return NextResponse.json({ error: "coupon_already_used_by_user" }, { status: 400 });
      }
    }
    
    // Simple order creation using Prisma Client
    const order = await prisma.order.create({
      data: {
        userId: decoded.sub,
        totalAmount: parseFloat(totalAmount),
        deliveryFee: parseFloat(deliveryFee),
        subtotal: parseFloat(subtotal),
        cashbackAmount: cashbackAmount ? parseFloat(cashbackAmount) : 0,
        status: "PENDING",
        paymentMethod: paymentMethod,
        deliveryAddressId: deliveryAddressId,
        notes: notes || null,
      }
    });
    
    console.log("Order created with ID:", order.id);
    
    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal),
        }
      });
    }
    
    console.log("Order items created");
    
    // Record coupon usage and increment counter if applied
    if (couponId) {
      await prisma.$transaction([
        prisma.userCoupon.create({
          data: {
            userId: decoded.sub,
            couponId
          }
        }),
        prisma.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } }
        })
      ]);
      console.log("Coupon usage recorded and count incremented");
    }
    
    // Get complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        deliveryAddress: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            cpf: true,
          }
        }
      }
    });
    
    console.log("Order creation completed successfully");
    return NextResponse.json(completeOrder);
    
  } catch (error) {
    console.error("=== ORDER CREATION ERROR ===");
    console.error("Error creating order:", error);
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
