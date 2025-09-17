'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Image from 'next/image'

type ExternalFood = {
  external_id: string | null
  source: 'openfoodfacts'
  name: string
  brand: string | null
  image: string | null
  per_100g: { kcal: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }
  payload: any
}

type FavoriteFood = { id: string; external_id: string | null; source: string | null; payload: any | null }

export default function FoodsExplorer() {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [external, setExternal] = useState<ExternalFood[]>([])
  const [favorites, setFavorites] = useState<FavoriteFood[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350)
    return () => clearTimeout(t)
  }, [term])

  useEffect(() => { refreshFavorites() }, [])

  useEffect(() => {
    if (!debounced) { setExternal([]); return }
    setLoading(true)
    fetch(`/api/external/foods?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((j) => setExternal(j.data ?? []))
      .finally(() => setLoading(false))
  }, [debounced])

  function refreshFavorites() {
    fetch('/api/favorites/foods').then(r=>r.json()).then(j=> setFavorites(j.data ?? []))
  }

  async function fav(item: ExternalFood) {
    await fetch('/api/favorites/foods', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ external_id: item.external_id, source: item.source, payload: item })})
    refreshFavorites()
  }

  async function unfav(id: string) {
    await fetch(`/api/favorites/foods?id=${id}`, { method:'DELETE' })
    refreshFavorites()
  }

  const canSearch = useMemo(()=> term.trim().length>=2, [term])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Buscar alimento... (mínimo 2 letras)" value={term} onChange={(e)=> setTerm(e.target.value)} />
        <Button disabled={!canSearch} onClick={()=> setDebounced(term.trim())}>Buscar</Button>
      </div>
      <Tabs defaultValue="favorites">
        <TabsList>
          <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          <TabsTrigger value="external">Externo</TabsTrigger>
        </TabsList>
        <TabsContent value="favorites">
          {favorites.length===0 ? (<div className="text-sm text-muted-foreground">No tienes favoritos aún.</div>) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favorites.map(f=>{
              const p = f.payload ?? {}
              const name = p.name || 'Alimento'
              const img = p.image || null
              return (
                <li key={f.id} className="rounded border p-3 flex gap-3 items-center">
                  <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                    {img ? <Image src={img} alt={name} fill className="object-cover" /> : <div className="h-full w-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium leading-tight">{name}</div>
                    <div className="text-xs text-muted-foreground">{p.brand || p.source || ''}</div>
                  </div>
                  <Button variant="ghost" onClick={()=> unfav(f.id)}>Quitar</Button>
                </li>
              )
            })}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="external">
          {loading ? <div className="text-sm">Cargando…</div> : external.length===0 ? (
            <div className="text-sm text-muted-foreground">{canSearch ? 'Sin resultados.' : 'Escribe al menos 2 letras para buscar.'}</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {external.map((p, idx)=> (
              <li key={`${p.external_id}-${idx}`} className="rounded border p-3 flex gap-3 items-center">
                <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                  {p.image ? <Image src={p.image} alt={p.name} fill className="object-cover" /> : <div className="h-full w-full" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium leading-tight">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.brand || '—'}</div>
                  <div className="text-xs">{p.per_100g.kcal ?? '—'} kcal /100g · P {p.per_100g.protein_g ?? '—'} · C {p.per_100g.carbs_g ?? '—'} · G {p.per_100g.fat_g ?? '—'}</div>
                </div>
                <Button variant="ghost" onClick={()=> fav(p)}>★</Button>
              </li>
            ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
