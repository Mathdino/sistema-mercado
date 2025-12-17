import { PrismaClient } from "@prisma/client";

// Use the same singleton pattern as the app
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

async function seedTestData() {
  try {
    // Create test categories
    const categories = await prisma.category.createMany({
      data: [
        {
          id: "cat-1",
          name: "Padaria",
          icon: "🥖",
          image: "/bakery-bread-display.png",
        },
        {
          id: "cat-2",
          name: "Hortifruti",
          icon: "🍓",
          image: "/fresh-strawberry.jpg",
        },
        {
          id: "cat-3",
          name: "Açougue",
          icon: "🥩",
          image: "/meat-steak.jpg",
        },
      ],
      skipDuplicates: true,
    });

    console.log(`Created ${categories.count} categories`);

    // Create test products
    const products = await prisma.product.createMany({
      data: [
        {
          id: "prod-1",
          name: "Pão Francês",
          description: "Pão francês fresquinho do dia",
          price: 0.75,
          image: "/french-bread.png",
          categoryId: "cat-1",
          unit: "un",
          stock: 100,
          featured: true,
        },
        {
          id: "prod-2",
          name: "Morango",
          description: "Morango fresco e selecionado",
          price: 9.99,
          originalPrice: 12.99,
          image: "/fresh-strawberries.png",
          categoryId: "cat-2",
          unit: "kg",
          stock: 50,
          featured: true,
        },
        {
          id: "prod-3",
          name: "Picanha",
          description: "Picanha premium de primeira qualidade",
          price: 79.99,
          image: "/picanha-meat.jpg",
          categoryId: "cat-3",
          unit: "kg",
          stock: 20,
          featured: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`Created ${products.count} products`);

    console.log("✅ Test data seeded successfully!");
  } catch (error) {
    console.error("Error seeding test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();