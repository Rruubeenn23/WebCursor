'use client'

import React from 'react'

export type MacroGoals = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

interface Props {
  title?: string
  goals: MacroGoals
  consumed: MacroGoals
  planned?: MacroGoals // opcional futuro: para mostrar planificado vs consumido
}

function Line({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.max(0, Math.min(100, goal > 0 ? (value / goal) * 100 : 0))
  const remaining = Math.max(0, Math.round((goal - value) * 10) / 10)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(value * 10) / 10} / {goal} <span className="text-muted-foreground">({remaining} restantes)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded bg-muted/60 overflow-hidden">
        <div
          className="h-2 rounded bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MacroCard({ title = 'Progreso', goals, consumed }: Props) {
  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Consumido vs objetivo del día
        </p>
      </div>

      <div className="space-y-3">
        <Line label="Calorías" value={consumed.kcal} goal={goals.kcal} />
        <Line label="Proteína (g)" value={consumed.protein} goal={goals.protein} />
        <Line label="Carbohidratos (g)" value={consumed.carbs} goal={goals.carbs} />
        <Line label="Grasa (g)" value={consumed.fat} goal={goals.fat} />
      </div>
    </div>
  )
}

export default MacroCard
