import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    // Admin auth
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split("=");
          if (name && value) acc[name] = value;
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
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Optional month/year filter
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const page = Math.max(1, parseInt(pageParam || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(limitParam || "10")));

    let dateFilter: any = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(
        parseInt(year),
        parseInt(month),
        0,
        23,
        59,
        59,
        999
      );
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // Aggregate totals excluding cancelled
    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true, deliveryFee: true },
      where: {
        status: { not: "CANCELLED" },
        ...dateFilter,
      },
    });
    const totalRevenue = revenueAgg._sum.totalAmount || 0;
    const totalDeliveryFees = revenueAgg._sum.deliveryFee || 0;

    // Total products sold (sum of item quantities for non-cancelled orders)
    const productsAgg = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          status: { not: "CANCELLED" },
          ...dateFilter,
        },
      },
    });
    const totalProductsSold = productsAgg._sum.quantity || 0;

    // Payment breakdown: sum revenue by payment method
    const paymentGroups = await prisma.order.groupBy({
      by: ["paymentMethod"],
      _sum: { totalAmount: true },
      where: {
        status: { not: "CANCELLED" },
        ...dateFilter,
      },
    });
    const paymentBreakdown: Record<string, number> = {};
    for (const pg of paymentGroups) {
      paymentBreakdown[pg.paymentMethod.toLowerCase()] =
        pg._sum.totalAmount || 0;
    }

    // Recent orders
    const totalRecentOrders = await prisma.order.count({
      where: {
        status: { not: "CANCELLED" },
        ...dateFilter,
      },
    });

    const recentOrders = await prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        ...dateFilter,
      },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      totalRevenue,
      totalDeliveryFees,
      totalProductsSold,
      paymentBreakdown,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod.toLowerCase(),
      })),
      recentPagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecentOrders / limit),
        totalCount: totalRecentOrders,
      },
    });
  } catch (error: any) {
    console.error("Error fetching financial data:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
