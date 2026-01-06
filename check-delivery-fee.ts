import prisma from "@/lib/prisma";

async function checkDeliveryFees() {
  try {
    console.log("Checking for delivery fees in the database...");
    
    // Check all delivery fees
    const allFees = await prisma.deliveryFee.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    console.log("All delivery fees:", allFees);
    
    // Check active delivery fees
    const activeFee = await prisma.deliveryFee.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    
    console.log("Active delivery fee:", activeFee);
    
    if (!activeFee) {
      console.log("❌ No active delivery fee found!");
      console.log("Creating a default fixed delivery fee...");
      
      // Create a default fixed delivery fee
      const defaultFee = await prisma.deliveryFee.create({
        data: {
          type: 'FIXED',
          fixedValue: 5.99,
          isActive: true,
        },
      });
      
      console.log("✅ Created default delivery fee:", defaultFee);
    } else {
      console.log("✅ Active delivery fee found:", activeFee);
    }
  } catch (error) {
    console.error("Error checking delivery fees:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeliveryFees();