import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { street, number, complement, neighborhood, city, state, zipCode } =
      body || {};

    const fee = await prisma.deliveryFee.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!fee) {
      return NextResponse.json({ fee: 0 });
    }

    // Since we only support fixed fees now, return the fixed value
    return NextResponse.json({ fee: Number(fee.fixedValue || 0) });
  } catch (error: any) {
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
