import React from 'react'
import { GroupInfoData } from '../types'

function resolveEntry(data: GroupInfoData | null, category: string, group: string){
  if (!data || !group || group === 'all') return null
  // 1) Konkrete Kategorie → direkt versuchen
  if (category && category !== 'all') {
    return data.categories?.[category]?.groups?.[group] || null
  }
  // 2) Kategorie = 'all' → Gruppe in allen Kategorien suchen (erste Übereinstimmung)
  const cats = Object.keys(data.categories || {})
  for (const c of cats) {
    const entry = data.categories?.[c]?.groups?.[group]
    if (entry) return entry
  }
  return null
}

export default function GroupInfo({ data, category, group }:{
  data: GroupInfoData | null
  category: string
  group: string
}){
  const entry = resolveEntry(data, category, group)
  if (!entry) return null
  return (
    <section className="mb-6 p-4 md:p-6 rounded-2xl border bg-white">
      <h2 className="text-xl md:text-2xl font-semibold mb-3">{entry.title}</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {entry.sections.map((s, idx) => (
          <div key={idx} className="border rounded-xl p-3">
            <div className="font-medium mb-2">{s.title}</div>
            <ul className="list-disc ml-5 space-y-1 text-sm text-slate-700">
              {s.bullets.map((b, i) => (<li key={i}>{b}</li>))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
