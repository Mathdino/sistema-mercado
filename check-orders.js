const { PrismaClient } = require('@prisma/client');

async function checkOrders() {
  const prisma = new PrismaClient();
  
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true
      }
    });
    
    console.log('All orders:');
    orders.forEach(order => {
      console.log(`ID: ${order.id}, Status: ${order.status}`);
    });
    
    // Check for any invalid statuses
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];
    const invalidOrders = orders.filter(order => !validStatuses.includes(order.status));
    
    if (invalidOrders.length > 0) {
      console.log('\nInvalid orders found:');
      invalidOrders.forEach(order => {
        console.log(`ID: ${order.id}, Invalid Status: ${order.status}`);
      });
    } else {
      console.log('\nAll orders have valid statuses');
    }
  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();