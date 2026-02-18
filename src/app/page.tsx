
"use client"

import { useState, useEffect } from "react"
import { CategoryNav } from "@/components/menu/CategoryNav"
import { MenuCard, MenuItemProps } from "@/components/menu/MenuCard"
import { QuickActions } from "@/components/menu/QuickActions"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query } from "firebase/firestore"
import { QRCodeSVG } from "qrcode.react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"

const CATEGORIES = ["Todos", "Tragos", "Bebidas c/ Alcohol", "Bebidas s/ Alcohol", "Comidas", "Fichas"]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "menu"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: any[] = []
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() })
      })
      
      // Si está vacío, podríamos cargar los iniciales (opcional)
      setMenuItems(items)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredItems = activeCategory === "Todos" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory)

  // URL para el QR
  const [currentUrl, setCurrentUrl] = useState("")
  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-5 pt-10 pb-6 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <p className="text-[#00F0FF] text-xs font-bold uppercase tracking-widest">Bienvenido a</p>
          <h1 className="text-4xl font-headline font-bold uppercase leading-tight text-[#FF008A]">Mr. Smith</h1>
          <h2 className="text-2xl font-headline font-bold uppercase tracking-tighter text-[#00F0FF] -mt-1">Bar Pool</h2>
          <p className="text-[#B0B0B0] mt-2 max-w-[280px]">Disfruta del mejor pool en un ambiente eléctrico y futurista.</p>
        </div>
        
        {/* QR Access Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="text-[#FF008A] hover:bg-[#FF008A]/10 mt-1">
              <QrCode className="w-8 h-8" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a020c] border-[#FF008A]/30 text-white max-w-xs rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-center font-headline text-xl text-[#FF008A]">Comparte el Menú</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={currentUrl} size={200} />
              </div>
              <p className="text-center text-sm text-[#B0B0B0]">Escanea este código para acceder al menú digital de Mr. Smith.</p>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Navigation */}
      <CategoryNav 
        categories={CATEGORIES} 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />

      {/* Grid Layout */}
      <main className="px-5 mt-6">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-[#FF008A] animate-pulse">Cargando menú eléctrico...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} {...item} />
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[#B0B0B0]">No hay ítems en esta categoría todavía.</p>
          </div>
        )}
      </main>

      {/* Quick Actions */}
      <QuickActions />

      {/* Footer Branding */}
      <footer className="mt-12 mb-20 text-center opacity-20">
        <p className="font-headline uppercase tracking-tighter text-sm">Mr. Smith Electric Neon v2.0 Admin Enabled</p>
      </footer>
    </div>
  )
}
