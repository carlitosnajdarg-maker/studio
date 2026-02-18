
"use client"

import { useState, useEffect } from "react"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { isAdmin } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collection, addDoc, deleteDoc, doc, query, onSnapshot, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ArrowLeft, ShieldCheck, AlertCircle, Sparkles, Database, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [hostname, setHostname] = useState("")
  const { toast } = useToast()

  // Form states
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Tragos")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname)
    }
  }, [])

  useEffect(() => {
    if (user && isAdmin(user.email) && db) {
      const q = query(collection(db, "menu"), orderBy("createdAt", "desc"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setMenuItems(items)
      })
      return () => unsubscribe()
    }
  }, [user, db])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado", description: "Dominio copiado al portapapeles." })
  }

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      console.error("Login error details:", error)
      
      let errorMessage = "No se pudo iniciar sesión con Google."
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = `Dominio no autorizado: ${window.location.hostname}. Debes añadirlo en la Consola de Firebase.`
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Cerraste la ventana antes de terminar. Intenta de nuevo."
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "El navegador bloqueó la ventana emergente. Por favor, permítelas."
      }

      toast({
        title: "Error de conexión",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin(user?.email) || !db) return

    try {
      await addDoc(collection(db, "menu"), {
        title,
        category,
        price: Number(price),
        description,
        imageUrl: category === "Comidas" ? "https://picsum.photos/seed/food/400/500" : "https://picsum.photos/seed/drink/400/500",
        createdAt: new Date().toISOString()
      })
      setTitle("")
      setPrice("")
      setDescription("")
      toast({ title: "Producto añadido", description: `${title} ya está en el menú.` })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar en Firestore.", variant: "destructive" })
    }
  }

  const seedInitialData = async () => {
    if (!isAdmin(user?.email) || !db) return
    const initialItems = [
      { title: "Maní Salado", category: "Comidas", price: 800, description: "El clásico acompañamiento para tu cerveza.", imageUrl: "https://picsum.photos/seed/mani/400/500" },
      { title: "Pancho Mr. Smith", category: "Comidas", price: 2500, description: "Con lluvia de papas y aderezos especiales.", imageUrl: "https://picsum.photos/seed/pancho/400/500" },
      { title: "Fernet con Coca", category: "Tragos", price: 4500, description: "El Rey de la casa. 70/30.", imageUrl: "https://picsum.photos/seed/fernet/400/500" }
    ];

    try {
      for (const item of initialItems) {
        await addDoc(collection(db, "menu"), { ...item, createdAt: new Date().toISOString() });
      }
      toast({ title: "Datos cargados", description: "Se han añadido los productos clásicos de Mr. Smith." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la semilla.", variant: "destructive" });
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!isAdmin(user?.email) || !db) return
    if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) return

    try {
      await deleteDoc(doc(db, "menu", id))
      toast({ title: "Eliminado", description: "Producto quitado del menú público." })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
    }
  }

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#120108]">
      <div className="text-[#FF008A] font-bold animate-pulse text-xl font-headline uppercase tracking-widest">Sincronizando...</div>
    </div>
  )

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-[#FF008A]/30 text-white overflow-hidden shadow-2xl">
          <div className="h-2 bg-[#FF008A]"></div>
          <CardHeader className="text-center pt-8">
            <ShieldCheck className="w-12 h-12 text-[#FF008A] mx-auto mb-4" />
            <CardTitle className="text-3xl font-headline text-white uppercase leading-none">Acceso Staff</CardTitle>
            <p className="text-[#B0B0B0] text-sm mt-2">Mr. Smith Bar Pool</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pb-10">
            <div className="bg-[#FF008A]/5 border border-[#FF008A]/20 p-4 rounded-xl space-y-3">
              <p className="text-xs text-[#B0B0B0] text-center uppercase tracking-widest font-bold">Paso 1: Autorizar Dominio</p>
              <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                <code className="text-[10px] text-[#00F0FF] truncate mr-2">{hostname}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#00F0FF]" onClick={() => copyToClipboard(hostname)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Link href="https://console.firebase.google.com/" target="_blank">
                <Button variant="outline" className="w-full text-[10px] h-8 border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10">
                  <ExternalLink className="w-3 h-3 mr-2" /> Ir a Consola Firebase
                </Button>
              </Link>
            </div>

            <Button onClick={handleLogin} className="bg-[#FF008A] hover:bg-[#FF008A]/80 text-white font-bold h-14 text-lg rounded-xl transition-all shadow-lg">
              Entrar con Google
            </Button>
            
            <Link href="/" className="text-center text-xs text-[#00F0FF] hover:underline flex items-center justify-center gap-2 mt-2 opacity-70">
              <ArrowLeft className="w-4 h-4" /> Volver al menú público
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-destructive/50 text-white text-center shadow-2xl">
          <CardHeader className="pt-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl text-destructive font-headline uppercase">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-10">
            <p className="text-[#B0B0B0] text-sm leading-relaxed">
              El correo <span className="text-white font-bold">{user.email}</span> no está autorizado.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => signOut(auth)} variant="outline" className="border-white/20 text-white hover:bg-white/5 h-12">
                Cerrar Sesión
              </Button>
              <Link href="/" className="block text-[#00F0FF] hover:underline text-sm font-bold uppercase tracking-widest mt-2">Volver al inicio</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#120108] text-white p-5 pb-24">
      <header className="flex justify-between items-center mb-10 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#FF008A] uppercase tracking-tight">Panel de Control</h1>
          <p className="text-xs text-[#B0B0B0] font-medium">Admin: {user.email}</p>
        </div>
        <Button onClick={() => signOut(auth)} size="icon" variant="ghost" className="text-white hover:bg-destructive/20 hover:text-destructive rounded-full h-12 w-12">
          <LogOut className="w-6 h-6" />
        </Button>
      </header>

      <div className="grid gap-8 max-w-4xl mx-auto">
        {menuItems.length === 0 && (
          <Card className="bg-[#00F0FF]/5 border-[#00F0FF]/50 text-white overflow-hidden animate-pulse">
            <CardHeader className="text-center">
              <Database className="w-12 h-12 text-[#00F0FF] mx-auto mb-4" />
              <CardTitle className="font-headline text-[#00F0FF] uppercase">Menú Vacío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center pb-8">
              <p className="text-[#B0B0B0] text-sm">Tu base de datos está lista. ¿Quieres cargar los clásicos ahora?</p>
              <Button onClick={seedInitialData} className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#120108] font-bold h-14 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <Sparkles className="w-5 h-5 mr-2" /> Activar Menú Dinámico
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-[#1a020c] border-[#00F0FF]/30 text-white shadow-xl overflow-hidden">
          <div className="h-1 bg-[#00F0FF]"></div>
          <CardHeader>
            <CardTitle className="text-[#00F0FF] flex items-center gap-2 font-headline text-xl uppercase">
              <Plus className="w-6 h-6" /> Añadir Nuevo Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs uppercase tracking-widest text-[#B0B0B0]">Nombre</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Gancia con Limón" className="bg-white/5 border-white/10 h-12 focus:border-[#00F0FF]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-xs uppercase tracking-widest text-[#B0B0B0]">Categoría</Label>
                  <select 
                    id="category" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-[#1a020c] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00F0FF]"
                  >
                    <option value="Tragos">Tragos</option>
                    <option value="Bebidas c/ Alcohol">Bebidas c/ Alcohol</option>
                    <option value="Bebidas s/ Alcohol">Bebidas s/ Alcohol</option>
                    <option value="Comidas">Comidas</option>
                    <option value="Fichas">Fichas</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-xs uppercase tracking-widest text-[#B0B0B0]">Precio ($)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="3500" className="bg-white/5 border-white/10 h-12 focus:border-[#00F0FF]" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-xs uppercase tracking-widest text-[#B0B0B0]">Descripción</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Refrescante..." className="bg-white/5 border-white/10 h-12 focus:border-[#00F0FF]" />
              </div>
              <Button type="submit" className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#120108] font-bold h-14 text-lg rounded-xl transition-all">
                Publicar
              </Button>
            </form>
          </CardContent>
        </Card>

        {menuItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-headline font-bold text-white uppercase tracking-tight">Productos ({menuItems.length})</h2>
            <div className="grid gap-3">
              {menuItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 bg-[#1a020c] rounded-2xl border border-white/5 group hover:border-[#FF008A]/30 transition-all">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-[#B0B0B0] uppercase font-bold">{item.category}</span>
                      <p className="font-bold text-lg">{item.title}</p>
                    </div>
                    <p className="text-[#00F0FF] font-bold">${item.price.toLocaleString('es-AR')}</p>
                  </div>
                  <Button onClick={() => handleDeleteItem(item.id, item.title)} variant="ghost" size="icon" className="text-[#B0B0B0] hover:text-destructive h-12 w-12">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-[#120108]/80 backdrop-blur-xl border-t border-white/5 z-50">
         <Link href="/">
          <Button variant="ghost" className="text-[#00F0FF] font-bold uppercase text-xs tracking-widest">
             <ArrowLeft className="mr-2 w-4 h-4" /> Vista Cliente
          </Button>
         </Link>
      </div>
    </div>
  )
}
