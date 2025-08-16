import React, { useEffect, useState } from 'react'
import { LaborCost, LaborData } from '../types'
import { fmtEUR } from '../utils/format'
import { useCart } from '../context/CartContext'
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

export default function LaborCatalog(){
  const { t, lang } = useLang() as any
  const [all, setAll] = useState<LaborCost[]>([])
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [days, setDays] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const { addLaborMany } = useCart()

  useEffect(()=>{
    let alive = true
    ;(async () => {
      setError(null)
      try {
        const base = import.meta.env.BASE_URL || '/'
        const data = await fetchLangJson<LaborData>(`${base}data/labor`, lang)
        if (!alive) return
        setAll(data.items)
        const d: Record<string, number> = {}
        for (const it of data.items) d[it.id] = it.avgDays
        setDays(d)
      } catch (e:any) { if (alive) setError(e?.message ?? String(e)) }
    })()
    return () => { alive = false }
  }, [lang])

  const toggle = (id: string) => setSel(prev => ({ ...prev, [id]: !prev[id] }))

  const addSelected = () => {
    const rows = all.filter(a => sel[a.id]).map(a => ({ cost: a, days: days[a.id] ?? a.avgDays }))
    if (rows.length === 0) return
    addLaborMany(rows)
    setSel({})
  }

  if (error) return <div className="text-red-700">Fehler beim Laden der Arbeitskosten: {error}</div>

  return (
    <div className="space-y-3">
      {all.map(a => (
        <div
          key={a.id}
          className="rounded-2xl border bg-white p-4 md:grid md:gap-3 md:items-center md:grid-cols-[1fr_auto_auto]"
        >
          {/* Zeile 1 (immer sichtbar): Checkbox + Titel + Meta */}
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={!!sel[a.id]}
              onChange={()=>toggle(a.id)}
              className="mt-[2px]"
            />
            <div>
              <div className="font-medium leading-tight">{a.title}</div>
              <div className="text-xs text-slate-500">
                {a.category}{a.group ? ` · ${a.group}` : ''}{a.machine ? ` · ${a.machine}` : ''}
              </div>
            </div>
          </label>

          {/* --- Mobile (unter md): Zeile 2 kombiniert (Info links, Tage rechts) --- */}
          <div className="mt-3 md:hidden flex items-center justify-between gap-3 w-full">
            <div className="text-sm text-slate-700">
              <div>∅ {a.avgDays} {t('days')}</div>
              <div>{t('price_per_day')}: {fmtEUR(a.dayRateEur)}</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">{t('days')}</label>
              <input
                type="number" min={0} step={1}
                className="w-20 rounded border px-2 py-1 text-right"
                value={days[a.id] ?? a.avgDays}
                onChange={e=> setDays(s=>({ ...s, [a.id]: parseInt(e.target.value || '0') }))}
              />
            </div>
          </div>

          {/* --- Desktop (ab md): getrennte Spalten wie bisher --- */}
          <div className="hidden md:block text-sm text-slate-700 text-right justify-self-end">
            <div>∅ {a.avgDays} {t('days')}</div>
            <div>{t('price_per_day')}: {fmtEUR(a.dayRateEur)}</div>
          </div>

          <div className="hidden md:flex items-center gap-2 justify-self-end md:ml-6">
            <label className="text-sm whitespace-nowrap">{t('days')}</label>
            <input
              type="number" min={0} step={1}
              className="w-24 rounded border px-2 py-1 text-right"
              value={days[a.id] ?? a.avgDays}
              onChange={e=> setDays(s=>({ ...s, [a.id]: parseInt(e.target.value || '0') }))}
            />
          </div>
        </div>
      ))}

      <button className="mt-2 rounded-xl border px-4 py-2" onClick={addSelected}>
        {t('add')}
      </button>
    </div>
  )
}
