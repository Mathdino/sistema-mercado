import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Received request to update order status")
    console.log("Order ID:", params.id)
    
    // Get the new status from request body
    const body = await req.json()
    const { status } = body
    
    console.log("New status:", status)
    
    // Validate status - explicitly check each value
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "DELIVERING",
      "DELIVERED",
      "CANCELLED"
    ]
    
    if (!status || !validStatuses.includes(status)) {
      console.log("Invalid status:", status)
      return NextResponse.json({ error: "invalid_status" }, { status: 400 })
    }
    
    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status: status as OrderStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            cpf: true,
          }
        },
        items: true,
        deliveryAddress: true,
      },
    })
    
    console.log("Order updated successfully")
    // Return the updated order with all related data
    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    console.error("Error updating order status:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}