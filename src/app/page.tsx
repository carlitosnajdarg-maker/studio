
"use client"

import { useState, useEffect } from "react"
import { CategoryNav } from "@/components/menu/CategoryNav"
import { MenuCard, MenuItemProps } from "@/components/menu/MenuCard"
import { QuickActions } from "@/components/menu/QuickActions"
import { db, auth, isConfigValid } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, query } from "firebase/firestore"
import { QRCodeSVG } from "qrcode.react"
import { isAdmin } from "@/lib/admin-config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QrCode, Settings, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const CATEGORIES = ["Todos", "Tragos", "Bebidas c/ Alcohol", "Bebidas s/ Alcohol", "Comidas", "Fichas"]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([])
  const [loading, setLoading] = useState(true)
  const [userIsAdmin, setUserIsAdmin] = useState(false)

  // Verificación de admin para mostrar botón de configuración
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserIsAdmin(isAdmin(user?.email))
    })
    return () => unsubscribe()
  }, [])

  // Carga pública del menú
  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }
    const q = query(collection(db, "menu"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: any[] = []
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() })
      })
      setMenuItems(items)
      setLoading(false)
    }, (error) => {
      console.error("Error cargando el menú:", error)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredItems = activeCategory === "Todos" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory)

  const [currentUrl, setCurrentUrl] = useState("")
  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  return (
    <div className="min-h-screen pb-32">
      {/* Aviso de configuración faltante si no hay API Key */}
      {!isConfigValid && (
        <div className="p-4">
          <Alert variant="destructive" className="bg-destructive/20 border-destructive/50 text-white">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Falta Configuración de Firebase</AlertTitle>
            <AlertDescription>
              Asegúrate de configurar las variables de entorno en el panel de Firebase Studio para que el menú dinámico y el login funcionen.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-10 pb-6 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <p className="text-[#00F0FF] text-xs font-bold uppercase tracking-widest">Bienvenido a</p>
          <h1 className="text-4xl font-headline font-bold uppercase leading-tight text-[#FF008A]">Mr. Smith</h1>
          <h2 className="text-2xl font-headline font-bold uppercase tracking-tighter text-[#00F0FF] -mt-1">Bar Pool</h2>
          <p className="text-[#B0B0B0] mt-2 max-w-[280px]">Disfruta del mejor pool en un ambiente eléctrico y futurista.</p>
        </div>
        
        <div className="flex gap-2">
          {userIsAdmin && (
            <Link href="/admin">
              <Button size="icon" variant="ghost" className="text-[#00F0FF] hover:bg-[#00F0FF]/10 mt-1">
                <Settings className="w-6 h-6" />
              </Button>
            </Link>
          )}

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
        </div>
      </header>

      <CategoryNav 
        categories={CATEGORIES} 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />

      <main className="px-5 mt-6">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#FF008A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#FF008A] font-bold">Cargando menú eléctrico...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} {...item} />
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-[#B0B0B0]">
              {!isConfigValid 
                ? "Conecta Firebase para ver el menú dinámico." 
                : "No hay productos disponibles en esta sección."}
            </p>
            {userIsAdmin && isConfigValid && (
              <Link href="/admin">
                <Button variant="link" className="text-[#FF008A] mt-2 font-bold">
                  Añadir productos ahora
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>

      <QuickActions />

      <footer className="mt-12 mb-20 text-center">
        <p className="font-headline uppercase tracking-tighter text-[10px] text-[#B0B0B0] opacity-30">Mr. Smith Electric Neon v2.2</p>
        <Link href="/admin" className="text-[10px] text-[#B0B0B0] opacity-10 hover:opacity-100 transition-opacity mt-2 block">
          Acceso Personal
        </Link>
      </footer>
    </div>
  )
}
