import prisma from "@/lib/prisma";

async function fixOrderStatuses() {
  try {
    console.log("Starting order status cleanup...");
    
    // First, let's see what statuses we have in the database
    const allOrders = await prisma.order.findMany();
    const statusCounts: Record<string, number> = {};
    
    allOrders.forEach(order => {
      const statusStr = String(order.status);
      statusCounts[statusStr] = (statusCounts[statusStr] || 0) + 1;
    });
    
    console.log("Current status distribution:", statusCounts);
    
    // Update orders with old statuses to the new ones using raw SQL
    console.log("Updating PREPARING orders to CONFIRMED...");
    const preparingUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CONFIRMED' WHERE status = 'PREPARING'`;
    console.log(`Updated ${preparingUpdated} PREPARING orders`);
    
    console.log("Updating DELIVERING orders to CONFIRMED...");
    const deliveringUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CONFIRMED' WHERE status = 'DELIVERING'`;
    console.log(`Updated ${deliveringUpdated} DELIVERING orders`);
    
    console.log("Updating DELIVERED orders to CONFIRMED...");
    const deliveredUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CONFIRMED' WHERE status = 'DELIVERED'`;
    console.log(`Updated ${deliveredUpdated} DELIVERED orders`);
    
    console.log("Updating CANCELED orders to CANCELLED...");
    const canceledUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CANCELLED' WHERE status = 'CANCELED'`;
    console.log(`Updated ${canceledUpdated} CANCELED orders`);
    
    console.log("Cleanup completed successfully!");
    
    // Check final status distribution
    const finalOrders = await prisma.order.findMany();
    const finalStatusCounts: Record<string, number> = {};
    
    finalOrders.forEach(order => {
      const statusStr = String(order.status);
      finalStatusCounts[statusStr] = (finalStatusCounts[statusStr] || 0) + 1;
    });
    
    console.log("Final status distribution:", finalStatusCounts);
    
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    // Note: We don't disconnect the prisma client since it's a singleton
  }
}

fixOrderStatuses();