"use client"

import { useState } from "react"
import { 
  Image as ImageIcon, 
  Coins, 
  Users, 
  X, 
  Star, 
  Heart 
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

export function QuickActions() {
  const [activeDialog, setActiveDialog] = useState<"tips" | "staff" | null>(null)
  const { toast } = useToast()

  const handleAction = (msg: string) => {
    toast({
      title: "Confirmado",
      description: msg,
    })
    setActiveDialog(null)
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
        <DialogContent className="bg-[#1a020c] border-[#39FF14]/30 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#39FF14] font-headline text-2xl">Calificaciones del Staff</DialogTitle>
            <DialogDescription className="text-[#B0B0B0]">
              Tu opinión nos ayuda a mejorar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { name: "Alex R.", role: "Bartender", rating: 4.9 },
              { name: "Sonia M.", role: "Mesera", rating: 4.8 },
              { name: "Lucas K.", role: "Seguridad", rating: 4.7 }
            ].map((staff) => (
              <div key={staff.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="font-bold text-white">{staff.name}</p>
                  <p className="text-xs text-[#00F0FF] uppercase font-bold">{staff.role}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[#39FF14]">
                    <Star className="w-4 h-4 fill-[#39FF14]" />
                    <span className="font-bold">{staff.rating}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-[#FF008A] hover:text-white rounded-full p-2 h-10 w-10"
                    onClick={() => handleAction(`Gracias por calificar a ${staff.name}`)}
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
