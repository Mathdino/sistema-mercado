import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"

export async function GET(req: NextRequest) {
  try {
    // Auth: allow only admins
    let token: string | null = null
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      const cookieHeader = req.headers.get("cookie")
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split("=")
          if (name && value) acc[name] = value
          return acc
        }, {} as Record<string, string>)
        token = cookies.token || null
      }
    }
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    let decoded
    try {
      decoded = await verifyJwt(token)
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 })
    }
    const authUser = await prisma.user.findUnique({ where: { id: decoded.sub } })
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    // Fetch clients
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      include: {
        addresses: {
          orderBy: { isDefault: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Order counts for all clients in one query
    const orderCounts = await prisma.order.groupBy({
      by: ["userId"],
      _count: { _all: true }
    })
    const orderCountMap = new Map(orderCounts.map((o) => [o.userId, o._count._all]))

    const result = clients.map((u) => ({
      id: u.id,
      cpf: u.cpf,
      name: u.name,
      email: u.email || null,
      phone: u.phone,
      role: "client",
      createdAt: u.createdAt.toISOString(),
      addresses: u.addresses.map((a) => ({
        id: a.id,
        street: a.street,
        number: a.number,
        complement: a.complement || undefined,
        neighborhood: a.neighborhood,
        city: a.city,
        state: a.state,
        zipCode: a.zipCode,
        isDefault: a.isDefault
      })),
      orderCount: orderCountMap.get(u.id) || 0
    }))

    return NextResponse.json({ users: result })
  } catch (error: any) {
    console.error("Error fetching admin users:", error)
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 })
  }
}

