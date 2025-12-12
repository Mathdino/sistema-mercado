import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJwt } from "@/lib/jwt"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // First try to get token from Authorization header
    let token: string | null = null
    const authHeader = req.headers.get("authorization")
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // If not in header, try to get from cookies
      const cookieHeader = req.headers.get("cookie")
      console.log("Cookie header:", cookieHeader)
      if (cookieHeader) {
        // Split cookies by semicolon and trim whitespace
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split("=")
          if (name && value) {
            acc[name] = value
          }
          return acc
        }, {} as Record<string, string>)
        
        console.log("Parsed cookies:", cookies)
        token = cookies.token || null
        console.log("Token from cookies:", token)
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    
    // Verify the JWT token
    let decoded
    try {
      decoded = await verifyJwt(token)
      console.log("Decoded token:", decoded)
    } catch (error) {
      console.log("Token verification error:", error)
      return NextResponse.json({ error: "invalid_token" }, { status: 401 })
    }

    // Use the user ID from the token instead of the URL parameter
    const userIdFromToken = decoded.sub
    console.log("User ID from token:", userIdFromToken)
    console.log("URL param id:", params.id)
    
    // Check if the user is authorized to update this profile
    // We'll allow the user to update their own profile
    // In a real app, you might want more sophisticated permission checking
    
    const body = await req.json()
    const { name, phone, address } = body

    // Update user information
    const updatedUser = await prisma.user.update({
      where: { id: userIdFromToken },
      data: {
        name,
        phone,
      },
      include: { addresses: true },
    })

    // If address data is provided, update the default address
    if (address) {
      const defaultAddress = updatedUser.addresses.find(addr => addr.isDefault)
      
      if (defaultAddress) {
        // Update existing default address
        await prisma.address.update({
          where: { id: defaultAddress.id },
          data: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          },
        })
      } else if (updatedUser.addresses.length > 0) {
        // Update first address if no default exists
        await prisma.address.update({
          where: { id: updatedUser.addresses[0].id },
          data: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          },
        })
      }
      // Note: If no addresses exist, we would need to create one, but that's not handled here
    }

    // Fetch updated user with addresses
    const userWithAddresses = await prisma.user.findUnique({
      where: { id: userIdFromToken },
      include: { addresses: true },
    })

    return NextResponse.json({
      user: {
        id: userWithAddresses!.id,
        cpf: userWithAddresses!.cpf,
        name: userWithAddresses!.name,
        phone: userWithAddresses!.phone,
        role: userWithAddresses!.role.toLowerCase(),
        addresses: userWithAddresses!.addresses.map((a) => ({
          id: a.id,
          street: a.street,
          number: a.number,
          complement: a.complement || undefined,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          isDefault: a.isDefault,
        })),
        createdAt: userWithAddresses!.createdAt.toISOString(),
      },
    })
  } catch (err: any) {
    console.error("update_user_error", err)
    return NextResponse.json(
      { error: "server_error", details: err?.message || String(err) },
      { status: 500 },
    )
  }
}