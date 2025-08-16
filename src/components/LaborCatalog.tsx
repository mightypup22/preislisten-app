import React, { useEffect, useState } from 'react'
import { LaborCost, LaborData } from '../types'
import { fmtEUR } from '../utils/format'
import { useCart } from '../context/CartContext'

export default function LaborCatalog(){
  const [all, setAll] = useState<LaborCost[]>([])
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [days, setDays] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const { addLaborMany } = useCart()

  useEffect(()=>{
    (async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const r = await fetch(`${base}data/labor.json`, { headers: { Accept: 'application/json' } })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = (await r.json()) as LaborData
        setAll(data.items)
        const d: Record<string, number> = {}
        for (const it of data.items) d[it.id] = it.avgDays
        setDays(d)
      } catch (e:any) { setError(e?.message ?? String(e)) }
    })()
  }, [])

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
          className="rounded-2xl border bg-white p-4 grid gap-3 items-center md:grid-cols-[1fr_auto_auto]"
        >
            {/* Auswahl + Titel + Metazeile – Checkbox auf Titellinie zentriert */}
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={!!sel[a.id]}
                onChange={()=>toggle(a.id)}
                className="mt-[4px]" // leicht nach unten versetzt, zentriert zur Titelzeile
              />
              <div>
                <div className="font-medium leading-tight">{a.title}</div>
                <div className="text-xs text-slate-500">
                  {a.category}{a.group ? ` · ${a.group}` : ''}{a.machine ? ` · ${a.machine}` : ''}
                </div>
              </div>
            </label>


          {/* Rechtsbündige Info-Spalte (links vor Tage) */}
          <div className="text-sm text-slate-700 text-right justify-self-end">
            <div>Ø Aufwand: {a.avgDays} Tage</div>
            <div>Preis pro Tag: {fmtEUR(a.dayRateEur)}</div>
          </div>

          {/* Tage-Eingabe (ganz rechts) */}
          <div className="flex items-center gap-2 justify-self-end md:ml-6">
            <label className="text-sm whitespace-nowrap">Tage</label>
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
        Ausgewählte Arbeitskosten zur Zusammenfassung hinzufügen
      </button>
    </div>
  )
}
