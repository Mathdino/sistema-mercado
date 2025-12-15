import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"

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

    // First, ensure we have categories
    const categories = await prisma.category.findMany()
    let categoryIds = categories.map(c => c.id)
    
    if (categories.length === 0) {
      // Create default categories
      const defaultCategories = [
        {
          id: 'category-bakery',
          name: 'Padaria',
          icon: '🥖',
          image: '/bakery-bread-display.png'
        },
        {
          id: 'category-produce',
          name: 'Hortifruti',
          icon: '🍓',
          image: '/fresh-strawberry.jpg'
        },
        {
          id: 'category-butcher',
          name: 'Açougue',
          icon: '🥩',
          image: '/meat-steak.jpg'
        }
      ]

      for (const categoryData of defaultCategories) {
        const category = await prisma.category.create({
          data: categoryData
        })
        categoryIds.push(category.id)
        console.log(`Created category: ${categoryData.name}`)
      }
    }

    // Create sample products
    const sampleProducts = [
      {
        name: "Pão Francês",
        description: "Pão francês fresquinho do dia",
        price: 0.50,
        image: "/french-bread.png",
        categoryId: categoryIds[0], // Padaria
        unit: "un",
        stock: 100,
        featured: true,
      },
      {
        name: "Morango",
        description: "Morango fresco e selecionado",
        price: 8.99,
        originalPrice: 12.99,
        image: "/fresh-strawberries.png",
        categoryId: categoryIds[1], // Hortifruti
        unit: "kg",
        stock: 50,
        featured: true,
      },
      {
        name: "Picanha",
        description: "Picanha premium de primeira qualidade",
        price: 69.99,
        image: "/picanha-meat.jpg",
        categoryId: categoryIds[2], // Açougue
        unit: "kg",
        stock: 20,
        featured: true,
      }
    ]

    const createdProducts = []
    for (const productData of sampleProducts) {
      const product = await prisma.product.create({
        data: productData
      })
      createdProducts.push(product)
      console.log(`Created product: ${productData.name}`)
    }

    console.log('Sample data seeding completed!')
    return NextResponse.json({ 
      message: "Sample data seeded successfully", 
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany()
    })
  } catch (error: any) {
    console.error("Error seeding sample data:", error)
    return NextResponse.json({ 
      error: "internal_server_error", 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}