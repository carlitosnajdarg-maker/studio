"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Beer, Coffee, Info, Utensils } from "lucide-react"

export interface MenuItemProps {
  id: string
  title: string
  category: string
  description: string
  price: number
  imageUrl: string
  metadata?: string
  isAlcoholic?: boolean
}

export function MenuCard({ title, category, description, price, imageUrl, metadata, isAlcoholic }: MenuItemProps) {
  return (
    <Card className="overflow-hidden border-none bg-[#1a020c] flex flex-col group transition-all duration-300 hover:scale-[1.02] active:scale-95">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] m-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110 saturate-[1.2] brightness-90"
        />
        {isAlcoholic !== undefined && (
          <div className="absolute top-2 right-2">
            <Badge variant={isAlcoholic ? "destructive" : "secondary"} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border-none">
              {isAlcoholic ? "Con Alcohol" : "Sin Alcohol"}
            </Badge>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-white font-bold text-lg leading-tight group-hover:text-[#FF008A] transition-colors">{title}</h3>
        {metadata && (
          <div className="flex items-center gap-1.5 text-[#00F0FF] text-[10px] font-bold uppercase tracking-wider">
            <Info className="w-3 h-3" />
            <span>{metadata}</span>
          </div>
        )}
        <p className="text-[#B0B0B0] text-sm line-clamp-2 leading-relaxed">
          {description}
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-white font-bold text-xl">${price.toLocaleString('es-AR')}</span>
          <button className="p-2 rounded-full bg-white/5 text-[#00F0FF] hover:bg-[#FF008A] hover:text-white transition-all duration-300">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}
