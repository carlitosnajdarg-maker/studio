
"use client"

import { useState, useEffect } from "react"
import { CategoryNav } from "@/components/menu/CategoryNav"
import { MenuCard, MenuItemProps } from "@/components/menu/MenuCard"
import { QuickActions } from "@/components/menu/QuickActions"
import { useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { QRCodeSVG } from "qrcode.react"
import { isAdmin, isOwner } from "@/lib/admin-config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QrCode, Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const CATEGORIES = ["Todos", "Tragos", "Bebidas c/ Alcohol", "Bebidas s/ Alcohol", "Comidas", "Fichas"]

export default function Home() {
  const db = useFirestore()
  const { user } = useUser()
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUrl, setCurrentUrl] = useState("")

  // Verificación de Admin Dinámico
  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members")), [db])
  const { data: staffList } = useCollection(staffQuery)
  
  const userProfile = staffList?.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase())
  const userIsAdmin = isAdmin(user?.email) || userProfile?.role === 'Gerente' || userProfile?.role === 'Dueño' || isOwner(user?.email)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href)
    }
  }, [])

  useEffect(() => {
    if (!db) return
    
    const q = query(collection(db, "menu"), orderBy("createdAt", "desc"))
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
  }, [db])

  const filteredItems = activeCategory === "Todos" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory)

  return (
    <div className="min-h-screen pb-32 bg-[#120108]">
      <header className="px-5 pt-10 pb-6 flex justify-between items-start max-w-4xl mx-auto">
        <div className="flex flex-col gap-1">
          <p className="text-[#00F0FF] text-[10px] font-bold uppercase tracking-[0.3em]">Bienvenido al</p>
          <h1 className="text-4xl font-headline font-bold uppercase leading-tight text-[#FF008A] tracking-tighter">Mr. Smith</h1>
          <h2 className="text-2xl font-headline font-bold uppercase tracking-tighter text-[#00F0FF] -mt-1 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">Mejor Bar Pool de la Costa</h2>
          <p className="text-[#B0B0B0] mt-3 max-w-[280px] text-sm leading-relaxed">Disfruta del mejor pool en un ambiente eléctrico y futurista frente al mar.</p>
        </div>
        
        <div className="flex gap-2">
          {userIsAdmin && (
            <Link href="/admin">
              <Button size="icon" variant="ghost" className="text-[#00F0FF] hover:bg-[#00F0FF]/10 mt-1 rounded-full border border-[#00F0FF]/20">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="text-[#FF008A] hover:bg-[#FF008A]/10 mt-1 rounded-full border border-[#FF008A]/20">
                <QrCode className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a020c] border-[#FF008A]/30 text-white max-w-[300px] rounded-3xl p-8">
              <DialogHeader>
                <DialogTitle className="text-center font-headline text-xl text-[#FF008A] uppercase tracking-widest">Compartir Menú</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="bg-white p-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  {currentUrl && <QRCodeSVG value={currentUrl} size={180} />}
                </div>
                <p className="text-center text-xs text-[#B0B0B0] px-2 font-medium">Escanea este código para acceder al menú del mejor bar pool de la costa.</p>
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

      <main className="px-5 mt-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#FF008A] animate-spin" />
            <p className="text-[#FF008A] font-bold uppercase tracking-widest text-xs">Cargando el mejor menú de la costa...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} {...item} />
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.02]">
            <p className="text-[#B0B0B0] text-sm italic">
              No hay productos disponibles en esta sección actualmente.
            </p>
            {userIsAdmin && (
              <Link href="/admin">
                <Button variant="link" className="text-[#FF008A] mt-4 font-bold uppercase text-xs tracking-widest">
                  Añadir productos ahora
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>

      <QuickActions />

      <footer className="mt-20 mb-24 text-center">
        <div className="w-10 h-[1px] bg-[#FF008A]/30 mx-auto mb-6"></div>
        <p className="font-headline uppercase tracking-[0.4em] text-[9px] text-[#B0B0B0] opacity-40">Mr. Smith - El Mejor Bar Pool de la Costa</p>
        <Link href="/admin" className="text-[10px] text-[#B0B0B0] opacity-10 hover:opacity-100 transition-opacity mt-4 inline-block hover:text-[#00F0FF]">
          ACCESO PERSONAL AUTORIZADO
        </Link>
      </footer>
    </div>
  )
}
