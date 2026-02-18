"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { isAdmin, isOwner } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, addDoc, deleteDoc, doc, query, onSnapshot, orderBy, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ArrowLeft, ShieldCheck, Clock, Star, Users, UserCircle, Edit2, Upload, Loader2, Info, Copy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AdminPage() {
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  
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
  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members"), orderBy("name", "asc")), [db])
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
    if (user && db) {
      const q = query(collection(db, "menu"), orderBy("createdAt", "desc"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      })
      return () => unsubscribe()
    }
  }, [user, db])

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      toast({ title: "Error de dominio", description: "Debes autorizar este dominio en la consola de Firebase.", variant: "destructive" })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 800 * 1024) { // Limite 800KB para Base64
        toast({ title: "Archivo grande", description: "Usa una imagen de menos de 800KB para mejor rendimiento.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
        toast({ title: "Imagen lista", description: "Foto cargada correctamente." })
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
    try {
      const itemData = {
        title, category, price: Number(price), description, imageUrl: imageUrl || "https://picsum.photos/seed/default/400/500",
        updatedAt: serverTimestamp()
      }

      if (editingId) {
        await updateDoc(doc(db, "menu", editingId), itemData)
        toast({ title: "Actualizado", description: `${title} modificado.` })
      } else {
        await addDoc(collection(db, "menu"), { ...itemData, createdAt: serverTimestamp() })
        toast({ title: "Añadido", description: `${title} en el menú.` })
      }
      resetMenuForm()
    } catch (e) {
      toast({ title: "Sin permiso", description: "Solo staff autorizado puede editar el menú.", variant: "destructive" })
    }
  }

  const resetMenuForm = () => {
    setEditingId(null); setTitle(""); setPrice(""); setDescription(""); setImageUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isActualAdmin) return
    try {
      const staffData = {
        name: staffName, email: staffEmail.toLowerCase(), role: staffRole, updatedAt: serverTimestamp()
      }
      if (editingStaffId) {
        await updateDoc(doc(db, "staff_members", editingStaffId), staffData)
        toast({ title: "Staff actualizado" })
      } else {
        await addDoc(collection(db, "staff_members"), { ...staffData, createdAt: serverTimestamp(), activeSession: null })
        toast({ title: "Staff registrado" })
      }
      resetStaffForm()
    } catch (e) {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const resetStaffForm = () => {
    setEditingStaffId(null); setStaffName(""); setStaffEmail(""); setStaffRole("Bartender")
  }

  const handleClockToggle = async () => {
    if (!db || !staffProfile) return
    if (staffProfile.activeSession) {
      const start = new Date(staffProfile.activeSession.startTime)
      const end = new Date()
      const diffMins = Math.round((end.getTime() - start.getTime()) / 60000)
      await addDoc(collection(db, "work_logs"), {
        staffId: staffProfile.id, startTime: staffProfile.activeSession.startTime,
        endTime: end.toISOString(), durationMinutes: diffMins
      })
      await updateDoc(doc(db, "staff_members", staffProfile.id), { activeSession: null })
      toast({ title: "Salida registrada", description: `${Math.floor(diffMins/60)}h ${diffMins%60}m trabajados.` })
    } else {
      await updateDoc(doc(db, "staff_members", staffProfile.id), {
        activeSession: { startTime: new Date().toISOString() }
      })
      toast({ title: "Entrada registrada" })
    }
  }

  const getStaffStats = (staffId: string) => {
    const ratings = allRatings?.filter(r => r.staffId === staffId) || []
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b.score, 0) / ratings.length).toFixed(1) : "N/A"
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const mins = allLogs?.filter(l => l.staffId === staffId && new Date(l.startTime) > weekAgo)
      .reduce((a, b) => a + (b.durationMinutes || 0), 0) || 0
    return { avg, time: `${Math.floor(mins/60)}h ${mins%60}m` }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-[#120108] text-[#FF008A] font-bold">CARGANDO...</div>

  if (!user || (!isActualAdmin && !staffProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-[#FF008A]/30 text-white">
          <CardHeader className="text-center">
            <ShieldCheck className="w-12 h-12 text-[#FF008A] mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline uppercase">Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-center">
            <p className="text-sm text-[#B0B0B0]">Identifícate para gestionar el bar.</p>
            {!user ? (
              <Button onClick={handleLogin} className="bg-[#FF008A] h-14 font-bold text-lg">Entrar con Google</Button>
            ) : (
              <div className="space-y-4">
                <p className="text-red-400 text-xs">El correo {user.email} no tiene permisos.</p>
                <Button onClick={() => signOut(auth)} variant="outline">Cerrar Sesión</Button>
              </div>
            )}
            <div className="mt-4 p-4 bg-white/5 rounded-xl text-left">
              <p className="text-[10px] font-bold text-[#00F0FF] uppercase mb-2">Paso 1: Autorizar Dominio</p>
              <div className="flex gap-2 items-center bg-black/40 p-2 rounded border border-white/10">
                <code className="text-[9px] flex-1 truncate">{typeof window !== 'undefined' ? window.location.hostname : ''}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                  navigator.clipboard.writeText(window.location.hostname)
                  toast({ title: "Copiado", description: "Pégalo en la consola de Firebase." })
                }}><Copy className="w-3 h-3" /></Button>
              </div>
              <Link href="https://console.firebase.google.com/" target="_blank">
                <Button variant="link" className="text-[#FF008A] text-[10px] p-0 h-auto mt-2">Ir a Consola Firebase →</Button>
              </Link>
            </div>
            <Link href="/" className="text-xs text-[#00F0FF] hover:underline mt-4 inline-block">← Volver al Menú</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#120108] text-white p-5 pb-24 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF008A]/20 p-2 rounded-full border border-[#FF008A]/40">
            {isActualOwner ? <ShieldCheck className="w-6 h-6 text-[#00F0FF]" /> : <UserCircle className="w-6 h-6 text-[#FF008A]" />}
          </div>
          <div>
            <h1 className="text-lg font-headline font-bold uppercase text-[#FF008A]">
              {isActualOwner ? 'Panel Dueño' : (staffProfile?.role === 'Gerente' ? 'Gerencia' : 'Staff')}
            </h1>
            <p className="text-[9px] text-[#B0B0B0] font-bold uppercase">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {staffProfile && (
            <Button onClick={handleClockToggle} variant={staffProfile.activeSession ? "destructive" : "default"} size="sm">
              <Clock className="w-4 h-4 mr-2" />
              {staffProfile.activeSession ? "Salida" : "Entrada"}
            </Button>
          )}
          <Button onClick={() => signOut(auth)} size="icon" variant="ghost" className="rounded-full"><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <Tabs defaultValue="menu">
        <TabsList className="grid w-full grid-cols-2 bg-[#1a020c] mb-6">
          <TabsTrigger value="menu" className="uppercase font-bold text-xs">Menú</TabsTrigger>
          <TabsTrigger value="staff" className="uppercase font-bold text-xs">Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          <Card className="bg-[#1a020c] border-[#FF008A]/30">
            <CardHeader>
              <CardTitle className="text-lg font-headline uppercase text-[#FF008A] flex justify-between">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                {editingId && <Button variant="ghost" size="sm" onClick={resetMenuForm}>X</Button>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveItem} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre</Label><Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-white/5" /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase">Categoría</Label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-sm">
                    <option value="Tragos">Tragos</option><option value="Bebidas c/ Alcohol">Bebidas c/ Alcohol</option><option value="Bebidas s/ Alcohol">Bebidas s/ Alcohol</option><option value="Comidas">Comidas</option><option value="Fichas">Fichas</option>
                  </select>
                </div>
                <div className="space-y-1"><Label className="text-[10px] uppercase">Precio ($)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="bg-white/5" /></div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">Foto</Label>
                  <div className="flex gap-2">
                    <Input value={imageUrl.startsWith('data:') ? "" : imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL..." className="bg-white/5" />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1"><Label className="text-[10px] uppercase">Descripción</Label><Input value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5" /></div>
                <Button type="submit" className="md:col-span-2 bg-[#FF008A] font-bold uppercase">{editingId ? 'Guardar Cambios' : 'Publicar'}</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {menuItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-[#1a020c] rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded overflow-hidden"><Image src={item.imageUrl} alt="" fill className="object-cover" /></div>
                  <div><p className="text-sm font-bold">{item.title}</p><p className="text-[10px] text-[#00F0FF]">${item.price}</p></div>
                </div>
                <div className="flex gap-1">
                  <Button onClick={() => handleEditItem(item)} variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-[#00F0FF]"><Edit2 className="w-3 h-3" /></Button>
                  {isActualAdmin && <Button onClick={async () => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db!, "menu", item.id)) }} variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-red-500"><Trash2 className="w-3 h-3" /></Button>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {isActualAdmin && (
            <Card className="bg-[#1a020c] border-[#00F0FF]/30">
              <CardHeader><CardTitle className="text-lg font-headline uppercase text-[#00F0FF]">{editingStaffId ? 'Editar Staff' : 'Nuevo Staff'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSaveStaff} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre</Label><Input value={staffName} onChange={e => setStaffName(e.target.value)} required className="bg-white/5" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Email Google</Label><Input value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required className="bg-white/5" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Rol</Label>
                    <select value={staffRole} onChange={e => setStaffRole(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-sm">
                      <option value="Bartender">Bartender</option><option value="Mesero">Mesero</option><option value="Seguridad">Seguridad</option>
                      <option value="Gerente">Gerente</option>{isActualOwner && <option value="Dueño">Dueño</option>}
                    </select>
                  </div>
                  <Button type="submit" className="md:col-span-3 bg-[#00F0FF] text-[#120108] font-bold uppercase">{editingStaffId ? 'Guardar Cambios' : 'Registrar'}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staffList?.map(staff => {
              const { avg, time } = getStaffStats(staff.id)
              return (
                <Card key={staff.id} className="bg-[#1a020c] border-white/5 overflow-hidden">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{staff.name}</p>
                          {isActualAdmin && <button onClick={() => { setEditingStaffId(staff.id); setStaffName(staff.name); setStaffEmail(staff.email); setStaffRole(staff.role); }} className="text-white/20 hover:text-[#00F0FF]"><Edit2 className="w-3 h-3" /></button>}
                        </div>
                        <p className="text-[9px] font-bold text-[#FF008A] uppercase">{staff.role}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><Star className="w-3 h-3 fill-current" /> {avg}</div>
                        {staff.activeSession && <div className="text-[8px] bg-green-500/20 text-green-500 px-2 rounded-full animate-pulse">EN TURNO</div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                      <div className="text-center"><p className="text-[8px] uppercase text-[#B0B0B0]">Semana</p><p className="font-headline font-bold text-[#FF008A]">{time}</p></div>
                      <div className="text-center"><p className="text-[8px] uppercase text-[#B0B0B0]">Reseñas</p><p className="font-headline font-bold text-[#00F0FF]">{allRatings?.filter(r => r.staffId === staff.id).length || 0}</p></div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
