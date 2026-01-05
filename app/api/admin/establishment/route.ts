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

    console.log('User found:', user ? { id: user.id, role: user.role } : 'No user found');
    
    if (!user) {
      console.log('No user found with decoded token ID:', decoded.sub);
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    
    if (user.role !== "ADMIN") {
      console.log('User role is not ADMIN:', user.role);
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Fetch establishment data (we'll use the first market record as the establishment)
    const market = await prisma.market.findFirst();

    if (!market) {
      // Return default structure if no market exists
      return NextResponse.json({
        establishment: null,
        employees: []
      });
    }

    // Fetch employees associated with the market
    const employees = await prisma.employee.findMany({
      where: {
        marketId: market.id
      }
    });

    // Parse address components from the stored address string
    const addressComponents = market.address.split(', ');
    const street = addressComponents[0] || '';
    const number = addressComponents[1] || '';
    const neighborhood = addressComponents[2] || '';
    const cityAndState = addressComponents[3] || '';
    const [city, stateWithZip] = cityAndState.split(' - ');
    const state = stateWithZip?.split(',')[0] || '';
    const cep = stateWithZip?.split(',')[1] || '';
    
    return NextResponse.json({
      establishment: {
        id: market.id,
        name: market.name,
        cep: cep.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: "", // Not stored in this implementation
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        phone: market.phone
      },
      employees
    });
  } catch (error: any) {
    console.error("Error fetching establishment data:", error);
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

    console.log('User found:', user ? { id: user.id, role: user.role } : 'No user found');
    
    if (!user) {
      console.log('No user found with decoded token ID:', decoded.sub);
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    
    if (user.role !== "ADMIN") {
      console.log('User role is not ADMIN:', user.role);
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, cep, street, number, complement, neighborhood, city, state, phone, employees } = body;
    const cepDigits = String(cep || "").replace(/\D/g, "");
    if (!cepDigits || cepDigits.length !== 8) {
      return NextResponse.json({ error: "invalid_cep" }, { status: 400 });
    }

    // Check if a market record already exists
    let market = await prisma.market.findFirst();

    if (market) {
      // Update existing market
      market = await prisma.market.update({
        where: { id: market.id },
        data: {
          name,
          address: `${street}, ${number}, ${neighborhood}, ${city} - ${state}, ${cepDigits}`,
          phone,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new market
      market = await prisma.market.create({
        data: {
          name,
          address: `${street}, ${number}, ${neighborhood}, ${city} - ${state}, ${cepDigits}`, // Format: "street, number, neighborhood, city - state, cep"
          phone,
          logo: "/market-logo.svg", // Default logo
          banner: "/market-banner.svg", // Default banner
          openingHours: "08:00 - 22:00", // Default hours
          deliveryFee: 0, // Default delivery fee
          minOrderValue: 0, // Default minimum order
          estimatedDeliveryTime: "30-45 min", // Default estimated time
          rating: 5.0 // Default rating
        }
      });
    }

    // Handle employees
    if (Array.isArray(employees)) {
      // First, delete all existing employees for this market
      await prisma.employee.deleteMany({
        where: { marketId: market.id }
      });

      // Then create new employees
      for (const emp of employees) {
        await prisma.employee.create({
          data: {
            name: emp.name,
            role: emp.role,
            phone: emp.phone,
            marketId: market.id
          }
        });
      }
    }

    return NextResponse.json({
      message: "Estabelecimento atualizado com sucesso!",
      establishment: {
        id: market.id,
        name: market.name,
        cep: cepDigits,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        phone
      },
      employees
    });
  } catch (error: any) {
    console.error("Error saving establishment data:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
