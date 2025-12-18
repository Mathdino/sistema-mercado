import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";

// Helper to authenticate admin
async function getAuthenticatedAdmin(req: NextRequest) {
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
    return null;
  }

  try {
    const decoded = await verifyJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.role !== "ADMIN") {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedAdmin(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const promotionCards = await prisma.promotionCard.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(promotionCards);
  } catch (error: any) {
    console.error("Error fetching promotion cards:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedAdmin(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      discountPrice,
      backgroundImage,
      productImage,
      config,
      productId,
      isActive,
    } = body;

    const promotionCard = await prisma.promotionCard.create({
      data: {
        title,
        description,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        backgroundImage,
        productImage,
        config: config || {},
        productId: productId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(promotionCard);
  } catch (error: any) {
    console.error("Error creating promotion card:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
