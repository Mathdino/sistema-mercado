import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Fetch a few products to test with
    const products = await prisma.product.findMany({
      take: 3,
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      products
    })
  } catch (error: any) {
    console.error("Error fetching test products:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}