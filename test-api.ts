import prisma from "@/lib/prisma";

async function testApi() {
  try {
    // Test fetching orders directly from database
    const orders = await prisma.order.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Just get a few orders for testing
    });
    
    console.log("Database Orders Count:", orders.length);
    console.log("Sample Order Statuses:", orders.map(o => o.status));
    
    // Test total count
    const totalOrders = await prisma.order.count();
    console.log("Total Orders in DB:", totalOrders);
  } catch (error) {
    console.error("Test API Error:", error);
  }
}

testApi();