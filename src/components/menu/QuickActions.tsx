
"use client"

import { useState, useRef } from "react"
import { 
  Image as ImageIcon, 
  Coins, 
  Users, 
  X, 
  Star, 
  Heart,
  Loader2,
  Camera,
  Send,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore"
import Image from "next/image"

export function QuickActions() {
  const db = useFirestore()
  const [activeDialog, setActiveDialog] = useState<"tips" | "staff" | "gallery" | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para Propina
  const [customTip, setCustomTip] = useState("")

  // Estados para Galería
  const [galleryImage, setGalleryImage] = useState<string | null>(null)
  const [galleryComment, setGalleryComment] = useState("")
  const [isSubmittingGallery, setIsSubmittingGallery] = useState(false)

  // Obtener staff real de Firestore
  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members"), orderBy("name", "asc")), [db])
  const { data: staffList, isLoading: isStaffLoading } = useCollection(staffQuery)

  // Obtener posts de la galería
  const galleryQuery = useMemoFirebase(() => query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(20)), [db])
  const { data: galleryPosts, isLoading: isGalleryLoading } = useCollection(galleryQuery)

  const handleAction = (msg: string) => {
    toast({
      title: "Confirmado",
      description: msg,
    })
    setActiveDialog(null)
  }

  const handleRateStaff = async (staffId: string, staffName: string, score: number) => {
    try {
      await addDoc(collection(db, "ratings"), {
        staffId,
        score,
        createdAt: serverTimestamp(),
        comment: "Calificación rápida desde menú"
      })
      toast({
        title: "¡Gracias!",
        description: `Has calificado a ${staffName} con ${score} estrellas.`,
      })
      setActiveDialog(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación.",
        variant: "destructive"
      })
    }
  }

  const handleCustomTipSubmit = () => {
    if (!customTip || isNaN(Number(customTip))) return
    handleAction(`Has enviado $${Number(customTip).toLocaleString('es-AR')} de propina. ¡Muchas gracias!`)
    setCustomTip("")
  }

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ title: "Archivo muy grande", description: "El límite es 1MB por foto.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setGalleryImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!galleryImage || !galleryComment.trim()) {
      toast({ title: "Faltan datos", description: "Sube una foto y cuenta cómo la pasaste.", variant: "destructive" })
      return
    }

    setIsSubmittingGallery(true)
    try {
      await addDoc(collection(db, "gallery"), {
        imageUrl: galleryImage,
        comment: galleryComment.trim(),
        createdAt: serverTimestamp()
      })
      toast({ title: "¡Gracias por compartir!", description: "Tu momento ya está en el muro de Mr. Smith." })
      setGalleryImage(null)
      setGalleryComment("")
      // No cerramos el diálogo para que el usuario pueda ver su post
    } catch (e) {
      toast({ title: "Error", description: "No se pudo subir tu foto. Intenta de nuevo.", variant: "destructive" })
    } finally {
      setIsSubmittingGallery(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1a020c]/80 backdrop-blur-xl border border-white/5 rounded-[50px] p-2 flex gap-2 shadow-2xl">
        <Button 
          variant="ghost" 
          className="rounded-[50px] text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:text-[#00F0FF] flex gap-2 px-5 h-12"
          onClick={() => setActiveDialog("gallery")}
        >
          <ImageIcon className="w-5 h-5" />
          <span className="hidden sm:inline font-bold">Galería</span>
        </Button>
        <Button 
          variant="ghost" 
          className="rounded-[50px] text-[#FF008A] hover:bg-[#FF008A]/10 hover:text-[#FF008A] flex gap-2 px-5 h-12"
          onClick={() => setActiveDialog("tips")}
        >
          <Coins className="w-5 h-5" />
          <span className="hidden sm:inline font-bold">Propina</span>
        </Button>
        <Button 
          variant="ghost" 
          className="rounded-[50px] text-[#39FF14] hover:bg-[#39FF14]/10 hover:text-[#39FF14] flex gap-2 px-5 h-12"
          onClick={() => setActiveDialog("staff")}
        >
          <Users className="w-5 h-5" />
          <span className="hidden sm:inline font-bold">Staff</span>
        </Button>
      </div>

      {/* Gallery Dialog - Interactive Feed */}
      <Dialog open={activeDialog === "gallery"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-[#120108] border-[#00F0FF]/30 text-white rounded-3xl max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)]">
          <div className="bg-[#1a020c] p-6 border-b border-white/5">
            <DialogTitle className="text-[#00F0FF] font-headline text-2xl uppercase tracking-tighter">Muro de Momentos</DialogTitle>
            <DialogDescription className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Comparte cómo la estás pasando en Mr. Smith</DialogDescription>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Form to post */}
            <form onSubmit={handleGallerySubmit} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-video bg-black/40 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-black/60 hover:border-[#00F0FF]/50 transition-all group overflow-hidden"
              >
                {galleryImage ? (
                  <Image src={galleryImage} alt="Vista previa" fill className="object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-white/20 group-hover:text-[#00F0FF] transition-colors" />
                    <p className="text-[10px] text-white/40 mt-2 font-bold uppercase">Pulsa para subir foto</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleGalleryFileChange} accept="image/*" className="hidden" />
              </div>
              
              <div className="space-y-2">
                <Textarea 
                  placeholder="¿Cómo la estás pasando?" 
                  value={galleryComment}
                  onChange={(e) => setGalleryComment(e.target.value)}
                  className="bg-black/40 border-white/10 h-20 resize-none text-sm rounded-xl focus:border-[#00F0FF]/50"
                  maxLength={150}
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[9px] text-white/20 font-bold uppercase">{galleryComment.length}/150</p>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingGallery || !galleryImage || !galleryComment.trim()}
                    className="bg-[#00F0FF] text-[#120108] font-bold uppercase text-[10px] px-6 h-8 rounded-full shadow-lg shadow-[#00F0FF]/20"
                  >
                    {isSubmittingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar Momentazo"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

            {/* Feed of posts */}
            <div className="space-y-4">
              {isGalleryLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#00F0FF]" /></div>
              ) : galleryPosts && galleryPosts.length > 0 ? (
                galleryPosts.map((post) => (
                  <div key={post.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="relative aspect-square w-full">
                      <Image src={post.imageUrl} alt="" fill className="object-cover" />
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-sm leading-relaxed">{post.comment}</p>
                      <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">
                        {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}) : 'Recién publicado'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Heart className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-xs text-white/30 uppercase font-bold tracking-widest">Nadie ha publicado aún.<br/>¡Sé el primero!</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tips Dialog - Custom Amount Added */}
      <Dialog open={activeDialog === "tips"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-[#1a020c] border-[#FF008A]/30 text-white rounded-3xl max-w-sm p-6 shadow-[0_0_50px_rgba(255,0,138,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-[#FF008A] font-headline text-2xl uppercase tracking-tighter">Entregar Propina</DialogTitle>
            <DialogDescription className="text-[#B0B0B0] text-sm leading-tight">
              Agradecemos mucho tu generosidad. Todo lo recaudado va directo al staff.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-2 py-4">
            {[500, 1000, 2000, 5000, 10000, 20000].map((amount) => (
              <Button 
                key={amount}
                onClick={() => handleAction(`Has enviado $${amount.toLocaleString('es-AR')} de propina. ¡Muchas gracias!`)}
                className="bg-white/5 hover:bg-[#FF008A] border-none text-white font-bold h-12 text-sm rounded-xl transition-all active:scale-95"
              >
                ${amount.toLocaleString('es-AR')}
              </Button>
            ))}
          </div>

          <div className="relative flex flex-col gap-2 mt-2">
            <Label className="text-[10px] uppercase text-white/40 font-bold ml-1">U otro monto personalizado</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF008A] font-bold">$</span>
                <Input 
                  type="number" 
                  value={customTip} 
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="Ej: 3500" 
                  className="bg-black/40 border-white/10 pl-7 h-11 text-lg rounded-xl focus:ring-[#FF008A]/30 focus:border-[#FF008A]"
                />
              </div>
              <Button 
                onClick={handleCustomTipSubmit}
                disabled={!customTip || isNaN(Number(customTip))}
                className="bg-[#FF008A] h-11 px-5 rounded-xl font-bold shadow-lg shadow-[#FF008A]/20 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Ratings Dialog */}
      <Dialog open={activeDialog === "staff"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-[#1a020c] border-[#39FF14]/30 text-white rounded-3xl max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(57,255,20,0.1)]">
          <DialogHeader className="p-4 border-b border-white/5">
            <DialogTitle className="text-[#39FF14] font-headline text-2xl uppercase tracking-tighter">Califica al Staff</DialogTitle>
            <DialogDescription className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">
              Tu opinión ayuda a nuestro equipo a brillar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4">
            {isStaffLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#39FF14]" />
              </div>
            ) : staffList && staffList.length > 0 ? (
              staffList.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                  <div>
                    <p className="font-bold text-white text-lg leading-tight">{staff.name}</p>
                    <p className="text-[10px] text-[#00F0FF] uppercase font-bold tracking-widest">{staff.role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateStaff(staff.id, staff.name, star)}
                        className="text-white/10 hover:text-[#39FF14] transition-all p-1 active:scale-125"
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-white/40 italic py-10 font-bold uppercase text-[10px]">No hay personal registrado en este momento.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
