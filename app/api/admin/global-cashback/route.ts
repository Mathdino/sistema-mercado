import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";
import { Role } from "@prisma/client";

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

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Get the global cashback settings
    const globalCashback = await prisma.globalCashback.findFirst({
      orderBy: { createdAt: 'desc' } // Get the most recent one
    });

    if (!globalCashback) {
      // Return default values if no global cashback exists
      return NextResponse.json({
        id: null,
        isActive: false,
        percentage: 0,
        createdAt: null,
        updatedAt: null
      });
    }

    return NextResponse.json(globalCashback);
  } catch (error) {
    console.error("Error fetching global cashback:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { isActive, percentage } = await req.json();

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "isActive is required and must be a boolean" }, { status: 400 });
    }

    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: "percentage must be a number between 0 and 100" }, { status: 400 });
    }

    // Get existing global cashback or create a new one
    let globalCashback = await prisma.globalCashback.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (globalCashback) {
      // Update the existing global cashback
      globalCashback = await prisma.globalCashback.update({
        where: { id: globalCashback.id },
        data: {
          isActive,
          percentage,
        },
      });
    } else {
      // Create a new global cashback record
      globalCashback = await prisma.globalCashback.create({
        data: {
          isActive,
          percentage,
        },
      });
    }

    return NextResponse.json(globalCashback);
  } catch (error) {
    console.error("Error updating global cashback:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}