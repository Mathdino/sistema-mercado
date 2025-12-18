import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const promotionCards = await prisma.promotionCard.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(promotionCards);
  } catch (error: any) {
    console.error("Error fetching promotion banners:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
