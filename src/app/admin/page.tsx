"use client"

import { useState, useEffect } from "react"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { isAdmin, isAuthorized, getRole } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collection, addDoc, deleteDoc, doc, query, onSnapshot, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ArrowLeft, ShieldCheck, AlertCircle, Sparkles, Database, Copy, ExternalLink, Image as ImageIcon, UserCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
  const [imageUrl, setImageUrl] = useState("")

  const role = user ? getRole(user.email) : 'none'

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname)
    }
  }, [])

  useEffect(() => {
    if (user && isAuthorized(user.email) && db) {
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
      let errorMessage = "No se pudo iniciar sesión con Google."
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = `Dominio no autorizado: ${window.location.hostname}.`
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthorized(user?.email) || !db) return

    const defaultImg = category === "Comidas" 
      ? "https://picsum.photos/seed/food/400/500" 
      : "https://picsum.photos/seed/drink/400/500"

    try {
      await addDoc(collection(db, "menu"), {
        title,
        category,
        price: Number(price),
        description,
        imageUrl: imageUrl || defaultImg,
        createdAt: new Date().toISOString(),
        createdBy: user?.email
      })
      setTitle("")
      setPrice("")
      setDescription("")
      setImageUrl("")
      toast({ title: "Producto añadido", description: `${title} ya está en el menú.` })
    } catch (error) {
      toast({ title: "Error", description: "No tienes permiso para escribir.", variant: "destructive" })
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!isAdmin(user?.email) || !db) {
      toast({ title: "Acceso denegado", description: "Solo los administradores pueden borrar productos.", variant: "destructive" })
      return
    }
    if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) return

    try {
      await deleteDoc(doc(db, "menu", id))
      toast({ title: "Eliminado", description: "Producto quitado del menú." })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
    }
  }

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#120108]">
      <div className="text-[#FF008A] font-bold animate-pulse text-xl font-headline uppercase tracking-widest">Verificando...</div>
    </div>
  )

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-[#FF008A]/30 text-white overflow-hidden shadow-2xl">
          <div className="h-2 bg-[#FF008A]"></div>
          <CardHeader className="text-center pt-8">
            <ShieldCheck className="w-12 h-12 text-[#FF008A] mx-auto mb-4" />
            <CardTitle className="text-3xl font-headline text-white uppercase leading-none">Acceso Personal</CardTitle>
            <p className="text-[#B0B0B0] text-sm mt-2">Mr. Smith Bar Pool</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pb-10">
            <div className="bg-[#FF008A]/5 border border-[#FF008A]/20 p-4 rounded-xl space-y-3">
              <p className="text-xs text-[#B0B0B0] text-center uppercase tracking-widest font-bold">Autorizar Dominio</p>
              <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                <code className="text-[10px] text-[#00F0FF] truncate mr-2">{hostname}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#00F0FF]" onClick={() => copyToClipboard(hostname)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleLogin} className="bg-[#FF008A] hover:bg-[#FF008A]/80 text-white font-bold h-14 text-lg rounded-xl shadow-lg">
              Entrar con Google
            </Button>
            <Link href="/" className="text-center text-xs text-[#00F0FF] hover:underline flex items-center justify-center gap-2 mt-2">
              <ArrowLeft className="w-4 h-4" /> Volver al menú público
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-destructive/50 text-white text-center shadow-2xl">
          <CardHeader className="pt-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl text-destructive font-headline uppercase">Sin Autorización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-10">
            <p className="text-[#B0B0B0] text-sm leading-relaxed">
              El correo <span className="text-white font-bold">{user.email}</span> no es parte del staff autorizado.
            </p>
            <Button onClick={() => signOut(auth)} variant="outline" className="border-white/20 text-white hover:bg-white/5 w-full">
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#120108] text-white p-5 pb-24">
      <header className="flex justify-between items-center mb-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="bg-[#FF008A]/20 p-3 rounded-full border border-[#FF008A]/40">
            <UserCircle className="w-8 h-8 text-[#FF008A]" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-bold text-[#FF008A] uppercase tracking-tight">
              {role === 'admin' ? 'Panel Gerencia' : 'Panel Personal'}
            </h1>
            <p className="text-[10px] text-[#B0B0B0] font-bold uppercase tracking-widest">{user.email}</p>
          </div>
        </div>
        <Button onClick={() => signOut(auth)} size="icon" variant="ghost" className="text-white hover:bg-destructive/20 hover:text-destructive rounded-full h-12 w-12">
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-[10px] uppercase tracking-widest text-[#B0B0B0]">Nombre</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Gin Tonic Eléctrico" className="bg-white/5 border-white/10 h-12 focus:border-[#00F0FF]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-[10px] uppercase tracking-widest text-[#B0B0B0]">Categoría</Label>
                  <select 
                    id="category" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-[#1a020c] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#00F0FF] outline-none"
                  >
                    <option value="Tragos">Tragos</option>
                    <option value="Bebidas c/ Alcohol">Bebidas c/ Alcohol</option>
                    <option value="Bebidas s/ Alcohol">Bebidas s/ Alcohol</option>
                    <option value="Comidas">Comidas</option>
                    <option value="Fichas">Fichas</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-[10px] uppercase tracking-widest text-[#B0B0B0]">Precio ($)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="3500" className="bg-white/5 border-white/10 h-12 focus:border-[#00F0FF]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl" className="text-[10px] uppercase tracking-widest text-[#B0B0B0]">URL Imagen (Opcional)</Label>
                  <div className="relative">
                    <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10 h-12 pl-10 focus:border-[#00F0FF]" />
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-[10px] uppercase tracking-widest text-[#B0B0B0]">Descripción</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ingredientes o detalles..." className="bg-white/5 border-white/10 h-12 focus:border-[#00F0FF]" />
              </div>

              <Button type="submit" className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#120108] font-bold h-14 text-lg rounded-xl transition-all">
                Publicar en Menú
              </Button>
            </form>
          </CardContent>
        </Card>

        {menuItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-headline font-bold text-white uppercase tracking-tight">Inventario de Menú ({menuItems.length})</h2>
            <div className="grid gap-3">
              {menuItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[#1a020c] rounded-2xl border border-white/5 group hover:border-[#FF008A]/30 transition-all overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-[#FF008A]/20 text-[#FF008A] px-2 py-0.5 rounded uppercase font-bold border border-[#FF008A]/20">{item.category}</span>
                        <p className="font-bold text-base">{item.title}</p>
                      </div>
                      <p className="text-[#00F0FF] font-bold text-sm">${item.price.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  
                  {role === 'admin' ? (
                    <Button onClick={() => handleDeleteItem(item.id, item.title)} variant="ghost" size="icon" className="text-white/20 hover:text-destructive h-12 w-12">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  ) : (
                    <div className="text-[10px] text-white/20 uppercase font-bold px-4">Solo lectura</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-[#120108]/80 backdrop-blur-xl border-t border-white/5 z-50">
         <Link href="/">
          <Button variant="ghost" className="text-[#00F0FF] font-bold uppercase text-xs tracking-widest">
             <ArrowLeft className="mr-2 w-4 h-4" /> Volver al Menú Neón
          </Button>
         </Link>
      </div>
    </div>
  )
}
