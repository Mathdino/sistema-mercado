import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = await verifyJwt(token);
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

    const globalCashback = globalCashbackResult.length > 0 ? globalCashbackResult[0] : null;

    if (!globalCashback) {
      // Return null if global cashback is not active
      return NextResponse.json(null);
    }

    // Get the user's last completed order to calculate cashback
    const lastOrder = await prisma.order.findFirst({
      where: {
        userId: decoded.sub,
        status: OrderStatus.CONFIRMED // Only confirmed orders
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastOrder) {
      // Return the global cashback percentage even if no previous order exists
      return NextResponse.json({
        percentage: globalCashback.percentage,
        isActive: globalCashback.isActive
      });
    }

    // Calculate the cashback amount based on the last order
    const cashbackAmount = (lastOrder.totalAmount * globalCashback.percentage) / 100;

    return NextResponse.json({
      percentage: globalCashback.percentage,
      amount: cashbackAmount,
      isActive: globalCashback.isActive,
      lastOrderTotal: lastOrder.totalAmount,
      lastOrderDate: lastOrder.createdAt
    });
  } catch (error) {
    console.error("Error fetching cashback:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}