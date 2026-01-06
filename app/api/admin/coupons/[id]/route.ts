import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Instead of deleting the coupon (due to foreign key constraints),
    // we'll just set it as inactive
    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Cupom desativado com sucesso" });
  } catch (error) {
    console.error("Error deactivating coupon:", error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      // If it's a Prisma error, log more details
      if ('meta' in error) {
        console.error("Prisma error details:", (error as any).meta);
      }
    }
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { id } = params;
    const { isActive } = await request.json();

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}