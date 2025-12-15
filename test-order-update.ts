import { PrismaClient } from "@prisma/client"

async function testOrderUpdate() {
  const prisma = new PrismaClient()
  
  try {
    // Get all orders
    const orders = await prisma.order.findMany()
    console.log("Found orders:", orders.length)
    
    if (orders.length > 0) {
      const firstOrder = orders[0]
      console.log("First order:", firstOrder)
      
      // Try to update the first order's status
      const updatedOrder = await prisma.order.update({
        where: { id: firstOrder.id },
        data: { status: "CONFIRMED" }
      })
      
      console.log("Updated order:", updatedOrder)
    } else {
      console.log("No orders found in database")
    }
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testOrderUpdate()