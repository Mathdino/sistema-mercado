import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
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
    console.log('Admin user created successfully!')
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()