import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";

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
    
    console.log("Starting order status cleanup...");
    
    // First, let's see what statuses we have in the database using raw SQL
    const statusResults: any[] = await prisma.$queryRaw`SELECT status, COUNT(*) as count FROM "Order" GROUP BY status`;
    const statusCounts: Record<string, number> = {};
    
    statusResults.forEach(row => {
      statusCounts[row.status] = parseInt(row.count);
    });
    
    console.log("Current status distribution:", statusCounts);
    
    // Update orders with old statuses to the new ones using raw SQL
    console.log("Updating PREPARING orders to CONFIRMED...");
    const preparingUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CONFIRMED' WHERE status = 'PREPARING'`;
    console.log(`Updated ${preparingUpdated} PREPARING orders`);
    
    console.log("Updating DELIVERING orders to CONFIRMED...");
    const deliveringUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CONFIRMED' WHERE status = 'DELIVERING'`;
    console.log(`Updated ${deliveringUpdated} DELIVERING orders`);
    
    console.log("Updating DELIVERED orders to CONFIRMED...");
    const deliveredUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CONFIRMED' WHERE status = 'DELIVERED'`;
    console.log(`Updated ${deliveredUpdated} DELIVERED orders`);
    
    console.log("Updating CANCELED orders to CANCELLED...");
    try {
      const canceledUpdated = await prisma.$executeRaw`UPDATE "Order" SET status = 'CANCELLED' WHERE status = 'CANCELED'`;
      console.log(`Updated ${canceledUpdated} CANCELED orders`);
    } catch (error: any) {
      console.log("No CANCELED orders found or error updating them:", error.message);
    }
    
    console.log("Cleanup completed successfully!");
    
    // Check final status distribution
    const finalStatusResults: any[] = await prisma.$queryRaw`SELECT status, COUNT(*) as count FROM "Order" GROUP BY status`;
    const finalStatusCounts: Record<string, number> = {};
    
    finalStatusResults.forEach(row => {
      finalStatusCounts[row.status] = parseInt(row.count);
    });
    
    console.log("Final status distribution:", finalStatusCounts);
    
    return NextResponse.json({ 
      message: "Cleanup completed successfully!",
      initialStats: statusCounts,
      finalStats: finalStatusCounts
    });
  } catch (error: any) {
    console.error("Error during cleanup:", error);
    return NextResponse.json({ error: "internal_server_error", details: error.message }, { status: 500 });
  }
}