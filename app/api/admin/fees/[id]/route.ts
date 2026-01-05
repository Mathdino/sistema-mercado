import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";

// PUT route to update a delivery fee
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const { isActive } = body;

    // Update the delivery fee
    const updatedFee = await prisma.deliveryFee.update({
      where: { id },
      data: {
        isActive: Boolean(isActive),
      },
    });

    if (updatedFee.isActive) {
      await prisma.deliveryFee.updateMany({
        where: { id: { not: updatedFee.id }, isActive: true },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ fee: updatedFee });
  } catch (error: any) {
    console.error("Error updating delivery fee:", error);

    if (error.code === "P2025") {
      // Record not found
      return NextResponse.json(
        { error: "delivery_fee_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

// DELETE route to delete a delivery fee
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Delete the delivery fee
    await prisma.deliveryFee.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Taxa de entrega excluída com sucesso!",
    });
  } catch (error: any) {
    console.error("Error deleting delivery fee:", error);

    if (error.code === "P2025") {
      // Record not found
      return NextResponse.json(
        { error: "delivery_fee_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
