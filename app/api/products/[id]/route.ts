import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("API route received ID:", `"${id}"`);
    console.log("ID type:", typeof id);
    console.log("ID truthy:", !!id);
    console.log("ID length:", id ? id.length : 0);

    // More comprehensive validation
    if (!id) {
      console.log("ID is null or undefined, returning 400");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (typeof id !== "string") {
      console.log("ID is not a string, returning 400");
      return NextResponse.json(
        { error: "Product ID must be a string" },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();
    if (trimmedId === "" || trimmedId === "undefined" || trimmedId === "null") {
      console.log("ID is empty or invalid string, returning 400");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: trimmedId },
      include: {
        category: true,
      },
    });

    if (!product) {
      console.log("Product not found in database");
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check for promotion expiration
    if (product.originalPrice && product.promotionEndsAt) {
      const now = new Date();
      const promotionEnd = new Date(product.promotionEndsAt);

      if (now > promotionEnd) {
        console.log("Promotion expired for product:", product.name);
        // Promotion expired, revert price in database
        const updatedProduct = await prisma.product.update({
          where: { id: product.id },
          data: {
            price: product.originalPrice,
            originalPrice: null,
            promotionEndsAt: null,
            updatedAt: new Date(),
          },
          include: { category: true },
        });
        return NextResponse.json(updatedProduct);
      }
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
