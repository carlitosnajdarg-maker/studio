
"use client"

import { useState } from "react"
import { 
  Image as ImageIcon, 
  Coins, 
  Users, 
  X, 
  Star, 
  Heart,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, addDoc, serverTimestamp, orderBy } from "firebase/firestore"

export function QuickActions() {
  const db = useFirestore()
  const [activeDialog, setActiveDialog] = useState<"tips" | "staff" | null>(null)
  const { toast } = useToast()
  
  // Obtener staff real de Firestore
  const staffQuery = useMemoFirebase(() => query(collection(db, "staff_members"), orderBy("name", "asc")), [db])
  const { data: staffList, isLoading: isStaffLoading } = useCollection(staffQuery)

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

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1a020c]/80 backdrop-blur-xl border border-white/5 rounded-[50px] p-2 flex gap-2 shadow-2xl">
        <Button 
          variant="ghost" 
          className="rounded-[50px] text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:text-[#00F0FF] flex gap-2 px-5 h-12"
          onClick={() => handleAction("Abriendo galería de imágenes...")}
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

      {/* Tips Dialog */}
      <Dialog open={activeDialog === "tips"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-[#1a020c] border-[#FF008A]/30 text-white rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#FF008A] font-headline text-2xl">Entregar Propina</DialogTitle>
            <DialogDescription className="text-[#B0B0B0]">
              Elige un monto para agradecer la atención.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {[500, 1000, 2000, 5000, 10000, 20000].map((amount) => (
              <Button 
                key={amount}
                onClick={() => handleAction(`Has enviado $${amount.toLocaleString('es-AR')} de propina.`)}
                className="bg-white/5 hover:bg-[#FF008A] border-none text-white font-bold h-16 text-lg"
              >
                ${amount.toLocaleString('es-AR')}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Ratings Dialog */}
      <Dialog open={activeDialog === "staff"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-[#1a020c] border-[#39FF14]/30 text-white rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#39FF14] font-headline text-2xl">Calificaciones del Staff</DialogTitle>
            <DialogDescription className="text-[#B0B0B0]">
              Tu opinión nos ayuda a mejorar nuestro servicio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isStaffLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#39FF14]" />
              </div>
            ) : staffList && staffList.length > 0 ? (
              staffList.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-bold text-white">{staff.name}</p>
                    <p className="text-[10px] text-[#00F0FF] uppercase font-bold tracking-widest">{staff.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateStaff(staff.id, staff.name, star)}
                        className="text-white/20 hover:text-[#39FF14] transition-colors p-1"
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-white/40 italic py-10">No hay personal registrado actualmente.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
