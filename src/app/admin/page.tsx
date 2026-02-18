
"use client"

import { useState, useEffect } from "react"
import { auth, googleProvider, db, isConfigValid } from "@/lib/firebase"
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth"
import { isAdmin } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collection, addDoc, deleteDoc, doc, query, onSnapshot } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ArrowLeft, ShieldCheck, AlertCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const { toast } = useToast()

  // Form states
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Tragos")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user && isAdmin(user.email) && db) {
      const q = query(collection(db, "menu"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setMenuItems(items)
      })
      return () => unsubscribe()
    }
  }, [user])

  const handleLogin = async () => {
    if (!auth) return
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "Revisa la configuración de Firebase Authentication.",
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
        imageUrl: category === "Tragos" ? "https://picsum.photos/seed/drink/400/500" : "https://picsum.photos/seed/food/400/500",
        metadata: "Nuevo",
        createdAt: new Date().toISOString()
      })
      setTitle("")
      setPrice("")
      setDescription("")
      toast({ title: "Producto añadido", description: `${title} ya está en el menú.` })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" })
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!isAdmin(user?.email) || !db) return
    if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) return

    try {
      await deleteDoc(doc(db, "menu", id))
      toast({ title: "Eliminado", description: "Producto quitado." })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
    }
  }

  if (!isConfigValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="bg-[#1a020c] border-destructive/50 text-white max-w-md text-center">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-xl font-headline uppercase">Firebase no configurado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#B0B0B0]">Las credenciales de Firebase no son válidas o faltan.</p>
            <Link href="/" className="text-[#00F0FF] hover:underline flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver al menú
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#120108]">
      <div className="text-[#FF008A] font-bold animate-bounce text-xl font-headline uppercase">Accediendo al panel...</div>
    </div>
  )

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-[#FF008A]/30 text-white overflow-hidden shadow-2xl">
          <div className="h-2 bg-[#FF008A]"></div>
          <CardHeader className="text-center pt-8">
            <ShieldCheck className="w-12 h-12 text-[#FF008A] mx-auto mb-4" />
            <CardTitle className="text-3xl font-headline text-white uppercase">Panel Administrativo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pb-10">
            <p className="text-[#B0B0B0] text-center px-4">
              Solo el personal autorizado de <strong>Mr. Smith</strong> puede gestionar el menú.
            </p>
            <Button onClick={handleLogin} className="bg-[#FF008A] hover:bg-[#FF008A]/80 text-white font-bold h-14 text-lg rounded-xl transition-all shadow-lg hover:shadow-[#FF008A]/20">
              Entrar con Google
            </Button>
            <Link href="/" className="text-center text-sm text-[#00F0FF] hover:underline flex items-center justify-center gap-2 mt-2 opacity-70 hover:opacity-100">
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
            <p className="text-[#B0B0B0]">
              Tu correo <span className="text-white font-bold">{user.email}</span> no está autorizado.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => signOut(auth)} variant="outline" className="border-white/20 text-white hover:bg-white/5">
                Cerrar Sesión
              </Button>
              <Link href="/" className="block text-[#00F0FF] hover:underline text-sm">Volver al inicio</Link>
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
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xs text-[#B0B0B0] font-medium">{user.email}</p>
          </div>
        </div>
        <Button onClick={() => signOut(auth)} size="icon" variant="ghost" className="text-white hover:bg-destructive/20 hover:text-destructive rounded-full h-12 w-12 transition-colors">
          <LogOut className="w-6 h-6" />
        </Button>
      </header>

      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="bg-[#1a020c] border-[#00F0FF]/30 text-white shadow-xl overflow-hidden">
          <div className="h-1 bg-[#00F0FF]"></div>
          <CardHeader>
            <CardTitle className="text-[#00F0FF] flex items-center gap-2 font-headline text-xl uppercase">
              <Plus className="w-6 h-6" /> Nuevo Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs uppercase tracking-widest text-[#B0B0B0]">Nombre del Producto</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Fernet con Coca" className="bg-white/5 border-white/10 h-12 text-lg focus:border-[#00F0FF]" />
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
                  <Label htmlFor="price" className="text-xs uppercase tracking-widest text-[#B0B0B0]">Precio (ARS)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="3500" className="bg-white/5 border-white/10 h-12 text-lg focus:border-[#00F0FF]" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-xs uppercase tracking-widest text-[#B0B0B0]">Descripción Corta</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Breve detalle del producto..." className="bg-white/5 border-white/10 h-12 focus:border-[#00F0FF]" />
              </div>
              <Button type="submit" className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#120108] font-bold h-14 text-lg rounded-xl transition-all shadow-lg hover:shadow-[#00F0FF]/20">
                Publicar en el Menú
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-headline font-bold text-white uppercase">Menú Actual ({menuItems.length})</h2>
          </div>
          <div className="grid gap-3">
            {menuItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-5 bg-[#1a020c] rounded-2xl border border-white/5 group hover:border-[#FF008A]/30 transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-[#B0B0B0] uppercase font-bold tracking-tighter">{item.category}</span>
                    <p className="font-bold text-lg leading-none">{item.title}</p>
                  </div>
                  <p className="text-xs text-[#B0B0B0] italic line-clamp-1">{item.description}</p>
                  <p className="text-[#00F0FF] font-bold mt-1">${item.price.toLocaleString('es-AR')}</p>
                </div>
                <Button 
                  onClick={() => handleDeleteItem(item.id, item.title)} 
                  variant="ghost" 
                  size="icon" 
                  className="text-[#B0B0B0] hover:text-destructive hover:bg-destructive/10 rounded-xl h-12 w-12"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
            {menuItems.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-[#B0B0B0] font-medium">Aún no hay productos publicados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-[#120108]/80 backdrop-blur-xl border-t border-white/5">
         <Link href="/">
          <Button variant="ghost" className="text-[#00F0FF] hover:bg-white/5 font-bold h-12 rounded-xl px-8">
             <ArrowLeft className="mr-2 w-4 h-4" /> Ver Menú Público
          </Button>
         </Link>
      </div>
    </div>
  )
}
