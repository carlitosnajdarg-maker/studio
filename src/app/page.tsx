
"use client"

import { useState, useEffect } from "react"
import { CategoryNav } from "@/components/menu/CategoryNav"
import { MenuCard, MenuItemProps } from "@/components/menu/MenuCard"
import { QuickActions } from "@/components/menu/QuickActions"
import { useFirestore, useUser, useMemoFirebase, useCollection, useDoc } from "@/firebase"
import { collection, onSnapshot, query, orderBy, doc, setDoc } from "firebase/firestore"
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
import { QrCode, Settings, Loader2, Info, AlertCircle, Globe, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = ["Todos", "Tragos", "Bebidas c/ Alcohol", "Bebidas s/ Alcohol", "Comidas", "Fichas"]

export default function Home() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([])
  const [loading, setLoading] = useState(true)

  // Obtener URL pública de Firestore
  const settingsRef = useMemoFirebase(() => doc(db, "settings", "general"), [db])
  const { data: settings } = useDoc(settingsRef)
  const [inputUrl, setInputUrl] = useState("")

  useEffect(() => {
    if (settings?.publicUrl) {
      setInputUrl(settings.publicUrl)
    } else if (typeof window !== "undefined") {
      setInputUrl(window.location.origin)
    }
  }, [settings])

  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members")), [db])
  const { data: staffList } = useCollection(staffQuery)
  
  const userProfile = staffList?.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase())
  const userIsAdmin = isAdmin(user?.email) || userProfile?.role === 'Gerente' || userProfile?.role === 'Dueño' || isOwner(user?.email)

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

  const handleSaveUrl = async () => {
    if (!db || !userIsAdmin) return
    try {
      await setDoc(doc(db, "settings", "general"), { publicUrl: inputUrl }, { merge: true })
      toast({ title: "URL de QR actualizada" })
    } catch (e) {
      toast({ title: "Error de permisos", variant: "destructive" })
    }
  }

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
                <DialogTitle className="text-center font-headline text-xl text-[#FF008A] uppercase tracking-widest">Código QR Mesas</DialogTitle>
                <DialogDescription className="text-center text-[10px] text-white/50 uppercase font-bold tracking-tight">Escanea para ver el menú</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <QRCodeSVG value={settings?.publicUrl || inputUrl} size={180} />
                </div>
                
                {userIsAdmin && (
                  <div className="w-full space-y-3 mt-2">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <p className="text-[10px] text-blue-400 font-bold flex items-center gap-1 uppercase mb-2">
                        <ShieldCheck className="w-3 h-3" /> Configuración (Solo Gerencia)
                      </p>
                      <div className="flex gap-2">
                        <Input 
                          value={inputUrl} 
                          onChange={(e) => setInputUrl(e.target.value)} 
                          placeholder="URL pública del menú" 
                          className="h-9 text-[11px] bg-black/40 border-white/20 text-white font-mono"
                        />
                        <Button onClick={handleSaveUrl} size="sm" className="h-9 bg-[#00F0FF] text-black font-bold">OK</Button>
                      </div>
                      <p className="text-[9px] text-white/40 mt-2 leading-tight">
                        Esta URL define a dónde irán los clientes al escanear el QR.
                      </p>
                    </div>
                  </div>
                )}
                
                {!userIsAdmin && (
                  <p className="text-[10px] text-[#B0B0B0] text-center font-medium">
                    Muestra este código a tus clientes para que accedan al menú digital.
                  </p>
                )}
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
          </div>
        )}
      </main>

      <QuickActions />
    </div>
  )
}
