import React, { useEffect, useMemo, useState } from 'react'
import { PriceList, Product, GroupInfoData } from '../types'
import { sortProducts, SortKey } from '../utils/search'
import ProductCard from './ProductCard'
import GroupInfo from './GroupInfo'

export default function Catalog({ q, sort }: { q: string; sort: SortKey }) {
  const [all, setAll] = useState<Product[]>([])
  const [category, setCategory] = useState<string>('all')
  const [group, setGroup] = useState<string>('all')
  const [groupInfo, setGroupInfo] = useState<GroupInfoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const pr = await fetch(`${base}data/pricelist.json`, { headers: { Accept: 'application/json' } })
        if (!pr.ok) throw new Error(`Daten nicht gefunden (${pr.status})`)
        const pl = (await pr.json()) as PriceList
        if (!pl?.products) throw new Error('Ungültiges JSON-Format: "products" fehlt')
        setAll(pl.products)

        const gi = await fetch(`${base}data/groupinfo.json`, { headers: { Accept: 'application/json' } })
        if (gi.ok) setGroupInfo((await gi.json()) as GroupInfoData)
      } catch (e:any) { setError(e?.message ?? String(e)) }
      finally { setLoading(false) }
    })()
  }, [])

  const categories = useMemo(() => Array.from(new Set(all.map(p => p.category))).sort(), [all])
  const groups = useMemo(() => {
    const base = category === 'all' ? all : all.filter(p => p.category === category)
    return Array.from(new Set(base.map(p => p.group))).sort()
  }, [all, category])

  useEffect(() => { setGroup('all') }, [category])

  const list = useMemo(() => {
    const qLow = q.trim().toLowerCase()
    let L = all
    if (category !== 'all') L = L.filter(p => p.category === category)
    if (group !== 'all')    L = L.filter(p => p.group === group)
    if (qLow) {
      L = L.filter(p =>
        [p.typ || '', p.name, p.group, p.category, ...(p.tags ?? []), p.short ?? '']
        .join(' ').toLowerCase().includes(qLow)
      )
    }
    return sortProducts(L, sort)
  }, [all, q, category, group, sort])

  if (loading) return <div className="text-slate-500">Lade Daten…</div>
  if (error)   return <div className="text-red-700">Fehler: {error}</div>

  return (
    <div>
      {/* Kategorie-Chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        <button onClick={() => setCategory('all')} className={`px-3 py-1 rounded-full border ${category==='all'?'bg-slate-900 text-white':'border-slate-300'}`}>Alle</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full border ${category===c?'bg-slate-900 text-white':'border-slate-300'}`}>{c}</button>
        ))}
      </div>

      {/* Gruppen-Chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setGroup('all')} className={`px-3 py-1 rounded-full border ${group==='all'?'bg-slate-900 text-white':'border-slate-300'}`}>Alle Gruppen</button>
        {groups.map(g => (
          <button key={g} onClick={() => setGroup(g)} className={`px-3 py-1 rounded-full border ${group===g?'bg-slate-900 text-white':'border-slate-300'}`}>{g}</button>
        ))}
      </div>

      {/* Gruppenbeschreibung */}
      <GroupInfo data={groupInfo} category={category} group={group} />

      {/* Kartenansicht */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(p => <ProductCard key={p.id} p={p} />)}
        {list.length === 0 && (<div className="text-slate-500">Keine Treffer für deine Auswahl.</div>)}
      </div>
    </div>
  )
}
