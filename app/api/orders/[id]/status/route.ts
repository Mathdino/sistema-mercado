import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { verifyJwt } from "@/lib/jwt";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Updated type to reflect that params is a Promise
) {
  try {
    // Await params to get the actual values
    const { id } = await params;
    
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split("=");
          if (name && value) {
            acc[name] = value;
          }
          return acc;
        }, {} as Record<string, string>);
        token = cookies.token || null;
      }
    }
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    let decoded;
    try {
      decoded = await verifyJwt(token);
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    const normalized = typeof status === "string" ? status.toUpperCase() : "";
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "CANCELLED",
    ];
    if (!normalized || !validStatuses.includes(normalized)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id }, // Use the destructured id
      data: { status: normalized as OrderStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            cpf: true,
          },
        },
        items: true,
        deliveryAddress: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }
    const code =
      typeof error.code === "string" ? error.code : "internal_server_error";
    return NextResponse.json({ error: code }, { status: 500 });
  }
}