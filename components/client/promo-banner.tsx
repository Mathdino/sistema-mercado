"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"

interface Market {
  id: string
  name: string
  address: string
  phone: string
  openingHours: string
  deliveryFee: number
  minOrderValue: number
  estimatedDeliveryTime: string
  rating: number
  logo: string
  banner: string
}

interface PromoBannerProps {
  market?: Market | null
}

export function PromoBanner({ market }: PromoBannerProps) {
  // Fallback to mock data if no market data is provided
  const bannerImage = market?.banner || "/placeholder-banner.jpg"
  
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="relative aspect-[2/1]">
        <Image src={bannerImage} alt="Promoção" fill className="object-cover" priority />
      </div>
    </Card>
  )
}