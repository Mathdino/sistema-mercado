import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the actual values
    const { id } = await params;
    
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

    // Check if product exists and has a promotion (originalPrice)
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: "product_not_found" }, { status: 404 })
    }

    if (product.originalPrice === null) {
      return NextResponse.json({ error: "product_not_in_promotion" }, { status: 400 })
    }

    // Remove the promotion by restoring the original price and clearing the originalPrice field
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        price: product.originalPrice, // Restore original price
        originalPrice: null, // Clear the original price field
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error("Error removing promotion:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}