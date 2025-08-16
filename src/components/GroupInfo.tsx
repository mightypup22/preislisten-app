import React, { useEffect, useMemo, useState } from 'react'
import { GroupInfoData } from '../types'
import { useLang } from '../context/Lang'

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

export default function GroupInfo({
  data,
  category,
  group
}:{
  data: GroupInfoData | null
  category: string
  group: string
}){
  const { t } = useLang() as any
  const entry = useMemo(()=>resolveEntry(data, category, group), [data, category, group])

  const [open, setOpen] = useState(false)
  // Bei Wechsel einklappen
  useEffect(()=>{ setOpen(false) }, [category, group])

  if (!entry) return null
  const hasSections = Array.isArray(entry.sections) && entry.sections.length > 0

  return (
    <section className="mb-6 p-4 md:p-6 rounded-2xl border bg-white">
      {/* Kopf: Titel + Pfeil-Button rechts, mit festem Mindestabstand */}
      <div className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2">
        <h2 className="text-xl md:text-2xl font-semibold leading-tight min-w-0">
          <span className="break-words">{entry.title || ''}</span>
        </h2>

        {hasSections && (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? (t('show_less') || 'Weniger anzeigen') : (t('show_more') || 'Mehr anzeigen')}
            title={open ? (t('show_less') || 'Weniger anzeigen') : (t('show_more') || 'Mehr anzeigen')}
            onClick={()=>setOpen(v=>!v)}
            className="justify-self-end h-9 w-9 rounded-lg border grid place-items-center hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {/* Chevron: zeigt nach unten (zu), rotiert nach oben (offen) */}
            <svg
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Inhalt: Sektionen nur bei "open" */}
      {open && hasSections && (
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {entry.sections.map((s: any, idx: number) => (
            <div key={idx} className="border rounded-xl p-3">
              {s.title && <div className="font-medium mb-2">{s.title}</div>}
              {Array.isArray(s.bullets) && s.bullets.length > 0 ? (
                <ul className="list-disc ml-5 space-y-1 text-sm text-slate-700">
                  {s.bullets.map((b: string, i: number) => (<li key={i}>{b}</li>))}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">{t('no_details') || 'Keine Details'}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
