'use client'

import { Plus, Utensils, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  onAddFood: () => void
  onQuickAdd: () => void
}

export default function TodayFab({ onAddFood, onQuickAdd }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full p-0 grid place-items-center shadow-xl"
            aria-label="Acciones rápidas"
          >
            {/* Forzamos el color del icono y un trazo más grueso para que se vea siempre */}
            <Plus className="h-7 w-7 text-white" strokeWidth={3} />
          </Button>
        </DropdownMenuTrigger>

        {/* Abrimos el menú hacia arriba y separado para que no tape el FAB */}
        <DropdownMenuContent
          side="top"
          align="end"
          sideOffset={14}
          alignOffset={-4}
          className="rounded-xl shadow-2xl p-1 w-48"
        >
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-3 py-2"
            onClick={onAddFood}
          >
            <Utensils className="mr-2 h-4 w-4" />
            <span>Añadir alimento</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-3 py-2"
            onClick={onQuickAdd}
          >
            <Flame className="mr-2 h-4 w-4" />
            <span>Entrada rápida</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
