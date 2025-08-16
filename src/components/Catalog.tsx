import React, { useEffect, useMemo, useState } from 'react'
import { PriceList, Product, GroupInfoData } from '../types'
import { sortProducts, SortKey } from '../utils/search'
import ProductCard from './ProductCard'
import GroupInfo from './GroupInfo'
import { useLang } from '../context/Lang'

async function fetchLangJson<T>(baseUrlNoExt: string, lang: 'de' | 'en'): Promise<T> {
  const candidates = [
    `${baseUrlNoExt}.${lang}.json`,
    `${baseUrlNoExt}.de.json`,
    `${baseUrlNoExt}.json`,
  ]
  for (const url of candidates) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } })
      if (r.ok) return (await r.json()) as T
    } catch {}
  }
  throw new Error(`Keine der Dateien gefunden: ${candidates.join(', ')}`)
}

export default function Catalog({ q, sort }: { q: string; sort: SortKey }) {
  const { t, lang } = useLang() as any
  const [all, setAll] = useState<Product[]>([])
  const [category, setCategory] = useState<string>('all')
  const [group, setGroup] = useState<string>('all')
  const [groupInfo, setGroupInfo] = useState<GroupInfoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // „Auswählen“-Zustände
  const [catsOpen, setCatsOpen] = useState(false)
  const [grpsOpen, setGrpsOpen] = useState(false)

  const tt = (key: string, fallback: string) => {
    const v = t(key)
    return v === key ? fallback : v
  }

  // Sprachsicheres Label für den Auswählen-Button
  const selectLabel = (() => {
    const tr = t('select')
    if (tr && tr !== 'select') return tr
    return lang === 'de' ? 'Auswählen' : 'Select'
  })()

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const base = import.meta.env.BASE_URL || '/'
        const pl = await fetchLangJson<PriceList>(`${base}data/pricelist`, lang)
        if (!pl?.products) throw new Error('Ungültiges JSON-Format: "products" fehlt')
        if (!alive) return
        setAll(pl.products)

        // GroupInfo (optional)
        try {
          const gi = await fetchLangJson<GroupInfoData>(`${base}data/groupinfo`, lang)
          if (alive) setGroupInfo(gi)
        } catch {
          if (alive) setGroupInfo(null)
        }
      } catch (e: any) {
        if (alive) setError(e?.message ?? String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [lang])

  // Kategorien & Gruppen
  const categories = useMemo(
    () => Array.from(new Set(all.map(p => p.category))).sort(),
    [all]
  )
  const groups = useMemo(() => {
    const base = category === 'all' ? all : all.filter(p => p.category === category)
    return Array.from(new Set(base.map(p => p.group))).sort()
  }, [all, category])

  // Reset beim Wechsel der Kategorie
  useEffect(() => { setGroup('all'); setGrpsOpen(false) }, [category])

  // Filter + Sort
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

  // UI-Helfer
  const Chip = ({ active, children, onClick }:{
    active?: boolean; children: React.ReactNode; onClick: () => void
  }) => (
    <button
      onClick={onClick}
      aria-pressed={!!active}
      className={`px-3 py-1 rounded-full border ${active ? 'bg-slate-900 text-white' : 'border-slate-300 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  )

  if (loading) return <div className="text-slate-500">Lade Daten…</div>
  if (error)   return <div className="text-red-700">Fehler: {error}</div>

  return (
    <div>
      {/* Kategorien-Zeile */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {!catsOpen ? (
          <>
            <Chip active={category === 'all'} onClick={() => { setCategory('all') }}>
              {tt('all', 'Alle')}
            </Chip>
            {category !== 'all' && (
              <Chip active onClick={()=>{ setCatsOpen(true) }}>
                {category}
              </Chip>
            )}
            <button
              className="px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-50"
              onClick={() => setCatsOpen(true)}
            >
              {selectLabel}
            </button>
          </>
        ) : (
          <>
            {/* Auswahl geöffnet: zeige „Alle“ + alle Kategorien; Klick wählt & kollabiert */}
            <Chip active={category === 'all'} onClick={() => { setCategory('all'); setCatsOpen(false) }}>
              {tt('all', 'Alle')}
            </Chip>
            {categories.map(c => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => { setCategory(c); setCatsOpen(false) }}
              >
                {c}
              </Chip>
            ))}
          </>
        )}
      </div>

      {/* Gruppen-Zeile */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {!grpsOpen ? (
          <>
            <Chip active={group === 'all'} onClick={() => { setGroup('all') }}>
              {tt('all_groups', 'Alle Gruppen')}
            </Chip>
            {group !== 'all' && (
              <Chip active onClick={()=>{ setGrpsOpen(true) }}>
                {group}
              </Chip>
            )}
            <button
              className="px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-50"
              onClick={() => setGrpsOpen(true)}
              disabled={groups.length === 0}
              title={groups.length === 0 ? tt('no_groups', 'Keine Gruppen verfügbar') : undefined}
            >
              {selectLabel}
            </button>
          </>
        ) : (
          <>
            <Chip active={group === 'all'} onClick={() => { setGroup('all'); setGrpsOpen(false) }}>
              {tt('all_groups', 'Alle Gruppen')}
            </Chip>
            {groups.map(g => (
              <Chip
                key={g}
                active={group === g}
                onClick={() => { setGroup(g); setGrpsOpen(false) }}
              >
                {g}
              </Chip>
            ))}
          </>
        )}
      </div>

      {/* Gruppenbeschreibung */}
      <GroupInfo data={groupInfo} category={category} group={group} />

      {/* Kartenansicht */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(p => <ProductCard key={p.id} p={p} />)}
        {list.length === 0 && (
          <div className="text-slate-500">
            {tt('no_results', 'Keine Treffer für deine Auswahl.')}
          </div>
        )}
      </div>
    </div>
  )
}
