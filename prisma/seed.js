const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()

  try {
    // Create default categories
    const categories = [
      {
        id: 'category-bakery',
        name: 'Padaria',
        icon: '🥖',
        image: '/bakery-bread-display.png'
      },
      {
        id: 'category-produce',
        name: 'Hortifruti',
        icon: '🍓',
        image: '/fresh-strawberry.jpg'
      },
      {
        id: 'category-butcher',
        name: 'Açougue',
        icon: '🥩',
        image: '/meat-steak.jpg'
      }
    ]

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {},
        create: category
      })
      console.log(`Created/Updated category: ${category.name}`)
    }

    console.log('Seed completed!')
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()