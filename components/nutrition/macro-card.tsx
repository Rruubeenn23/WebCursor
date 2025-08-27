'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MacroGoals, calculateProgress } from '@/lib/utils'

interface MacroCardProps {
  goals: MacroGoals
  consumed: MacroGoals
  title?: string
  className?: string
}

export function MacroCard({ goals, consumed, title = "Macros del día", className }: MacroCardProps) {
  const remaining = {
    kcal: Math.max(0, goals.kcal - consumed.kcal),
    protein: Math.max(0, goals.protein - consumed.protein),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fat: Math.max(0, goals.fat - consumed.fat),
  }

  const progress = {
    kcal: calculateProgress(consumed.kcal, goals.kcal),
    protein: calculateProgress(consumed.protein, goals.protein),
    carbs: calculateProgress(consumed.carbs, goals.carbs),
    fat: calculateProgress(consumed.fat, goals.fat),
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calories */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Calorías</span>
            <span className="font-medium">
              {consumed.kcal} / {goals.kcal} kcal
            </span>
          </div>
          <Progress value={progress.kcal} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Restantes: {remaining.kcal} kcal
          </div>
        </div>

        {/* Protein */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Proteína</span>
            <span className="font-medium">
              {consumed.protein}g / {goals.protein}g
            </span>
          </div>
          <Progress value={progress.protein} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Restantes: {remaining.protein}g
          </div>
        </div>

        {/* Carbs */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Carbohidratos</span>
            <span className="font-medium">
              {consumed.carbs}g / {goals.carbs}g
            </span>
          </div>
          <Progress value={progress.carbs} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Restantes: {remaining.carbs}g
          </div>
        </div>

        {/* Fat */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Grasas</span>
            <span className="font-medium">
              {consumed.fat}g / {goals.fat}g
            </span>
          </div>
          <Progress value={progress.fat} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Restantes: {remaining.fat}g
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
