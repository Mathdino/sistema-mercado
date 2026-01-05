import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function geocode(address: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", address);
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "market-delivery-app/1.0",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const item = data[0];
  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}

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

    if (fee.type === "FIXED") {
      return NextResponse.json({ fee: Number(fee.fixedValue || 0) });
    }

    const market = await prisma.market.findFirst();
    if (!market) {
      const perKm = Number(fee.perKmValue || 0);
      const minRange = Number(fee.minRange || 0);
      const minVal = Number(fee.minValue || 0);
      const base = perKm * minRange;
      return NextResponse.json({ fee: Math.max(minVal, base) });
    }

    const addressComponents = market.address.split(", ");
    const cityAndState = addressComponents[3] || "";
    const [marketCity, stateWithZip] = cityAndState.split(" - ");
    const marketState = stateWithZip?.split(",")[0] || "";
    const marketCep = stateWithZip?.split(",")[1] || "";
    const marketQuery = marketCep
      ? [marketCep.trim(), marketCity?.trim(), marketState?.trim()]
          .filter(Boolean)
          .join(", ")
      : market.address;
    const marketCoords = await geocode(marketQuery);
    const clientQuery = [
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    ]
      .filter(Boolean)
      .join(", ");
    const clientCoords = await geocode(clientQuery);

    if (!marketCoords || !clientCoords) {
      const minVal = Number(fee.minValue || 0);
      return NextResponse.json({ fee: minVal });
    }

    const distanceKm = haversine(
      marketCoords.lat,
      marketCoords.lon,
      clientCoords.lat,
      clientCoords.lon
    );

    const perKm = Number(fee.perKmValue || 0);
    const minVal = Number(fee.minValue || 0);
    const calc = perKm * distanceKm;
    const finalFee = Math.max(minVal || 0, calc);

    return NextResponse.json({ fee: Number(finalFee.toFixed(2)), distanceKm });
  } catch (error: any) {
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
