
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
import { collection, addDoc, deleteDoc, doc, query, onSnapshot, orderBy, updateDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ShieldCheck, Clock, Star, UserCircle, Edit2, Upload, Copy, AlertCircle, Play, Pause, Square, UserPlus, Settings2 } from "lucide-react"
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

  // Roles Form states
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleLevel, setNewRoleLevel] = useState("Staff")

  // Queries
  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members"), orderBy("name", "asc")), [db])
  const { data: staffList } = useCollection(staffQuery)

  const rolesQuery = useMemoFirebase(() => query(collection(db, "custom_roles"), orderBy("name", "asc")), [db])
  const { data: customRoles } = useCollection(rolesQuery)

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
      if (file.size > 800 * 1024) {
        toast({ title: "Archivo demasiado grande", description: "Usa una imagen de menos de 800KB.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
        toast({ title: "Foto cargada", description: "La imagen se ha procesado correctamente." })
      }
      reader.readAsDataURL(file)
    }
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
        toast({ title: "Producto actualizado" })
      } else {
        await addDoc(collection(db, "menu"), { ...itemData, createdAt: serverTimestamp() })
        toast({ title: "Producto añadido" })
      }
      resetMenuForm()
    } catch (e) {
      toast({ title: "Error", description: "No tienes permisos suficientes.", variant: "destructive" })
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
        toast({ title: "Personal registrado" })
      }
      resetStaffForm()
    } catch (e) {
      toast({ title: "Error al guardar staff", variant: "destructive" })
    }
  }

  const resetStaffForm = () => {
    setEditingStaffId(null); setStaffName(""); setStaffEmail(""); setStaffRole("Bartender")
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isActualOwner) return
    try {
      await addDoc(collection(db, "custom_roles"), { name: newRoleName, level: newRoleLevel })
      toast({ title: "Rango creado", description: `${newRoleName} añadido al sistema.` })
      setNewRoleName("")
    } catch (e) {
      toast({ title: "Error al crear rango", variant: "destructive" })
    }
  }

  // --- Sistema de Reloj (Start/Pause/Finish) ---
  
  const handleStartWork = async () => {
    if (!db || !staffProfile) return
    await updateDoc(doc(db, "staff_members", staffProfile.id), {
      activeSession: { 
        startTime: new Date().toISOString(),
        status: "active",
        totalPausedMinutes: 0
      }
    })
    toast({ title: "Turno iniciado", description: "¡Buena jornada!" })
  }

  const handlePauseWork = async () => {
    if (!db || !staffProfile || !staffProfile.activeSession) return
    const isPaused = staffProfile.activeSession.status === "paused"
    
    if (!isPaused) {
      // Entrar en pausa
      await updateDoc(doc(db, "staff_members", staffProfile.id), {
        "activeSession.status": "paused",
        "activeSession.pauseStartTime": new Date().toISOString()
      })
      toast({ title: "Pausa iniciada" })
    } else {
      // Reanudar
      const pauseStart = new Date(staffProfile.activeSession.pauseStartTime)
      const now = new Date()
      const pausedMins = Math.round((now.getTime() - pauseStart.getTime()) / 60000)
      const currentTotalPaused = staffProfile.activeSession.totalPausedMinutes || 0
      
      await updateDoc(doc(db, "staff_members", staffProfile.id), {
        "activeSession.status": "active",
        "activeSession.pauseStartTime": null,
        "activeSession.totalPausedMinutes": currentTotalPaused + pausedMins
      })
      toast({ title: "Pausa terminada", description: `Descanso de ${pausedMins} min.` })
    }
  }

  const handleFinishWork = async () => {
    if (!db || !staffProfile || !staffProfile.activeSession) return
    const start = new Date(staffProfile.activeSession.startTime)
    const end = new Date()
    const pausedMins = staffProfile.activeSession.totalPausedMinutes || 0
    
    // Si estaba pausado al terminar, sumar la pausa actual
    let extraPause = 0
    if (staffProfile.activeSession.status === "paused") {
      const pauseStart = new Date(staffProfile.activeSession.pauseStartTime)
      extraPause = Math.round((end.getTime() - pauseStart.getTime()) / 60000)
    }

    const totalMins = Math.round((end.getTime() - start.getTime()) / 60000)
    const effectiveMins = totalMins - (pausedMins + extraPause)

    await addDoc(collection(db, "work_logs"), {
      staffId: staffProfile.id,
      startTime: staffProfile.activeSession.startTime,
      endTime: end.toISOString(),
      durationMinutes: effectiveMins,
      pausedMinutes: pausedMins + extraPause
    })
    await updateDoc(doc(db, "staff_members", staffProfile.id), { activeSession: null })
    toast({ title: "Turno finalizado", description: `Trabajado: ${Math.floor(effectiveMins/60)}h ${effectiveMins%60}m.` })
  }

  const getStaffStats = (staffId: string) => {
    const ratings = allRatings?.filter(r => r.staffId === staffId) || []
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b.score, 0) / ratings.length).toFixed(1) : "N/A"
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const mins = allLogs?.filter(l => l.staffId === staffId && new Date(l.startTime) > weekAgo)
      .reduce((a, b) => a + (b.durationMinutes || 0), 0) || 0
    return { avg, time: `${Math.floor(mins/60)}h ${mins%60}m` }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-[#120108] text-[#FF008A] font-bold">CONECTANDO...</div>

  if (!user || (!isActualAdmin && !staffProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#120108] p-5">
        <Card className="w-full max-w-md bg-[#1a020c] border-[#FF008A]/30 text-white">
          <CardHeader className="text-center">
            <ShieldCheck className="w-12 h-12 text-[#FF008A] mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline uppercase">Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-center">
            <p className="text-sm text-[#B0B0B0]">Identifícate para entrar al panel de Mr. Smith.</p>
            {!user ? (
              <Button onClick={handleLogin} className="bg-[#FF008A] h-14 font-bold text-lg">Entrar con Google</Button>
            ) : (
              <div className="space-y-4">
                <p className="text-red-400 text-xs">El correo {user.email} no tiene permisos.</p>
                <Button onClick={() => signOut(auth)} variant="outline">Cerrar Sesión</Button>
              </div>
            )}
            <div className="mt-4 p-4 bg-white/5 rounded-xl text-left border border-white/10">
              <p className="text-[10px] font-bold text-[#00F0FF] uppercase mb-2">Paso 1: Autorizar Dominio</p>
              <div className="flex gap-2 items-center bg-black/40 p-2 rounded border border-white/10 mb-2">
                <code className="text-[9px] flex-1 truncate">{typeof window !== 'undefined' ? window.location.hostname : ''}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                  navigator.clipboard.writeText(window.location.hostname)
                  toast({ title: "Copiado", description: "Pega este dominio en la consola de Firebase." })
                }}><Copy className="w-3 h-3" /></Button>
              </div>
              <Link href="https://console.firebase.google.com/" target="_blank">
                <Button variant="link" className="text-[#FF008A] text-[10px] p-0 h-auto">Ir a Consola Firebase →</Button>
              </Link>
            </div>
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
              {isActualOwner ? 'Panel Dueño' : (staffProfile?.role === 'Gerente' ? 'Panel Gerencia' : 'Acceso Staff')}
            </h1>
            <p className="text-[9px] text-[#B0B0B0] font-bold uppercase">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {staffProfile && (
            <div className="flex items-center gap-2">
              {!staffProfile.activeSession ? (
                <Button onClick={handleStartWork} size="sm" className="bg-green-600 hover:bg-green-700 font-bold">
                  <Play className="w-4 h-4 mr-2" /> Iniciar
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button onClick={handlePauseWork} size="sm" variant="outline" className="border-yellow-500 text-yellow-500 font-bold">
                    {staffProfile.activeSession.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                  <Button onClick={handleFinishWork} size="sm" variant="destructive" className="font-bold">
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          <Button onClick={() => signOut(auth)} size="icon" variant="ghost" className="rounded-full hover:bg-white/5"><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <Tabs defaultValue="menu">
        <TabsList className="flex flex-wrap h-auto w-full bg-[#1a020c] mb-6 p-1 border border-white/5 gap-1">
          <TabsTrigger value="menu" className="flex-1 uppercase font-bold text-[10px] data-[state=active]:bg-[#FF008A]">Menú</TabsTrigger>
          <TabsTrigger value="staff" className="flex-1 uppercase font-bold text-[10px] data-[state=active]:bg-[#00F0FF] data-[state=active]:text-[#120108]">Personal</TabsTrigger>
          {isActualOwner && <TabsTrigger value="roles" className="flex-1 uppercase font-bold text-[10px] data-[state=active]:bg-purple-600">Rangos</TabsTrigger>}
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          <Card className="bg-[#1a020c] border-[#FF008A]/30">
            <CardHeader>
              <CardTitle className="text-lg font-headline uppercase text-[#FF008A] flex justify-between items-center">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                {editingId && <Button variant="ghost" size="sm" onClick={resetMenuForm} className="text-white/40">Cancelar</Button>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveItem} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1"><Label className="text-[10px] uppercase text-[#B0B0B0]">Nombre</Label><Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-[#B0B0B0]">Categoría</Label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#120108] border border-white/10 rounded-md h-10 px-3 text-sm text-white">
                    <option value="Tragos">Tragos</option><option value="Bebidas c/ Alcohol">Bebidas c/ Alcohol</option><option value="Bebidas s/ Alcohol">Bebidas s/ Alcohol</option><option value="Comidas">Comidas</option><option value="Fichas">Fichas</option>
                  </select>
                </div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-[#B0B0B0]">Precio ($)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-[#B0B0B0]">Imagen</Label>
                  <div className="flex gap-2">
                    <Input value={imageUrl.startsWith('data:') ? "Cargado local" : imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10" />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0 border-[#00F0FF]/30 text-[#00F0FF]"><Upload className="w-4 h-4" /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1"><Label className="text-[10px] uppercase text-[#B0B0B0]">Descripción</Label><Input value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-white/10" /></div>
                <Button type="submit" className="md:col-span-2 bg-[#FF008A] hover:bg-[#FF008A]/80 font-bold uppercase py-6 shadow-[0_0_15px_rgba(255,0,138,0.4)]">
                  {editingId ? 'Guardar Cambios' : 'Publicar'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {menuItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-[#1a020c] rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                    <Image src={item.imageUrl} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-[10px] text-[#00F0FF] font-bold">${item.price.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button onClick={() => handleEditItem(item)} variant="ghost" size="icon" className="h-9 w-9 text-white/40 hover:text-[#00F0FF]"><Edit2 className="w-4 h-4" /></Button>
                  {isActualAdmin && <Button onClick={async () => { if(confirm(`¿Eliminar ${item.title}?`)) await deleteDoc(doc(db!, "menu", item.id)) }} variant="ghost" size="icon" className="h-9 w-9 text-white/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {isActualAdmin && (
            <Card className="bg-[#1a020c] border-[#00F0FF]/30">
              <CardHeader><CardTitle className="text-lg font-headline uppercase text-[#00F0FF]">{editingStaffId ? 'Editar Personal' : 'Alta de Personal'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSaveStaff} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1"><Label className="text-[10px] uppercase text-[#B0B0B0]">Nombre</Label><Input value={staffName} onChange={e => setStaffName(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase text-[#B0B0B0]">Email de Google</Label><Input value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase text-[#B0B0B0]">Rango</Label>
                    <select value={staffRole} onChange={e => setStaffRole(e.target.value)} className="w-full bg-[#120108] border border-white/10 rounded-md h-10 px-3 text-sm text-white">
                      <option value="Bartender">Bartender</option><option value="Mesero">Mesero</option><option value="Seguridad">Seguridad</option><option value="Gerente">Gerente</option>
                      {isActualOwner && <option value="Dueño">Dueño</option>}
                      {customRoles?.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <Button type="submit" className="md:col-span-3 bg-[#00F0FF] text-[#120108] font-bold uppercase py-6 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                    {editingStaffId ? 'Guardar Cambios' : 'Registrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {staffList?.map(staff => {
              const { avg, time } = getStaffStats(staff.id)
              const session = staff.activeSession
              return (
                <Card key={staff.id} className="bg-[#1a020c] border-white/5 overflow-hidden">
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{staff.name}</p>
                          {isActualAdmin && <button onClick={() => { setEditingStaffId(staff.id); setStaffName(staff.name); setStaffEmail(staff.email); setStaffRole(staff.role); }} className="text-white/20 hover:text-[#00F0FF]"><Edit2 className="w-3.5 h-3.5" /></button>}
                        </div>
                        <p className="text-[9px] font-bold text-[#FF008A] uppercase">{staff.role}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><Star className="w-3.5 h-3.5 fill-current" /> {avg}</div>
                        {session && (
                          <div className={`text-[8px] ${session.status === 'paused' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'} px-2 py-0.5 rounded-full mt-1 font-bold`}>
                            {session.status === 'paused' ? 'EN PAUSA' : 'ACTIVO'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                      <div className="text-center"><p className="text-[8px] uppercase text-[#B0B0B0] font-bold">Semana</p><p className="font-headline font-bold text-[#FF008A] text-sm">{time}</p></div>
                      <div className="text-center"><p className="text-[8px] uppercase text-[#B0B0B0] font-bold">Reseñas</p><p className="font-headline font-bold text-[#00F0FF] text-sm">{allRatings?.filter(r => r.staffId === staff.id).length || 0}</p></div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {isActualOwner && (
          <TabsContent value="roles" className="space-y-6">
            <Card className="bg-[#1a020c] border-purple-600/30">
              <CardHeader><CardTitle className="text-lg font-headline uppercase text-purple-600">Crear Rango Personalizado</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRole} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre del Rango</Label><Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Ej: DJ, Cajero" required className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Nivel de Acceso</Label>
                    <select value={newRoleLevel} onChange={e => setNewRoleLevel(e.target.value)} className="w-full bg-[#120108] border border-white/10 rounded-md h-10 px-3 text-sm text-white">
                      <option value="Staff">Acceso Staff (Sólo Tiempo)</option><option value="Gerente">Acceso Gerencia (Editar Menú)</option><option value="Dueño">Acceso Dueño (Control Total)</option>
                    </select>
                  </div>
                  <Button type="submit" className="md:col-span-2 bg-purple-600 hover:bg-purple-700 font-bold uppercase"><Plus className="w-4 h-4 mr-2" /> Crear Rango</Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-2">
              {customRoles?.map(role => (
                <div key={role.id} className="flex items-center justify-between p-3 bg-[#1a020c] rounded-xl border border-white/5">
                  <div>
                    <p className="font-bold text-white">{role.name}</p>
                    <p className="text-[10px] text-purple-400 font-bold uppercase">{role.level}</p>
                  </div>
                  <Button onClick={async () => { if(confirm(`¿Eliminar rango ${role.name}?`)) await deleteDoc(doc(db!, "custom_roles", role.id)) }} variant="ghost" size="icon" className="text-white/20 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
