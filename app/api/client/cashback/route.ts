import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header or cookies
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
      decoded = await verifyJwt(token as string);
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    // Check if global cashback is active using raw query to avoid type issues
    const globalCashbackResult = await prisma.$queryRaw<Array<any>>`
      SELECT id, "isActive", percentage, "createdAt", "updatedAt"
      FROM "GlobalCashback"
      WHERE "isActive" = true
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    const globalCashback =
      globalCashbackResult.length > 0 ? globalCashbackResult[0] : null;

    if (!globalCashback) {
      return NextResponse.json({
        isActive: false,
        eligible: false,
        percentage: 0,
        amount: 0,
      });
    }

    // Check if the user has any confirmed order
    const lastOrder = await prisma.order.findFirst({
      where: {
        userId: decoded.sub,
        status: OrderStatus.CONFIRMED,
      },
      orderBy: { createdAt: "desc" },
    });

    const eligible = !!lastOrder;
    const percentage = Number(globalCashback.percentage || 0);
    const amount = eligible
      ? ((Number(lastOrder!.totalAmount) || 0) * percentage) / 100
      : 0;

    return NextResponse.json({
      isActive: !!globalCashback.isActive,
      eligible,
      percentage,
      amount,
      lastOrderTotal: eligible ? Number(lastOrder!.totalAmount) : 0,
      lastOrderDate: eligible ? lastOrder!.createdAt : null,
    });
  } catch (error) {
    console.error("Error fetching cashback:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
