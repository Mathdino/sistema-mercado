import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url)
    const categoryId = url.searchParams.get("category")
    const search = url.searchParams.get("search")
    const featuredOnly = url.searchParams.get("featured") === "true"
    const onPromotion = url.searchParams.get("promotion") === "true"

    // Cleanup expired promotions
    const now = new Date();
    const expiredProducts = await prisma.product.findMany({
      where: {
        originalPrice: { not: null },
        promotionEndsAt: { lt: now }
      }
    });

    if (expiredProducts.length > 0) {
      console.log(`Found ${expiredProducts.length} expired promotions. Cleaning up...`);
      for (const product of expiredProducts) {
        if (product.originalPrice) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              price: product.originalPrice,
              originalPrice: null,
              promotionEndsAt: null,
              updatedAt: new Date()
            }
          });
        }
      }
    }

    // Build where clause for products
    const whereClause: any = {}
    
    // Filter by category if provided
    if (categoryId) {
      whereClause.categoryId = categoryId
    }
    
    // Filter by search term if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Filter by featured products if requested
    if (featuredOnly) {
      whereClause.featured = true
    }
    
    // Filter by products on promotion if requested
    if (onPromotion) {
      whereClause.originalPrice = { not: null }
    }

    // Fetch products with category information
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Fetch all categories for the category tabs
    const categories = await prisma.category.findMany({
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

    return NextResponse.json({
      products,
      categories,
      featuredProducts,
      promotionProducts,
      totalProducts: products.length
    })
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}