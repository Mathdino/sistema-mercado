const { PrismaClient } = require('@prisma/client');

async function checkCategories() {
  const prisma = new PrismaClient();
  
  try {
    const categories = await prisma.category.findMany();
    console.log('Categories:', categories);
    
    if (categories.length === 0) {
      console.log('No categories found. Creating default categories...');
      
      // Create some default categories
      const defaultCategories = [
        {
          name: "Padaria",
          icon: "🥖",
          image: "/bakery-bread-display.png"
        },
        {
          name: "Hortifruti",
          icon: "🍓",
          image: "/fresh-strawberry.jpg"
        },
        {
          name: "Açougue",
          icon: "🥩",
          image: "/meat-steak.jpg"
        }
      ];
      
      for (const category of defaultCategories) {
        await prisma.category.create({
          data: category
        });
        console.log(`Created category: ${category.name}`);
      }
      
      const updatedCategories = await prisma.category.findMany();
      console.log('Updated categories:', updatedCategories);
    }
  } catch (error) {
    console.error('Error checking categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();