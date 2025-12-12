import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "crypto"

// Copy the hashPassword function directly
const SALT_LEN = 16
const ITERATIONS = 120000
const KEY_LEN = 32
const DIGEST = "sha256"

function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_LEN)
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  return `pbkdf2:${ITERATIONS}:${DIGEST}:${salt.toString("hex")}:${derived.toString("hex")}`
}

// Set the database URL directly
const connectionString = "postgresql://neondb_owner:npg_xL7djsMhu9Yl@ep-tiny-mouse-act8qz8u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

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