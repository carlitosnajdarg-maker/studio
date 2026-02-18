"use client"

import { useState } from "react"
import { CategoryNav } from "@/components/menu/CategoryNav"
import { MenuCard, MenuItemProps } from "@/components/menu/MenuCard"
import { QuickActions } from "@/components/menu/QuickActions"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const MENU_DATA: MenuItemProps[] = [
  // Drinks
  {
    id: "d1",
    title: "Mojito Ultravioleta",
    category: "Tragos",
    description: "Ron blanco, menta fresca, lima, azúcar de caña y un toque de flor de butterfly pea.",
    price: 9500,
    imageUrl: PlaceHolderImages.find(img => img.id === 'cocktail-2')?.imageUrl || "",
    metadata: "Sugerencia del chef",
    isAlcoholic: true
  },
  {
    id: "d2",
    title: "Electric Gin & Tonic",
    category: "Tragos",
    description: "Gin premium, tónica premium, bayas de enebro y una rodaja de pepino neón.",
    price: 12000,
    imageUrl: PlaceHolderImages.find(img => img.id === 'cocktail-1')?.imageUrl || "",
    metadata: "Más Vendido",
    isAlcoholic: true
  },
  {
    id: "d3",
    title: "Cerveza Artesanal IPA",
    category: "Bebidas c/ Alcohol",
    description: "Intensa, cítrica y con un amargor balanceado. 6.5% ABV.",
    price: 6500,
    imageUrl: PlaceHolderImages.find(img => img.id === 'beer-1')?.imageUrl || "",
    metadata: "Cerveza Local",
    isAlcoholic: true
  },
  {
    id: "d4",
    title: "Limonada de Menta y Jengibre",
    category: "Bebidas s/ Alcohol",
    description: "Refrescante combinación natural servida con hielo frappé.",
    price: 4500,
    imageUrl: PlaceHolderImages.find(img => img.id === 'cocktail-1')?.imageUrl || "",
    isAlcoholic: false
  },
  // Food
  {
    id: "f1",
    title: "Cyber Burger 2077",
    category: "Comidas",
    description: "Carne madurada, queso cheddar fundido, cebolla caramelizada y salsa secreta magenta.",
    price: 14900,
    imageUrl: PlaceHolderImages.find(img => img.id === 'food-1')?.imageUrl || "",
    metadata: "Extremadamente Picante",
  },
  {
    id: "f2",
    title: "Nachos Ultravioleta",
    category: "Comidas",
    description: "Tortillas de maíz azul, guacamole artesanal, pico de gallo y sour cream.",
    price: 11500,
    imageUrl: PlaceHolderImages.find(img => img.id === 'food-2')?.imageUrl || "",
  },
  // Tokens
  {
    id: "t1",
    title: "Ficha de Juego Premium",
    category: "Fichas",
    description: "Acceso a 1 hora de mesa de pool profesional con equipo incluido.",
    price: 10000,
    imageUrl: PlaceHolderImages.find(img => img.id === 'billiards-1')?.imageUrl || "",
    metadata: "Reserva prioritaria",
  },
  {
    id: "t2",
    title: "Pack VIP 5 Fichas",
    category: "Fichas",
    description: "Ahorra con nuestro pack de 5 fichas para una noche completa de juego.",
    price: 40000,
    imageUrl: PlaceHolderImages.find(img => img.id === 'billiards-1')?.imageUrl || "",
    metadata: "Ahorra 20%",
  }
]

const CATEGORIES = ["Todos", "Tragos", "Bebidas c/ Alcohol", "Bebidas s/ Alcohol", "Comidas", "Fichas"]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Todos")

  const filteredItems = activeCategory === "Todos" 
    ? MENU_DATA 
    : MENU_DATA.filter(item => item.category === activeCategory)

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-5 pt-10 pb-6">
        <div className="flex flex-col gap-1">
          <p className="text-[#00F0FF] text-xs font-bold uppercase tracking-widest">Bienvenido a</p>
          <h1 className="text-5xl font-headline font-bold uppercase leading-none">BarPool</h1>
          <p className="text-[#B0B0B0] mt-2 max-w-[280px]">Disfruta del mejor pool con un ambiente futurista y cócteles de autor.</p>
        </div>
      </header>

      {/* Navigation */}
      <CategoryNav 
        categories={CATEGORIES} 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />

      {/* Grid Layout */}
      <main className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} {...item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[#B0B0B0]">No hay ítems en esta categoría todavía.</p>
          </div>
        )}
      </main>

      {/* Quick Actions */}
      <QuickActions />

      {/* Footer Branding */}
      <footer className="mt-12 mb-20 text-center opacity-20">
        <p className="font-headline uppercase tracking-tighter text-sm">Electric Neon Night v1.0</p>
      </footer>
    </div>
  )
}
