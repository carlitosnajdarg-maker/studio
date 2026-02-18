
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useAuth, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { isAdmin, isOwner, isAuthorized, getRole, OWNER_WHITELIST, ADMIN_WHITELIST } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, addDoc, deleteDoc, doc, query, onSnapshot, orderBy, updateDoc, serverTimestamp, where, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ArrowLeft, ShieldCheck, AlertCircle, Clock, Star, Users, Beer, Utensils, Coins, Image as ImageIcon, UserCircle, Edit2, CheckCircle2, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AdminPage() {
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [hostname, setHostname] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Menu Form states
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Tragos")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  // Staff Form states
  const [staffName, setStaffName] = useState("")
  const [staffEmail, setStaffEmail] = useState("")
  const [staffRole, setStaffRole] = useState("Bartender")

  // Queries
  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members")), [db])
  const { data: staffList } = useCollection(staffQuery)

  const ratingsQuery = useMemoFirebase(() => query(collection(db, "ratings")), [db])
  const { data: allRatings } = useCollection(ratingsQuery)

  const logsQuery = useMemoFirebase(() => query(collection(db, "work_logs"), orderBy("startTime", "desc")), [db])
  const { data: allLogs } = useCollection(logsQuery)

  // Roles dinámicos
  const staffProfile = staffList?.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase())
  const isActualOwner = isOwner(user?.email) || staffProfile?.role === 'Dueño'
  const isActualAdmin = isAdmin(user?.email) || staffProfile?.role === 'Gerente' || isActualOwner

  useEffect(() => {
    if (typeof window !== "undefined") setHostname(window.location.hostname)
  }, [])

  useEffect(() => {
    if (user && (isAuthorized(user.email) || staffProfile) && db) {
      const q = query(collection(db, "menu"), orderBy("createdAt", "desc"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      })
      return () => unsubscribe()
    }
  }, [user, db, staffProfile])

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 800000) { // Límite de ~800KB para Firestore Base64
        toast({ title: "Archivo muy pesado", description: "Por favor usa una imagen de menos de 800KB.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
        toast({ title: "Imagen lista", description: "Se ha cargado el archivo correctamente." })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditItem = (item: any) => {
    setEditingId(item.id)
    setTitle(item.title)
    setCategory(item.category)
    setPrice(item.price.toString())
    setDescription(item.description)
    setImageUrl(item.imageUrl)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const defaultImg = category === "Comidas" ? "https://picsum.photos/seed/food/400/500" : "https://picsum.photos/seed/drink/400/500"
    
    try {
      const itemData = {
        title, category, price: Number(price), description, imageUrl: imageUrl || defaultImg,
        updatedAt: serverTimestamp(), updatedBy: user?.email
      }

      if (editingId) {
        await updateDoc(doc(db, "menu", editingId), itemData)
        toast({ title: "Producto actualizado", description: `${title} ha sido modificado.` })
      } else {
        await addDoc(collection(db, "menu"), {
          ...itemData,
          createdAt: new Date().toISOString(), createdBy: user?.email
        })
        toast({ title: "Producto añadido", description: `${title} ya está en el menú.` })
      }
      
      resetForm()
    } catch (e) {
      toast({ title: "Error", description: "No tienes permiso para realizar esta acción.", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle(""); setPrice(""); setDescription(""); setImageUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isActualAdmin) return
    try {
      await addDoc(collection(db, "staff_members"), {
        name: staffName, email: staffEmail.toLowerCase(), role: staffRole, createdAt: serverTimestamp()
      })
      setStaffName(""); setStaffEmail("")
      toast({ title: "Personal registrado", description: `${staffName} ha sido añadido como ${staffRole}.` })
    } catch (e) {
      toast({ title: "Error", description: "Error al registrar personal.", variant: "destructive" })
    }
  }

  const handleClockToggle = async () => {
    if (!db || !user) return
    const currentStaff = staffList?.find(s => s.email?.toLowerCase() === user.email?.toLowerCase())
    if (!currentStaff) return

    if (currentStaff.activeSession) {
      const start = new Date(currentStaff.activeSession.startTime)
      const end = new Date()
      const diffMs = end.getTime() - start.getTime()
      const diffMins = Math.round(diffMs / 60000)

      await addDoc(collection(db, "work_logs"), {
        staffId: currentStaff.id, startTime: currentStaff.activeSession.startTime,
        endTime: end.toISOString(), durationMinutes: diffMins
      })
      await updateDoc(doc(db, "staff_members", currentStaff.id), { activeSession: null })
      toast({ title: "Salida registrada", description: `Turno finalizado.` })
    } else {
      await updateDoc(doc(db, "staff_members", currentStaff.id), {
        activeSession: { startTime: new Date().toISOString() }
      })
      toast({ title: "Entrada registrada", description: "¡Buen turno!" })
    }
  }

  const getStaffStats = (staffId: string) => {
    const staffRatings = allRatings?.filter(r => r.staffId === staffId) || []
    const avgRating = staffRatings.length ? (staffRatings.reduce((a, b) => a + b.score, 0) / staffRatings.length).toFixed(1) : "N/A"
    
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyMins = allLogs?.filter(l => l.staffId === staffId && new Date(l.startTime) > weekAgo)
      .reduce((a, b) => a + (b.durationMinutes || 0), 0) || 0
    
    return { 
      avgRating, 
      weeklyMins,
      displayTime: `${Math.floor(weeklyMins / 60)}h ${weeklyMins % 60}m`
    }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-[#120108] text-[#FF008A] font-bold animate-pulse uppercase tracking-widest">Verificando...</div>

  if (!user || (!isAuthorized(user.email) && !staffProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-[#FF008A]/30 text-white shadow-2xl overflow-hidden">
          <div className="h-2 bg-[#FF008A]"></div>
          <CardHeader className="text-center">
            <ShieldCheck className="w-12 h-12 text-[#FF008A] mx-auto mb-4" />
            <CardTitle className="text-3xl font-headline uppercase leading-none">Acceso Personal</CardTitle>
            <p className="text-[#B0B0B0] text-sm mt-2">{!user ? "Identifícate para gestionar el bar." : "Correo no autorizado."}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pb-10">
            {!user ? (
              <Button onClick={handleLogin} className="bg-[#FF008A] hover:bg-[#FF008A]/80 text-white font-bold h-14 text-lg rounded-xl">Entrar con Google</Button>
            ) : (
              <Button onClick={() => signOut(auth)} variant="outline" className="border-white/20 text-white">Cerrar Sesión</Button>
            )}
            <Link href="/" className="text-center text-xs text-[#00F0FF] hover:underline flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Volver al menú</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const roleLabel = isActualOwner ? 'Dueño' : (isActualAdmin ? 'Gerente' : staffProfile?.role || 'Staff')

  return (
    <div className="min-h-screen bg-[#120108] text-white p-5 pb-24">
      <header className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="bg-[#FF008A]/20 p-3 rounded-full border border-[#FF008A]/40">
            {isActualOwner ? <ShieldCheck className="w-8 h-8 text-[#00F0FF]" /> : <UserCircle className="w-8 h-8 text-[#FF008A]" />}
          </div>
          <div>
            <h1 className={`text-xl font-headline font-bold uppercase tracking-tight ${isActualOwner ? 'text-[#00F0FF]' : 'text-[#FF008A]'}`}>
              {roleLabel}
            </h1>
            <p className="text-[10px] text-[#B0B0B0] font-bold uppercase tracking-widest">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {staffProfile && (
             <Button 
                onClick={handleClockToggle} 
                variant={staffProfile.activeSession ? "destructive" : "default"}
                className={!staffProfile.activeSession ? "bg-green-600 hover:bg-green-700" : ""}
              >
               <Clock className="w-4 h-4 mr-2" />
               {staffProfile.activeSession ? "Marcar Salida" : "Marcar Entrada"}
             </Button>
          )}
          <Button onClick={() => signOut(auth)} size="icon" variant="ghost" className="hover:bg-destructive/20 rounded-full h-10 w-10"><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <Tabs defaultValue="menu" className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 bg-[#1a020c] border border-white/10 mb-8 p-1">
          <TabsTrigger value="menu" className="data-[state=active]:bg-[#FF008A] data-[state=active]:text-white font-bold uppercase text-xs">Menú del Bar</TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-[#00F0FF] data-[state=active]:text-[#120108] font-bold uppercase text-xs">Gestión Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-8">
          <Card className={`bg-[#1a020c] border-2 shadow-xl overflow-hidden ${editingId ? 'border-[#00F0FF]/50' : 'border-[#FF008A]/30'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center justify-between font-headline text-xl uppercase ${editingId ? 'text-[#00F0FF]' : 'text-[#FF008A]'}`}>
                <span className="flex items-center gap-2">
                  {editingId ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                </span>
                {editingId && <Button variant="ghost" size="sm" onClick={resetForm} className="text-white/40 hover:text-white">Cancelar</Button>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveItem} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-[#B0B0B0]">Nombre</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Fernet con Coca" className="bg-white/5 h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-[#B0B0B0]">Categoría</Label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#1a020c] border border-white/10 rounded-md h-12 px-3 text-sm">
                    <option value="Tragos">Tragos</option><option value="Comidas">Comidas</option><option value="Fichas">Fichas</option>
                    <option value="Bebidas c/ Alcohol">Bebidas c/ Alcohol</option><option value="Bebidas s/ Alcohol">Bebidas s/ Alcohol</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-[#B0B0B0]">Precio ($)</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0" className="bg-white/5 h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-[#B0B0B0]">Imagen</Label>
                  <div className="flex gap-2">
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL de imagen" className="bg-white/5 h-12 flex-1" />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 border-white/10 hover:bg-[#FF008A]/10">
                      <Upload className="w-5 h-5 text-[#FF008A]" />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] uppercase text-[#B0B0B0]">Descripción</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Breve descripción del producto..." className="bg-white/5 h-12" />
                </div>
                <Button type="submit" className={`md:col-span-2 font-bold h-12 uppercase ${editingId ? 'bg-[#00F0FF] text-[#120108] hover:bg-[#00F0FF]/80' : 'bg-[#FF008A] hover:bg-[#FF008A]/80'}`}>
                  {editingId ? 'Guardar Cambios' : 'Publicar Producto'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {menuItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-[#1a020c] rounded-xl border border-white/5 hover:border-[#FF008A]/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black">
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold">{item.title} <span className="text-[10px] text-[#FF008A] ml-2 uppercase opacity-60">[{item.category}]</span></p>
                    <p className="text-[#00F0FF] font-bold text-xs">${item.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button onClick={() => handleEditItem(item)} variant="ghost" size="icon" className="text-white/20 hover:text-[#00F0FF]"><Edit2 className="w-4 h-4" /></Button>
                  {isActualAdmin && (
                    <Button onClick={async () => { if(confirm("¿Eliminar producto definitivamente?")) await deleteDoc(doc(db!, "menu", item.id)) }} variant="ghost" size="icon" className="text-white/20 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-8">
          {isActualAdmin && (
            <Card className={`bg-[#1a020c] border-2 shadow-xl ${isActualOwner ? 'border-[#00F0FF]/30' : 'border-white/10'}`}>
              <CardHeader><CardTitle className="text-[#00F0FF] flex items-center gap-2 font-headline text-xl uppercase"><Users className="w-6 h-6" /> Gestión de Personal</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddStaff} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-[#B0B0B0]">Nombre</Label>
                    <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} required placeholder="Nombre completo" className="bg-white/5 h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-[#B0B0B0]">Email Google</Label>
                    <Input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required placeholder="ejemplo@gmail.com" className="bg-white/5 h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-[#B0B0B0]">Rol</Label>
                    <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} className="w-full bg-[#1a020c] border border-white/10 rounded-md h-12 px-3">
                      <option value="Bartender">Bartender</option>
                      <option value="Mesero">Mesero</option>
                      <option value="Seguridad">Seguridad</option>
                      {isActualOwner && <option value="Dueño">Dueño</option>}
                      {isActualOwner && <option value="Gerente">Gerente</option>}
                    </select>
                  </div>
                  <Button type="submit" className="md:col-span-3 bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#120108] font-bold h-12 uppercase">Registrar Nuevo Miembro</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staffList?.map((staff) => {
              const { avgRating, displayTime } = getStaffStats(staff.id)
              const isStaffOwner = staff.role === 'Dueño' || OWNER_WHITELIST.includes(staff.email)
              const isStaffAdmin = staff.role === 'Gerente' || ADMIN_WHITELIST.includes(staff.email)
              
              return (
                <Card key={staff.id} className="bg-[#1a020c] border-white/5 hover:border-[#00F0FF]/20 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-lg">{staff.name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isStaffOwner ? 'text-[#00F0FF]' : (isStaffAdmin ? 'text-yellow-400' : 'text-[#FF008A]')}`}>
                          {staff.role}
                        </p>
                        <p className="text-[9px] text-white/40 mt-1">{staff.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-yellow-500 font-bold"><Star className="w-3 h-3 fill-yellow-500" /> {avgRating}</div>
                        {staff.activeSession && <div className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full animate-pulse font-bold">En turno</div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                      <div className="text-center">
                        <p className="text-[9px] uppercase text-[#B0B0B0] mb-1">Tiempo Semanal</p>
                        <p className="text-xl font-headline font-bold text-[#FF008A]">{displayTime}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] uppercase text-[#B0B0B0] mb-1">Reseñas</p>
                        <p className="text-xl font-headline font-bold text-[#00F0FF]">
                          {allRatings?.filter(r => r.staffId === staff.id).length || 0}
                        </p>
                      </div>
                    </div>
                    {isActualOwner && !OWNER_WHITELIST.includes(staff.email) && (
                      <Button 
                        onClick={async () => { if(confirm("¿Eliminar acceso de este miembro?")) await deleteDoc(doc(db!, "staff_members", staff.id)) }} 
                        variant="ghost" size="sm" className="w-full mt-4 text-destructive hover:bg-destructive/10">Dar de Baja</Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-[#120108]/95 backdrop-blur-xl border-t border-white/5">
        <Link href="/"><Button variant="ghost" className="text-[#00F0FF] font-bold uppercase text-xs tracking-widest"><ArrowLeft className="mr-2 w-4 h-4" /> Volver al menú del bar pool</Button></Link>
      </footer>
    </div>
  )
}
