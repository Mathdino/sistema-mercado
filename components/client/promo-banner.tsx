"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { mockMarket } from "@/lib/mock-data"

export function PromoBanner() {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="relative aspect-[2/1]">
        <Image src={mockMarket.banner || "/placeholder.svg"} alt="Promoção" fill className="object-cover" priority />
      </div>
    </Card>
  )
}
