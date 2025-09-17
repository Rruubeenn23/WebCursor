'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

type ExternalExercise = { external_id: string; source: 'wger'; name: string; description: string; category: string | null; muscles: any[]; payload: any }
type FavoriteExercise = { id: string; external_id: string | null; source: string | null; payload: any | null }

export default function ExercisesExplorer() {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [external, setExternal] = useState<ExternalExercise[]>([])
  const [favorites, setFavorites] = useState<FavoriteExercise[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=> { const t = setTimeout(()=> setDebounced(term.trim()), 350); return ()=> clearTimeout(t) }, [term])
  useEffect(()=> { refreshFavorites() }, [])
  useEffect(()=>{
    if(!debounced){ setExternal([]); return }
    setLoading(true)
    fetch(`/api/external/exercises?q=${encodeURIComponent(debounced)}`)
      .then(r=> r.json()).then(j=> setExternal(j.data ?? [])).finally(()=> setLoading(false))
  }, [debounced])

  function refreshFavorites(){ fetch('/api/favorites/exercises').then(r=> r.json()).then(j=> setFavorites(j.data ?? [])) }
  async function fav(item: ExternalExercise){ await fetch('/api/favorites/exercises', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ external_id: item.external_id, source: item.source, payload: item })}); refreshFavorites() }
  async function unfav(id:string){ await fetch(`/api/favorites/exercises?id=${id}`, { method:'DELETE' }); refreshFavorites() }

  const canSearch = useMemo(()=> term.trim().length>=2, [term])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Buscar ejercicio... (mínimo 2 letras)" value={term} onChange={e=> setTerm(e.target.value)} />
        <Button disabled={!canSearch} onClick={()=> setDebounced(term.trim())}>Buscar</Button>
      </div>
      <Tabs defaultValue="favorites">
        <TabsList>
          <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          <TabsTrigger value="external">Externo</TabsTrigger>
        </TabsList>
        <TabsContent value="favorites">
          {favorites.length===0 ? <div className="text-sm text-muted-foreground">No tienes favoritos aún.</div> : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favorites.map(f=>{
                const p = f.payload ?? {}
                const name = p.name || 'Ejercicio'
                const category = p.category || '—'
                return (
                  <li key={f.id} className="rounded border p-3">
                    <div className="font-medium leading-tight">{name}</div>
                    <div className="text-xs text-muted-foreground">{category}</div>
                    <div className="mt-2"><Button variant="ghost" onClick={()=> unfav(f.id)}>Quitar</Button></div>
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
              {external.map(e=> (
                <li key={e.external_id} className="rounded border p-3">
                  <div className="font-medium leading-tight">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.category || '—'}</div>
                  <div className="prose prose-sm max-w-none mt-2 text-sm" dangerouslySetInnerHTML={{ __html: e.description || '' }} />
                  <div className="mt-2"><Button variant="ghost" onClick={()=> fav(e)}>★ Favorito</Button></div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
