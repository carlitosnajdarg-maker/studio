
"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { isAdmin, isOwner } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, addDoc, deleteDoc, doc, query, onSnapshot, orderBy, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash2, ShieldCheck, Clock, Star, UserCircle, Edit2, Upload, Play, Pause, Square, Timer, Globe, AlertTriangle, Copy, Rocket } from "lucide-react"
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
  
  // Form states
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Tragos")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const [staffName, setStaffName] = useState("")
  const [staffEmail, setStaffEmail] = useState("")
  const [staffRole, setStaffRole] = useState("Bartender")

  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleLevel, setNewRoleLevel] = useState("Staff")

  const [elapsedTime, setElapsedTime] = useState("00:00:00")

  // Queries
  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members"), orderBy("name", "asc")), [db])
  const { data: staffList } = useCollection(staffQuery)

  const rolesQuery = useMemoFirebase(() => query(collection(db, "custom_roles"), orderBy("name", "asc")), [db])
  const { data: customRoles } = useCollection(rolesQuery)

  const ratingsQuery = useMemoFirebase(() => query(collection(db, "ratings")), [db])
  const { data: allRatings } = useCollection(ratingsQuery)

  const logsQuery = useMemoFirebase(() => query(collection(db, "work_logs"), orderBy("startTime", "desc")), [db])
  const { data: allLogs } = useCollection(logsQuery)

  const staffProfile = staffList?.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase())
  const isActualOwner = isOwner(user?.email) || staffProfile?.role === 'Dueño'
  const isActualAdmin = isAdmin(user?.email) || staffProfile?.role === 'Gerente' || isActualOwner

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (staffProfile?.activeSession && staffProfile.activeSession.status === "active") {
      interval = setInterval(() => {
        const start = new Date(staffProfile.activeSession.startTime).getTime();
        const now = new Date().getTime();
        const paused = (staffProfile.activeSession.totalPausedMinutes || 0) * 60000;
        const diff = now - start - paused;
        
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
      }, 1000);
    } else if (staffProfile?.activeSession?.status === "paused") {
      setElapsedTime("PAUSADO");
    } else {
      setElapsedTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [staffProfile]);

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
      toast({ title: "Error de login", description: "Verifica los dominios autorizados.", variant: "destructive" })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 800 * 1024) {
        toast({ title: "Archivo grande", description: "Máximo 800KB.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
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
        toast({ title: "Actualizado" })
      } else {
        await addDoc(collection(db, "menu"), { ...itemData, createdAt: serverTimestamp() })
        toast({ title: "Añadido" })
      }
      resetMenuForm()
    } catch (e) {
      toast({ title: "Error de permisos", variant: "destructive" })
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
      toast({ title: "Rango creado" })
      setNewRoleName("")
    } catch (e) {
      toast({ title: "Error al crear rango", variant: "destructive" })
    }
  }

  const handleStartWork = async () => {
    if (!db || !staffProfile) return
    await updateDoc(doc(db, "staff_members", staffProfile.id), {
      activeSession: { 
        startTime: new Date().toISOString(),
        status: "active",
        totalPausedMinutes: 0
      }
    })
    toast({ title: "Turno iniciado" })
  }

  const handlePauseWork = async () => {
    if (!db || !staffProfile || !staffProfile.activeSession) return
    const isPaused = staffProfile.activeSession.status === "paused"
    
    if (!isPaused) {
      await updateDoc(doc(db, "staff_members", staffProfile.id), {
        "activeSession.status": "paused",
        "activeSession.pauseStartTime": new Date().toISOString()
      })
      toast({ title: "En pausa" })
    } else {
      const pauseStart = new Date(staffProfile.activeSession.pauseStartTime)
      const now = new Date()
      const pausedMins = Math.round((now.getTime() - pauseStart.getTime()) / 60000)
      const currentTotalPaused = staffProfile.activeSession.totalPausedMinutes || 0
      
      await updateDoc(doc(db, "staff_members", staffProfile.id), {
        "activeSession.status": "active",
        "activeSession.pauseStartTime": null,
        "activeSession.totalPausedMinutes": currentTotalPaused + pausedMins
      })
      toast({ title: "Turno reanudado" })
    }
  }

  const handleFinishWork = async () => {
    if (!db || !staffProfile || !staffProfile.activeSession) return
    const start = new Date(staffProfile.activeSession.startTime)
    const end = new Date()
    let pausedMins = staffProfile.activeSession.totalPausedMinutes || 0
    
    if (staffProfile.activeSession.status === "paused") {
      const pauseStart = new Date(staffProfile.activeSession.pauseStartTime)
      pausedMins += Math.round((end.getTime() - pauseStart.getTime()) / 60000)
    }

    const totalMins = Math.round((end.getTime() - start.getTime()) / 60000)
    const effectiveMins = totalMins - pausedMins

    await addDoc(collection(db, "work_logs"), {
      staffId: staffProfile.id,
      staffName: staffProfile.name,
      startTime: staffProfile.activeSession.startTime,
      endTime: end.toISOString(),
      durationMinutes: effectiveMins,
      pausedMinutes: pausedMins,
      createdAt: serverTimestamp()
    })
    await updateDoc(doc(db, "staff_members", staffProfile.id), { activeSession: null })
    toast({ title: "Turno guardado" })
  }

  const getStaffStats = (staffId: string) => {
    const ratings = allRatings?.filter(r => r.staffId === staffId) || []
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b.score, 0) / ratings.length).toFixed(1) : "N/A"
    const mins = allLogs?.filter(l => l.staffId === staffId)
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
            <CardTitle className="text-2xl font-headline uppercase tracking-tighter">Panel de Staff</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-center">
            <p className="text-sm text-[#B0B0B0]">Acceso restringido a personal autorizado.</p>
            {!user ? (
              <Button onClick={handleLogin} className="bg-[#FF008A] h-14 font-bold text-lg neon-glow-magenta w-full">Entrar con Google</Button>
            ) : (
              <div className="space-y-4">
                <p className="text-red-400 text-xs font-bold">Usuario sin acceso: {user.email}</p>
                <Button onClick={() => signOut(auth)} variant="outline" className="w-full">Cerrar Sesión</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#120108] text-white p-5 pb-32 max-w-5xl mx-auto font-body">
      <header className="flex justify-between items-center mb-8 bg-[#1a020c] p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF008A]/20 p-2 rounded-full border border-[#FF008A]/40">
            {isActualOwner ? <ShieldCheck className="w-6 h-6 text-[#00F0FF]" /> : <UserCircle className="w-6 h-6 text-[#FF008A]" />}
          </div>
          <div>
            <h1 className="text-sm font-headline font-bold uppercase text-[#FF008A]">
              {isActualOwner ? 'Dueño Mr. Smith' : (staffProfile?.role === 'Gerente' ? 'Gerencia Mr. Smith' : 'Panel Staff')}
            </h1>
            <p className="text-[10px] text-[#B0B0B0] font-bold">{user.email}</p>
          </div>
        </div>
        <Button onClick={() => signOut(auth)} size="sm" variant="ghost" className="rounded-full text-white/60"><LogOut className="w-4 h-4 mr-2" /> Salir</Button>
      </header>

      {/* RELOJ DE JORNADA - DESTACADO */}
      {staffProfile && (
        <Card className="bg-[#1a020c] border-[#00F0FF]/40 mb-8 neon-glow-cyan overflow-hidden">
          <div className="bg-[#00F0FF]/10 px-6 py-2 border-b border-[#00F0FF]/20 flex justify-between items-center">
            <CardTitle className="text-[10px] font-headline uppercase text-[#00F0FF] flex items-center gap-2 tracking-widest">
              <Timer className="w-4 h-4" /> Reloj de Control de Jornada
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${staffProfile.activeSession ? (staffProfile.activeSession.status === 'paused' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'}`} />
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">
                {staffProfile.activeSession ? (staffProfile.activeSession.status === 'paused' ? 'Turno en Pausa' : 'Turno Activo') : 'Fuera de Turno'}
              </span>
            </div>
          </div>
          <CardContent className="pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left flex-1">
                <p className="text-[10px] uppercase text-[#B0B0B0] font-bold mb-1 tracking-widest">Tiempo de Trabajo Neto</p>
                <p className={`text-6xl font-headline font-bold tracking-widest ${staffProfile.activeSession?.status === 'paused' ? 'text-yellow-500' : 'text-white'}`}>
                  {elapsedTime}
                </p>
                {staffProfile.activeSession?.status === "paused" && (
                  <p className="text-xs text-yellow-500 font-bold uppercase mt-2 bg-yellow-500/10 inline-block px-3 py-1 rounded-full border border-yellow-500/20">⏸ Descanso Iniciado</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                {!staffProfile.activeSession ? (
                  <Button onClick={handleStartWork} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 h-20 px-10 font-bold text-xl uppercase rounded-2xl shadow-xl shadow-green-900/20">
                    <Play className="w-7 h-7 mr-3" /> Iniciar Jornada
                  </Button>
                ) : (
                  <>
                    <Button onClick={handlePauseWork} variant="outline" className="flex-1 md:flex-none border-yellow-500 text-yellow-500 h-20 px-8 font-bold uppercase rounded-2xl text-lg">
                      {staffProfile.activeSession.status === 'paused' ? <Play className="w-6 h-6 mr-3" /> : <Pause className="w-6 h-6 mr-3" />}
                      {staffProfile.activeSession.status === 'paused' ? 'Reanudar' : 'Tomar Descanso'}
                    </Button>
                    <Button onClick={handleFinishWork} variant="destructive" className="flex-1 md:flex-none h-20 px-8 font-bold uppercase rounded-2xl text-lg shadow-xl shadow-red-900/20">
                      <Square className="w-6 h-6 mr-3" /> Terminar Turno
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GUIA DE LANZAMIENTO */}
      {isActualAdmin && (
        <Card className="bg-blue-600/10 border-blue-500/30 mb-8 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-headline uppercase text-blue-400 flex items-center gap-2 tracking-widest">
              <Rocket className="w-4 h-4" /> Lanzamiento de Mr. Smith
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[11px] text-white/70">
            <div className="flex items-start gap-2">
              <div className="bg-blue-500/20 p-1 rounded font-bold">1</div>
              <p>Busca tu URL pública en la pestaña <b>Hosting</b> de Firebase Console (ej: <b>mrsmith.web.app</b>).</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-500/20 p-1 rounded font-bold">2</div>
              <p>Ve a <b>Authentication {' > '} Settings {' > '} Authorized domains</b> y añade esa URL.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-500/20 p-1 rounded font-bold">3</div>
              <p>Si ves la página azul de "Welcome", espera 5 min. ¡Tu menú está reemplazando esa página!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="menu">
        <TabsList className="grid grid-cols-4 h-auto w-full bg-[#1a020c] mb-6 p-1 border border-white/5">
          <TabsTrigger value="menu" className="uppercase font-bold text-[9px] py-2.5 data-[state=active]:bg-[#FF008A]">Menú</TabsTrigger>
          <TabsTrigger value="staff" className="uppercase font-bold text-[9px] py-2.5 data-[state=active]:bg-[#00F0FF] data-[state=active]:text-[#120108]">Personal</TabsTrigger>
          <TabsTrigger value="history" className="uppercase font-bold text-[9px] py-2.5 data-[state=active]:bg-green-600">Historial</TabsTrigger>
          {isActualOwner && <TabsTrigger value="roles" className="uppercase font-bold text-[9px] py-2.5 data-[state=active]:bg-purple-600">Roles</TabsTrigger>}
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          <Card className="bg-[#1a020c] border-[#FF008A]/30">
            <CardHeader><CardTitle className="text-sm font-headline uppercase text-[#FF008A]">Gestionar Productos</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveItem} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre</Label><Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase">Categoría</Label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#120108] border border-white/10 rounded-md h-10 px-3 text-sm text-white">
                    <option value="Tragos">Tragos</option><option value="Bebidas c/ Alcohol">Bebidas c/ Alcohol</option><option value="Bebidas s/ Alcohol">Bebidas s/ Alcohol</option><option value="Comidas">Comidas</option><option value="Fichas">Fichas</option>
                  </select>
                </div>
                <div className="space-y-1"><Label className="text-[10px] uppercase">Precio ($)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase">Imagen (Archivo o Link)</Label>
                  <div className="flex gap-2">
                    <Input value={imageUrl.startsWith('data:') ? "Foto cargada" : imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10" />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0 border-[#00F0FF]/30 text-[#00F0FF]"><Upload className="w-4 h-4" /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1"><Label className="text-[10px] uppercase">Descripción</Label><Input value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-white/10" /></div>
                <Button type="submit" className="md:col-span-2 bg-[#FF008A] hover:bg-[#FF008A]/80 font-bold uppercase py-6">
                  {editingId ? 'Actualizar Producto' : 'Añadir al Menú'}
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
                    <p className="text-[10px] text-[#00F0FF] font-bold">${item.price}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button onClick={() => { setEditingId(item.id); setTitle(item.title); setCategory(item.category); setPrice(item.price.toString()); setDescription(item.description); setImageUrl(item.imageUrl); }} variant="ghost" size="icon" className="h-9 w-9 text-white/40 hover:text-[#00F0FF]"><Edit2 className="w-4 h-4" /></Button>
                  {isActualAdmin && <Button onClick={async () => { if(confirm('¿Eliminar?')) await deleteDoc(doc(db!, "menu", item.id)) }} variant="ghost" size="icon" className="h-9 w-9 text-white/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {isActualAdmin && (
            <Card className="bg-[#1a020c] border-[#00F0FF]/30">
              <CardHeader><CardTitle className="text-sm font-headline uppercase text-[#00F0FF]">Gestión de Personal</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSaveStaff} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre</Label><Input value={staffName} onChange={e => setStaffName(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Email Google</Label><Input value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Rango</Label>
                    <select value={staffRole} onChange={e => setStaffRole(e.target.value)} className="w-full bg-[#120108] border border-white/10 rounded-md h-10 px-3 text-sm text-white">
                      <option value="Bartender">Bartender</option><option value="Mesero">Mesero</option><option value="Gerente">Gerente</option>
                      {isActualOwner && <option value="Dueño">Dueño</option>}
                      {customRoles?.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <Button type="submit" className="md:col-span-3 bg-[#00F0FF] text-[#120108] font-bold uppercase py-6">
                    {editingStaffId ? 'Guardar Cambios' : 'Registrar Nuevo Staff'}
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
                <Card key={staff.id} className="bg-[#1a020c] border-white/5">
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
                            {session.status === 'paused' ? 'PAUSADO' : 'ACTIVO'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                      <div className="text-center"><p className="text-[8px] uppercase text-[#B0B0B0]">Total Semanal</p><p className="font-bold text-[#FF008A] text-sm">{time}</p></div>
                      <div className="text-center"><p className="text-[8px] uppercase text-[#B0B0B0]">Calificaciones</p><p className="font-bold text-[#00F0FF] text-sm">{allRatings?.filter(r => r.staffId === staff.id).length || 0}</p></div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-[#1a020c] border-green-600/30">
            <CardHeader><CardTitle className="text-sm font-headline uppercase text-green-600">Historial de Turnos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allLogs?.map(log => (
                  <div key={log.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 text-[11px]">
                    <div>
                      <p className="font-bold text-white">{log.staffName || 'Staff'}</p>
                      <p className="text-white/40">{new Date(log.startTime).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">{Math.floor(log.durationMinutes/60)}h {log.durationMinutes%60}m</p>
                      <p className="text-[9px] text-yellow-500/60 uppercase">Pausa: {log.pausedMinutes || 0}m</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isActualOwner && (
          <TabsContent value="roles" className="space-y-6">
            <Card className="bg-[#1a020c] border-purple-600/30">
              <CardHeader><CardTitle className="text-sm font-headline uppercase text-purple-600">Niveles Personalizados</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRole} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre del Puesto</Label><Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Ej: DJ, Seguridad" required className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase">Nivel de Acceso</Label>
                    <select value={newRoleLevel} onChange={e => setNewRoleLevel(e.target.value)} className="w-full bg-[#120108] border border-white/10 rounded-md h-10 px-3 text-sm text-white">
                      <option value="Staff">Solo Reloj</option><option value="Gerente">Editar Menú</option><option value="Dueño">Dueño Total</option>
                    </select>
                  </div>
                  <Button type="submit" className="md:col-span-2 bg-purple-600 hover:bg-purple-700 font-bold uppercase shadow-lg"><Plus className="w-4 h-4 mr-2" /> Guardar Rango</Button>
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
                  <Button onClick={async () => { if(confirm('¿Eliminar?')) await deleteDoc(doc(db!, "custom_roles", role.id)) }} variant="ghost" size="icon" className="text-white/20 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
