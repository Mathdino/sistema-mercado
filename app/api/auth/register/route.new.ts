import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { signJwt } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      fullName,
      cpf,
      phone,
      password,
      confirmPassword,
      address,
    } = body || {}

    // Validate required fields
    if (!fullName || !cpf || !phone || !password || !confirmPassword) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 })
    }
    
    // Check password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "password_mismatch" }, { status: 400 })
    }
    
    // Validate CPF format
    const cpfDigits = String(cpf).replace(/\D/g, "")
    if (cpfDigits.length !== 11) {
      return NextResponse.json({ error: "invalid_cpf" }, { status: 400 })
    }
    
    // Check if user already exists
    const exists = await prisma.user.findUnique({ where: { cpf: cpfDigits } })
    if (exists) {
      return NextResponse.json({ error: "cpf_exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = hashPassword(password)
    
    // Create user with address if provided
    const user = await prisma.user.create({
      data: {
        cpf: cpfDigits,
        passwordHash,
        name: fullName,
        phone,
        role: "CLIENT",
        addresses: address
          ? {
              create: {
                street: address.street,
                number: address.number,
                complement: address.complement || null,
                neighborhood: address.neighborhood || "",
                city: address.city,
                state: address.state || "",
                zipCode: address.cep || address.zipCode, // Handle both cep and zipCode
                isDefault: true,
              },
            }
          : undefined,
      },
      include: { addresses: true },
    })
    
    // Generate JWT token
    const token = await signJwt({ sub: user.id, cpf: user.cpf, name: user.name })
    
    // Prepare response data
    const res = NextResponse.json({
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        phone: user.phone,
        role: user.role.toLowerCase(),
        addresses: user.addresses.map((a) => ({
          id: a.id,
          street: a.street,
          number: a.number,
          complement: a.complement || undefined,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          isDefault: a.isDefault,
        })),
        createdAt: user.createdAt.toISOString(),
      },
      token,
    })
    
    // Set cookie
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    return res
  } catch (err: any) {
    // Handle specific database errors
    if (err?.code === "P2002") {
      // Unique constraint violation
      if (err?.meta?.target?.includes("cpf")) {
        return NextResponse.json({ error: "cpf_exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "unique_constraint_violation" }, { status: 409 })
    }
    
    // Handle other Prisma errors
    if (err?.code) {
      console.error("Database error:", err.code, err.message)
      return NextResponse.json({ error: "database_error", code: err.code }, { status: 500 })
    }
    
    // Log unexpected errors
    console.error("register_error", err)
    return NextResponse.json(
      { error: "server_error", details: err?.message || String(err) },
      { status: 500 },
    )
  }
}