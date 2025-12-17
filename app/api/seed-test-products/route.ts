import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    // Check if we already have products
    const existingProducts = await prisma.product.findMany()
    
    if (existingProducts.length > 0) {
      return NextResponse.json({ 
        message: "Products already exist", 
        count: existingProducts.length 
      })
    }

    // Create test categories first
    const categories = await prisma.category.findMany()
    let categoryIds = categories.map(c => c.id)
    
    if (categories.length === 0) {
      // Create default categories
      const defaultCategories = [
        {
          id: 'cat-1',
          name: 'Padaria',
          icon: '🥖',
          image: '/bakery-bread-display.png'
        },
        {
          id: 'cat-2',
          name: 'Hortifruti',
          icon: '🍓',
          image: '/fresh-strawberry.jpg'
        },
        {
          id: 'cat-3',
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

    // Create test products
    const testProducts = [
      {
        id: 'prod-1',
        name: "Pão Francês",
        description: "Pão francês fresquinho do dia",
        price: 0.75,
        image: "/french-bread.png",
        categoryId: categoryIds[0], // Padaria
        unit: "un",
        stock: 100,
        featured: true,
      },
      {
        id: 'prod-2',
        name: "Morango",
        description: "Morango fresco e selecionado",
        price: 9.99,
        originalPrice: 12.99,
        image: "/fresh-strawberries.png",
        categoryId: categoryIds[1], // Hortifruti
        unit: "kg",
        stock: 50,
        featured: true,
      },
      {
        id: 'prod-3',
        name: "Picanha",
        description: "Picanha premium de primeira qualidade",
        price: 79.99,
        image: "/picanha-meat.jpg",
        categoryId: categoryIds[2], // Açougue
        unit: "kg",
        stock: 20,
        featured: true,
      }
    ]

    const createdProducts = []
    for (const productData of testProducts) {
      const product = await prisma.product.create({
        data: productData
      })
      createdProducts.push(product)
      console.log(`Created product: ${productData.name}`)
    }

    console.log('Test data seeding completed!')
    return NextResponse.json({ 
      message: "Test data seeded successfully", 
      products: createdProducts
    })
  } catch (error: any) {
    console.error("Error seeding test data:", error)
    return NextResponse.json({ 
      error: "internal_server_error", 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}