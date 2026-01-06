import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token: string | null = null;
    const authHeader = request.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // If not in header, try to get from cookies
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        // Split cookies by semicolon and trim whitespace
        const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, cookie) => {
          const [name, value] = cookie.trim().split("=");
          if (name && value) {
            acc[name] = value;
          }
          return acc;
        }, {});

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

    // Check if user is authenticated
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Código de cupom é obrigatório" }, { status: 400 });
    }

    // Find the coupon by code
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "Cupom está inativo" }, { status: 400 });
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
    }

    // Check if coupon has reached max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom atingiu o limite de usos" }, { status: 400 });
    }

    // Check if user has already used this coupon
    const userCoupon = await prisma.userCoupon.findFirst({
      where: {
        userId: user.id,
        couponId: coupon.id,
      },
    });

    if (userCoupon) {
      return NextResponse.json({ error: "Você já utilizou este cupom" }, { status: 400 });
    }

    // Return the valid coupon
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}