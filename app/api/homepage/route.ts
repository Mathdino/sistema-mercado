import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Fetch categories
    const categories = await prisma.category.findMany({
      take: 8,
      orderBy: {
        name: "asc"
      }
    })

    // Fetch featured products
    const featuredProducts = await prisma.product.findMany({
      where: {
        featured: true
      },
      include: {
        category: true
      },
      take: 10,
      orderBy: {
        createdAt: "desc"
      }
    })

    // Fetch products on promotion
    const promotionProducts = await prisma.product.findMany({
      where: {
        originalPrice: {
          not: null
        }
      },
      include: {
        category: true
      },
      take: 10,
      orderBy: {
        createdAt: "desc"
      }
    })

    // Fetch market info (assuming there's only one market for now)
    const market = await prisma.market.findFirst()

    return NextResponse.json({
      categories,
      featuredProducts,
      promotionProducts,
      market: market || null
    })
  } catch (error: any) {
    console.error("Error fetching homepage data:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}