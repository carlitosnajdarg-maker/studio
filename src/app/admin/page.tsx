
"use client"

import { useState, useEffect } from "react"
import { auth, googleProvider, db } from "@/lib/firebase"
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth"
import { isAdmin } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ArrowLeft } from "lucide-react"
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser && isAdmin(currentUser.email)) {
        fetchMenuItems()
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchMenuItems = async () => {
    const querySnapshot = await getDocs(collection(db, "menu"))
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setMenuItems(items)
  }

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión",
        variant: "destructive"
      })
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin(user?.email)) return

    try {
      await addDoc(collection(db, "menu"), {
        title,
        category,
        price: Number(price),
        description,
        imageUrl: "https://picsum.photos/seed/new/400/500", // Placeholder
        metadata: "Nuevo"
      })
      setTitle("")
      setPrice("")
      setDescription("")
      fetchMenuItems()
      toast({ title: "Éxito", description: "Ítem añadido al menú" })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo añadir el ítem", variant: "destructive" })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!isAdmin(user?.email)) return
    try {
      await deleteDoc(doc(db, "menu", id))
      fetchMenuItems()
      toast({ title: "Eliminado", description: "El ítem ha sido quitado" })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#FF008A]">Cargando...</div>

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-[#FF008A]/30 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-[#FF008A]">Acceso Admin</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-[#B0B0B0] text-center">Inicia sesión para gestionar el bar.</p>
            <Button onClick={handleLogin} className="bg-[#FF008A] hover:bg-[#FF008A]/80 text-white font-bold h-12">
              Entrar con Google
            </Button>
            <Link href="/" className="text-center text-xs text-[#00F0FF] hover:underline mt-2 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Volver al menú
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-destructive text-white text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive font-headline">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#B0B0B0]">Tu correo ({user.email}) no está en la lista blanca.</p>
            <Button onClick={() => signOut(auth)} variant="outline" className="border-white/20 text-white">
              Cerrar Sesión
            </Button>
            <Link href="/" className="block text-[#00F0FF] hover:underline text-sm">Volver al inicio</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#120108] text-white p-5 pb-20">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#FF008A]">Panel de Control</h1>
          <p className="text-xs text-[#B0B0B0]">{user.email}</p>
        </div>
        <Button onClick={() => signOut(auth)} size="icon" variant="ghost" className="text-white hover:bg-[#FF008A]">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="grid gap-8">
        {/* Formulario de Añadir */}
        <Card className="bg-[#1a020c] border-[#00F0FF]/30 text-white">
          <CardHeader>
            <CardTitle className="text-[#00F0FF] flex items-center gap-2">
              <Plus className="w-5 h-5" /> Añadir Nuevo Ítem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Nombre del Producto</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-white/5 border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <select 
                    id="category" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <option value="Tragos">Tragos</option>
                    <option value="Bebidas c/ Alcohol">Bebidas c/ Alcohol</option>
                    <option value="Bebidas s/ Alcohol">Bebidas s/ Alcohol</option>
                    <option value="Comidas">Comidas</option>
                    <option value="Fichas">Fichas</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio (ARS)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Descripción</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required className="bg-white/5 border-white/10" />
              </div>
              <Button type="submit" className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#120108] font-bold">
                Guardar Producto
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista Actual */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Menú Actual</h2>
          <div className="grid gap-3">
            {menuItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-[#1a020c] rounded-xl border border-white/5">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-xs text-[#B0B0B0]">{item.category} • ${item.price.toLocaleString('es-AR')}</p>
                </div>
                <Button 
                  onClick={() => handleDeleteItem(item.id)} 
                  variant="ghost" 
                  size="icon" 
                  className="text-[#B0B0B0] hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {menuItems.length === 0 && <p className="text-center text-[#B0B0B0] py-10">No hay productos en la base de datos.</p>}
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-background/50 backdrop-blur-sm">
         <Link href="/">
          <Button variant="ghost" className="text-[#00F0FF] hover:bg-white/5 font-bold">
             <ArrowLeft className="mr-2 w-4 h-4" /> Ver Menú Público
          </Button>
         </Link>
      </div>
    </div>
  )
}
