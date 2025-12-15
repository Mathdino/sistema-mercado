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

    // Fetch all products with their original prices (promotions)
    const products = await prisma.product.findMany({
      where: {
        originalPrice: {
          not: null
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(products)
  } catch (error: any) {
    console.error("Error fetching promotions:", error)
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
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    })
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { productId, originalPrice, promotionEndDate } = body

    // Validate required fields
    if (!productId || !originalPrice || !promotionEndDate) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 })
    }

    // Validate price
    if (isNaN(originalPrice) || originalPrice <= 0) {
      return NextResponse.json({ error: "invalid_price" }, { status: 400 })
    }

    // Validate date
    const endDate = new Date(promotionEndDate)
    if (isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: "product_not_found" }, { status: 400 })
    }

    // Set the original price as the current price and update the price to the promotional price
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        originalPrice: product.price, // Store current price as original
        price: parseFloat(originalPrice), // Set new promotional price
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error("Error creating promotion:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}