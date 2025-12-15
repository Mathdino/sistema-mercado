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

    // Create default categories
    const categories = [
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

    const createdCategories = []
    for (const categoryData of categories) {
      const category = await prisma.category.upsert({
        where: { id: categoryData.id },
        update: {},
        create: categoryData
      })
      createdCategories.push(category)
      console.log(`Created/Updated category: ${categoryData.name}`)
    }

    console.log('Seed completed!')
    return NextResponse.json({ message: "Categories seeded successfully", categories: createdCategories })
  } catch (error: any) {
    console.error("Error seeding categories:", error)
    return NextResponse.json({ error: "internal_server_error", details: error.message }, { status: 500 })
  }
}