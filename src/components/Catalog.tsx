import React, { useEffect, useMemo, useState } from 'react'
import { PriceList, Product, GroupInfoData } from '../types'
import { sortProducts, SortKey } from '../utils/search'
import ProductCard from './ProductCard'
import GroupInfo from './GroupInfo'
import { useLang } from '../context/Lang'

const VISIBLE_CHIPS = 3

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

  // Chips-Steuerung (Desktop-Logik beibehalten)
  const [catExpanded, setCatExpanded] = useState(false)
  const [grpExpanded, setGrpExpanded] = useState(false)
  const [catPage, setCatPage] = useState(0)
  const [grpPage, setGrpPage] = useState(0)

  const tt = (key: string, fallback: string) => {
    const v = t(key)
    return v === key ? fallback : v
  }

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

  // Reset beim Wechsel
  useEffect(() => { setGroup('all'); setGrpExpanded(false); setGrpPage(0) }, [category])
  useEffect(() => { setCatPage(0) }, [catExpanded, categories.length])
  useEffect(() => { setGrpPage(0) }, [grpExpanded, groups.length])

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

  // Paginierte Chips (eingeklappt)
  const catTotalPages = Math.max(1, Math.ceil(categories.length / VISIBLE_CHIPS))
  const grpTotalPages = Math.max(1, Math.ceil(groups.length / VISIBLE_CHIPS))
  const catSlice = catExpanded
    ? categories
    : categories.slice(catPage * VISIBLE_CHIPS, catPage * VISIBLE_CHIPS + VISIBLE_CHIPS)
  const grpSlice = grpExpanded
    ? groups
    : groups.slice(grpPage * VISIBLE_CHIPS, grpPage * VISIBLE_CHIPS + VISIBLE_CHIPS)

  if (loading) return <div className="text-slate-500">Lade Daten…</div>
  if (error)   return <div className="text-red-700">Fehler: {error}</div>

  return (
    <div>
      {/* Kategorie-Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3 w-full">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1 rounded-full border ${category==='all'?'bg-slate-900 text-white':'border-slate-300'}`}
        >
          {tt('all', 'Alle')}
        </button>

        {catSlice.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full border ${category===c?'bg-slate-900 text-white':'border-slate-300'}`}
          >
            {c}
          </button>
        ))}

        {/* Paging (eingeklappt) – auf Mobile immer in EIGENER Zeile (bricht um) */}
        {!catExpanded && categories.length > VISIBLE_CHIPS && (
          <div className="basis-full flex items-center gap-2 justify-end sm:basis-auto sm:ml-auto">
            <button
              className="px-2 py-1 rounded border text-xs"
              onClick={() => setCatPage(p => Math.max(0, p - 1))}
              disabled={catPage === 0}
              aria-label={t('previous')}
              title={t('previous')}
            >‹</button>
            <div className="text-xs text-slate-500">{t('page')} {catPage+1}/{catTotalPages}</div>
            <button
              className="px-2 py-1 rounded border text-xs"
              onClick={() => setCatPage(p => Math.min(catTotalPages - 1, p + 1))}
              disabled={catPage >= catTotalPages - 1}
              aria-label={t('next')}
              title={t('next')}
            >›</button>
          </div>
        )}

        {/* Toggle – auf Mobile auch in EIGENER Zeile */}
        {categories.length > VISIBLE_CHIPS && (
          <button
            className="underline text-xs basis-full text-right sm:basis-auto sm:text-left sm:ml-2"
            onClick={() => setCatExpanded(v => !v)}
          >
            {catExpanded ? t('show_less') : t('show_more')}
          </button>
        )}
      </div>

      {/* Gruppen-Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
        <button
          onClick={() => setGroup('all')}
          className={`px-3 py-1 rounded-full border ${group==='all'?'bg-slate-900 text-white':'border-slate-300'}`}
        >
          {t('all_groups')}
        </button>

        {grpSlice.map(g => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`px-3 py-1 rounded-full border ${group===g?'bg-slate-900 text-white':'border-slate-300'}`}
          >
            {g}
          </button>
        ))}

        {/* Paging (eingeklappt) – Mobile eigene Zeile, Desktop rechts */}
        {!grpExpanded && groups.length > VISIBLE_CHIPS && (
          <div className="basis-full flex items-center gap-2 justify-end sm:basis-auto sm:ml-auto">
            <button
              className="px-2 py-1 rounded border text-xs"
              onClick={() => setGrpPage(p => Math.max(0, p - 1))}
              disabled={grpPage === 0}
              aria-label={t('previous')}
              title={t('previous')}
            >‹</button>
            <div className="text-xs text-slate-500">{t('page')} {grpPage+1}/{grpTotalPages}</div>
            <button
              className="px-2 py-1 rounded border text-xs"
              onClick={() => setGrpPage(p => Math.min(grpTotalPages - 1, p + 1))}
              disabled={grpPage >= grpTotalPages - 1}
              aria-label={t('next')}
              title={t('next')}
            >›</button>
          </div>
        )}

        {/* Toggle – Mobile eigene Zeile */}
        {groups.length > VISIBLE_CHIPS && (
          <button
            className="underline text-xs basis-full text-right sm:basis-auto sm:text-left sm:ml-2"
            onClick={() => setGrpExpanded(v => !v)}
          >
            {grpExpanded ? t('show_less') : t('show_more')}
          </button>
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
