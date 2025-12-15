import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"

export async function PUT(
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

    const body = await req.json()
    const { name, icon, image } = body

    // Validate required fields
    if (!name || !icon || !image) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 })
    }

    // Update the category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        icon,
        image
      }
    })

    return NextResponse.json(category)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "category_not_found" }, { status: 404 })
    }
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}

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

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id }
    })

    if (productCount > 0) {
      return NextResponse.json({ error: "category_has_products" }, { status: 400 })
    }

    // Delete the category
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "category_not_found" }, { status: 404 })
    }
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}