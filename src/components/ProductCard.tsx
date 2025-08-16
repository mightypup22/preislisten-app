import React, { useEffect, useMemo, useState } from 'react'
import { Product, Option } from '../types'
import { fmtEUR } from '../utils/format'
import { useCart } from '../context/CartContext'

const VISIBLE_COLLAPSED = 5

export default function ProductCard({ p }: { p: Product }) {
  const { addWithOptions } = useCart()
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [showImage, setShowImage] = useState<boolean>(!!(p.images && p.images.length > 0))
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0) // 0-basiert für eingeklapptes Paging

  const title = p.typ ? `${p.typ} — ${p.name}` : p.name
  const hasImage = showImage && p.images && p.images[0]

  const toggle = (opt: Option) =>
    setSelected(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))

  const chosen: Option[] = useMemo(
    () => p.options.filter(o => selected[o.id]),
    [p.options, selected]
  )

  const baseValue = p.basePrice.type === 'value' ? p.basePrice.eur : 0
  const baseLabel = p.basePrice.type === 'value' ? fmtEUR(baseValue) : 'auf Anfrage'
  const optionsSum = chosen.reduce((acc, o) => acc + (o.price.type === 'value' ? o.price.eur : 0), 0)
  const previewSum = baseValue + optionsSum

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return p.options
    return p.options.filter(o => o.name.toLowerCase().includes(q))
  }, [p.options, query])

  // Paging nur wenn NICHT expanded
  const totalPages = Math.max(1, Math.ceil(filtered.length / VISIBLE_COLLAPSED))
  const clampedPage = Math.min(page, totalPages - 1)

  const visibleOptions = expanded
    ? filtered
    : filtered.slice(clampedPage * VISIBLE_COLLAPSED, clampedPage * VISIBLE_COLLAPSED + VISIBLE_COLLAPSED)

  const canToggle = filtered.length > VISIBLE_COLLAPSED && !query
  const navVisible = !expanded && filtered.length > VISIBLE_COLLAPSED
  const selectedCount = Object.values(selected).filter(Boolean).length

  const onAdd = () => {
    addWithOptions(p, chosen)
    setSelected({})
    setExpanded(false)
    setQuery('')
    setPage(0)
  }

  // Bei Filterwechsel oder Expand/Collapse Seite zurücksetzen
  useEffect(() => { setPage(0) }, [query, expanded])
  // Safety: clamp, falls Liste kürzer wurde
  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      {/* Bild nur wenn vorhanden */}
      {hasImage && (
        <img
          src={p.images![0]}
          alt=""
          loading="lazy"
          className="w-full h-40 object-cover rounded-xl"
          onError={() => setShowImage(false)}
        />
      )}

      {/* Meta */}
      <div className="text-sm text-slate-500">{p.category} · {p.group}</div>
      <h3 className="text-lg font-semibold">{title}</h3>

      {/* Basispreis */}
      <div className="text-slate-900 font-medium">Basispreis: {baseLabel}</div>

      {/* Optionen */}
      {p.options.length > 0 && (
        <div className="mt-2 space-y-2">
          {/* Suche */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Optionen filtern…"
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>

          {/* Status + Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              {expanded
                ? `Zeige ${filtered.length} von ${p.options.length}`
                : `Zeige ${visibleOptions.length} von ${p.options.length}`}
              {query ? ` • gefiltert` : ''}
              {!expanded && navVisible && (
                <> • Seite {clampedPage + 1}/{totalPages}</>
              )}
            </div>
            {canToggle && (
              <button className="underline" onClick={() => setExpanded(v => !v)}>
                {expanded ? 'Weniger anzeigen' : `Mehr anzeigen (${filtered.length - VISIBLE_COLLAPSED})`}
              </button>
            )}
          </div>

          {/* Liste mit dezenten Trennlinien */}
          <ul className="divide-y divide-slate-200 py-2 mt-3">
            {visibleOptions.map(opt => (
              <li key={opt.id} className="py-3">
                {/* Checkbox + Name (mehrzeilig) */}
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={!!selected[opt.id]}
                    onChange={() => toggle(opt)}
                    aria-label={opt.name}
                    className="mt-[3px] shrink-0"
                  />
                  <span
                    className="flex-1 whitespace-normal break-words"
                    style={{ hyphens: 'auto', wordBreak: 'break-word' }}
                  >
                    {opt.name}
                  </span>
                </label>

                {/* Preis in eigener Zeile, eingerückt */}
                <div className="pl-6 mt-2">
                  <span className="inline-block text-[11px] px-2 py-1 rounded-full border text-slate-700">
                    {opt.price.type === 'value' ? `Preis: ${fmtEUR(opt.price.eur)}` : 'Preis: auf Anfrage'}
                  </span>
                </div>
              </li>
            ))}
            {visibleOptions.length === 0 && (
              <li className="py-3 text-xs text-slate-500">Keine Optionen für den Filter.</li>
            )}
          </ul>

          {/* Seitennavigation NUR im eingeklappten Zustand und wenn mehr als 5 Optionen */}
          {navVisible && (
            <div className="flex items-center justify-between mt-2">
              <button
                className="px-3 py-1 rounded-xl border text-sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={clampedPage === 0}
                aria-label="Vorherige Optionen"
                title="Vorherige Optionen"
              >
                ‹
              </button>
              <div className="text-xs text-slate-500">Seite {clampedPage + 1} / {totalPages}</div>
              <button
                className="px-3 py-1 rounded-xl border text-sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={clampedPage >= totalPages - 1}
                aria-label="Weitere Optionen"
                title="Weitere Optionen"
              >
                ›
              </button>
            </div>
          )}

          {/* Toggle unten nochmals (nur ohne Filter) */}
          {canToggle && (
            <div>
              <button className="underline text-xs" onClick={() => setExpanded(v => !v)}>
                {expanded ? 'Weniger anzeigen' : `Mehr anzeigen (${filtered.length - VISIBLE_COLLAPSED})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vorschau & Aktionen */}
      <div className="mt-2 text-sm text-slate-700">
        <div className="flex justify-between">
          <span>Zwischensumme (Vorschau)</span>
          <span>{fmtEUR(previewSum)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-3 py-2 rounded-xl bg-slate-900 text-white"
          onClick={onAdd}
        >
          Hinzufügen{selectedCount ? ` (${selectedCount})` : ''}
        </button>
        {selectedCount > 0 && (
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => setSelected({})}
          >
            Auswahl zurücksetzen
          </button>
        )}
      </div>
    </div>
  )
}
