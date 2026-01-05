import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // If not in header, try to get from cookies
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        // Split cookies by semicolon and trim whitespace
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

    // Verify the JWT token
    let decoded;
    try {
      decoded = await verifyJwt(token);
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Fetch all delivery fees
    const fees = await prisma.deliveryFee.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ fees });
  } catch (error: any) {
    console.error("Error fetching delivery fees:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // If not in header, try to get from cookies
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        // Split cookies by semicolon and trim whitespace
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

    // Verify the JWT token
    let decoded;
    try {
      decoded = await verifyJwt(token);
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, fixedValue, perKmValue, minValue, minRange, isActive } = body;

    // Validate required fields based on type
    if (type !== 'FIXED' && type !== 'PER_KM') {
      return NextResponse.json(
        { error: "invalid_type" },
        { status: 400 }
      );
    }

    if (type === 'FIXED' && (fixedValue === null || fixedValue === undefined || fixedValue < 0)) {
      return NextResponse.json(
        { error: "fixed_value_required" },
        { status: 400 }
      );
    }

    if (type === 'PER_KM' && (perKmValue === null || perKmValue === undefined || perKmValue < 0)) {
      return NextResponse.json(
        { error: "per_km_value_required" },
        { status: 400 }
      );
    }

    if (minValue !== null && minValue !== undefined && minRange === null) {
      return NextResponse.json(
        { error: "min_range_required" },
        { status: 400 }
      );
    }

    if (minRange !== null && minRange !== undefined && minValue === null) {
      return NextResponse.json(
        { error: "min_value_required" },
        { status: 400 }
      );
    }

    // Create new delivery fee
    const fee = await prisma.deliveryFee.create({
      data: {
        type: type as 'FIXED' | 'PER_KM',
        fixedValue: fixedValue !== null && fixedValue !== undefined && type === 'FIXED' ? Number(fixedValue) : null,
        perKmValue: perKmValue !== null && perKmValue !== undefined && type === 'PER_KM' ? Number(perKmValue) : null,
        minValue: minValue !== null && minValue !== undefined ? Number(minValue) : null,
        minRange: minRange !== null && minRange !== undefined ? Number(minRange) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }
    });

    if (fee.isActive) {
      await prisma.deliveryFee.updateMany({
        where: { id: { not: fee.id }, isActive: true },
        data: { isActive: false }
      });
    }

    return NextResponse.json({ fee });
  } catch (error: any) {
    console.error("Error creating delivery fee:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
