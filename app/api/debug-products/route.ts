import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Fetch all products with their IDs
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        description: true
      }
    })

    // Also fetch categories
    const categories = await prisma.category.findMany()

    return NextResponse.json({
      products,
      categories,
      productCount: products.length
    })
  } catch (error: any) {
    console.error("Error fetching debug products:", error)
    return NextResponse.json({ error: "internal_server_error", message: error.message }, { status: 500 })
  }
}