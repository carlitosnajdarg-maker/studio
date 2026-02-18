
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
  DialogDescription,
} from "@/components/ui/dialog"
import { QrCode, Settings, Loader2, AlertCircle, Info, ExternalLink, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// Menú Digital Mr. Smith - Mejor Bar Pool de la Costa
const CATEGORIES = ["Todos", "Tragos", "Bebidas c/ Alcohol", "Bebidas s/ Alcohol", "Comidas", "Fichas"]

export default function Home() {
  const db = useFirestore()
  const { user } = useUser()
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([])
  const [loading, setLoading] = useState(true)
  const [publicUrl, setPublicUrl] = useState("")

  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members")), [db])
  const { data: staffList } = useCollection(staffQuery)
  
  const userProfile = staffList?.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase())
  const userIsAdmin = isAdmin(user?.email) || userProfile?.role === 'Gerente' || userProfile?.role === 'Dueño' || isOwner(user?.email)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, "menu"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: any[] = []
      querySnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }))
      setMenuItems(items)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [db])

  const filteredItems = activeCategory === "Todos" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory)

  const isDevUrl = publicUrl.includes("workstations.google.com")

  return (
    <div className="min-h-screen pb-32 bg-[#120108]">
      <header className="px-5 pt-10 pb-6 flex justify-between items-start max-w-4xl mx-auto">
        <div className="flex flex-col gap-1">
          <p className="text-[#00F0FF] text-[10px] font-bold uppercase tracking-[0.3em]">Bienvenido al</p>
          <h1 className="text-4xl font-headline font-bold uppercase leading-tight text-[#FF008A] tracking-tighter">Mr. Smith</h1>
          <h2 className="text-2xl font-headline font-bold uppercase tracking-tighter text-[#00F0FF] -mt-1 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">Mejor Bar Pool de la Costa</h2>
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
            <DialogContent className="bg-[#1a020c] border-[#FF008A]/30 text-white max-w-[350px] rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-center font-headline text-xl text-[#FF008A] uppercase tracking-widest">Compartir Menú</DialogTitle>
                <DialogDescription className="text-center text-[10px] text-white/50 uppercase font-bold tracking-tight">Crea el QR para tus mesas</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <QRCodeSVG value={publicUrl} size={180} />
                </div>
                
                <div className="w-full space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-[10px] text-blue-400 font-bold flex items-center gap-1 uppercase mb-2">
                      <Globe className="w-3 h-3" /> URL del Menú (Hosting)
                    </p>
                    <Input 
                      value={publicUrl} 
                      onChange={(e) => setPublicUrl(e.target.value)} 
                      placeholder="https://mrsmith.web.app" 
                      className="h-9 text-[11px] bg-black/40 border-white/20 text-white font-mono"
                    />
                    {isDevUrl && (
                      <p className="text-[9px] text-yellow-500 mt-2 leading-tight flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Esta es tu URL privada de trabajo. Usa la de App Hosting para el bar.
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-center text-[10px] text-[#B0B0B0] px-2 flex items-center gap-2">
                  <Info className="w-3 h-3 text-[#00F0FF]" /> Escanea para entrar al mejor bar pool.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <CategoryNav categories={CATEGORIES} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <main className="px-5 mt-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#FF008A] animate-spin" />
            <p className="text-[#FF008A] font-bold uppercase tracking-widest text-xs">Abriendo el bar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => <MenuCard key={item.id} {...item} />)}
            {filteredItems.length === 0 && (
              <div className="col-span-2 py-20 text-center">
                <p className="text-white/20 italic uppercase font-bold text-xs tracking-widest">Aún no hay ítems en esta categoría</p>
              </div>
            )}
          </div>
        )}
      </main>

      <QuickActions />
    </div>
  )
}
