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

    // Fetch all products and categories
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ products, categories });
  } catch (error: any) {
    console.error("Error fetching products:", error);
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
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      categoryId,
      unit,
      stock,
      featured,
    } = body;

    // Validate required fields
    console.log("Validating product data:", {
      name,
      description,
      price,
      image: image ? "present" : "missing",
      categoryId,
      unit,
      stock,
    });

    // We allow description to be empty string, but other fields must be present
    if (
      !name ||
      price === undefined ||
      !image ||
      !categoryId ||
      !unit ||
      stock === undefined
    ) {
      console.log("Validation failed:", {
        name,
        description,
        price,
        image: image ? "present" : "missing",
        categoryId,
        unit,
        stock,
      });
      return NextResponse.json(
        {
          error: "missing_required_fields",
          details: {
            name,
            description,
            price,
            image: image ? "present" : "missing",
            categoryId,
            unit,
            stock,
          },
        },
        { status: 400 }
      );
    }

    // Validate price
    const parsedPrice = parseFloat(price);
    console.log("Parsed price:", parsedPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { error: "invalid_price", price },
        { status: 400 }
      );
    }

    // Validate stock
    const parsedStock = parseInt(stock);
    console.log("Parsed stock:", parsedStock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json(
        { error: "invalid_stock", stock },
        { status: 400 }
      );
    }

    // Validate category exists
    console.log("Checking category:", categoryId);
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      // List all available categories for debugging
      const allCategories = await prisma.category.findMany({
        select: { id: true, name: true },
      });
      console.log("Available categories:", allCategories);
      return NextResponse.json(
        {
          error: "category_not_found",
          categoryId,
          availableCategories: allCategories,
        },
        { status: 400 }
      );
    }
    console.log("Category found:", category);

    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        price: parsedPrice,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        image,
        categoryId,
        unit,
        stock: parsedStock,
        featured: !!featured,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    // Log more detailed error information
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }

    // Try to get more context about what was being processed
    // Note: 'body' is not available in catch block, but we can log the error itself

    return NextResponse.json(
      {
        error: "internal_server_error",
        details: error.message || "Unknown error",
        code: error.code,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
