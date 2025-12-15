import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import { hashPassword } from '../lib/password'

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL || ""
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seeding...')
  
  try {
    // Create categories
    const categories = await prisma.category.createMany({
      data: [
        {
          id: '1',
          name: 'Padaria',
          icon: '🥖',
          image: '/bakery-bread-display.png',
        },
        {
          id: '2',
          name: 'Hortifruti',
          icon: '🍓',
          image: '/fresh-strawberry.jpg',
        },
        {
          id: '3',
          name: 'Açougue',
          icon: '🥩',
          image: '/meat-steak.jpg',
        },
        {
          id: '4',
          name: 'Bebidas',
          icon: '🥤',
          image: '/beverages-drinks.jpg',
        },
        {
          id: '5',
          name: 'Mercearia',
          icon: '🛒',
          image: '/busy-grocery-aisle.png',
        },
        {
          id: '6',
          name: 'Pet Shop',
          icon: '🐕',
          image: '/pet-supplies.png',
        },
        {
          id: '7',
          name: 'Limpeza',
          icon: '🧹',
          image: '/assorted-cleaning-supplies.png',
        },
        {
          id: '8',
          name: 'Gourmet',
          icon: '🍷',
          image: '/gourmet-food-display.png',
        },
      ],
      skipDuplicates: true,
    })

    console.log(`Created ${categories.count} categories.`)

    // Create products
    const products = await prisma.product.createMany({
      data: [
        {
          id: '1',
          name: 'Pão Francês',
          description: 'Pão francês fresquinho do dia',
          price: 0.5,
          image: '/french-bread.png',
          categoryId: '1',
          unit: 'un',
          stock: 100,
          featured: true,
        },
        {
          id: '2',
          name: 'Morango',
          description: 'Morango fresco e selecionado',
          price: 8.99,
          originalPrice: 12.99,
          image: '/fresh-strawberries.png',
          categoryId: '2',
          unit: 'kg',
          stock: 50,
          featured: true,
        },
        {
          id: '3',
          name: 'Picanha',
          description: 'Picanha premium de primeira qualidade',
          price: 69.99,
          image: '/picanha-meat.jpg',
          categoryId: '3',
          unit: 'kg',
          stock: 20,
          featured: true,
        },
        {
          id: '4',
          name: 'Coca-Cola 2L',
          description: 'Refrigerante Coca-Cola 2 litros',
          price: 9.99,
          originalPrice: 11.99,
          image: '/classic-coca-cola.png',
          categoryId: '4',
          unit: 'un',
          stock: 80,
          featured: false,
        },
        {
          id: '5',
          name: 'Arroz Branco 5kg',
          description: 'Arroz tipo 1 de qualidade',
          price: 24.99,
          image: '/rice-bag.png',
          categoryId: '5',
          unit: 'un',
          stock: 60,
          featured: false,
        },
        {
          id: '6',
          name: 'Ração Golden',
          description: 'Ração premium para cães adultos',
          price: 159.99,
          image: '/dog-food-bag.jpg',
          categoryId: '6',
          unit: 'un',
          stock: 15,
          featured: false,
        },
      ],
      skipDuplicates: true,
    })

    console.log(`Created ${products.count} products.`)

    // Create market
    const market = await prisma.market.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        name: 'Mercado São Jorge',
        address: 'Av. dos Automóveis, 1696',
        phone: '(11) 3456-7890',
        openingHours: 'Seg - Dom: 7h às 22h',
        deliveryFee: 5.99,
        minOrderValue: 20,
        estimatedDeliveryTime: '30-45 min',
        rating: 4.8,
        logo: '/generic-supermarket-logo.png',
        banner: '/images/pagamentos.png',
      },
    })

    console.log(`Created/updated market: ${market.name}`)

    // Create admin user
    const adminEmail = 'admin@email.com'
    const adminPassword = 'admin'
    const adminPasswordHash = hashPassword(adminPassword)
    
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        cpf: '00000000000', // Placeholder CPF for admin
        passwordHash: adminPasswordHash,
        name: 'Administrador',
        phone: '(11) 99999-9999',
        role: 'ADMIN',
      },
    })

    console.log(`Created/updated admin user: ${adminUser.email}`)

    console.log('Seeding completed!')
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
