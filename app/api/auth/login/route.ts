import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"
import { signJwt } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, password } = body || {}
    if (!identifier || !password) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 })
    }

    let user = null;
    
    // Check if identifier is an email (for admin login)
    if (identifier.includes("@")) {
      // Admin login with email
      user = await prisma.user.findUnique({
        where: { email: identifier },
        include: { addresses: true },
      })
    } else {
      // Client login with CPF
      const cpfDigits = String(identifier).replace(/\D/g, "")
      if (cpfDigits.length !== 11) {
        return NextResponse.json({ error: "invalid_identifier" }, { status: 400 })
      }
      user = await prisma.user.findUnique({
        where: { cpf: cpfDigits },
        include: { addresses: true },
      })
    }

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 })
    }

    const ok = verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
    }

    const token = await signJwt({ sub: user.id, cpf: user.cpf, email: user.email, name: user.name })
    const res = NextResponse.json({
      user: {
        id: user.id,
        cpf: user.cpf,
        email: user.email,
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
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}