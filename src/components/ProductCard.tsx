import React, { useMemo, useState } from 'react'
import { Product, Option } from '../types'
import { fmtEUR } from '../utils/format'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/Lang'
import Modal from './Modal'

export default function ProductCard({ p }: { p: Product }) {
  const { addWithOptions } = useCart()
  const { t, lang } = useLang() as any

  const [showImage, setShowImage] = useState<boolean>(!!(p.images && p.images.length > 0))
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({}) // persistiert auf Card

  // Titel: nur 'typ' anzeigen (Fallback auf name, falls typ fehlt)
  const title = p.typ || p.name || ''
  const hasImage = showImage && p.images && p.images[0]
  const hasOptions = p.options.length > 0

  const selectedList: Option[] = useMemo(
    () => p.options.filter(o => selected[o.id]),
    [p.options, selected]
  )

  const baseValue = p.basePrice.type === 'value' ? p.basePrice.eur : 0
  const baseLabel = p.basePrice.type === 'value' ? fmtEUR(baseValue) : t('price_on_request')
  const optionsSum = selectedList.reduce((acc, o) => acc + (o.price.type === 'value' ? o.price.eur : 0), 0)
  const previewSum = baseValue + optionsSum

  const openModal = () => { setFilter(''); setModalOpen(true) }
  const closeModal = () => setModalOpen(false)

  const clearCardSelection = () => setSelected({})

  const addToSummary = () => {
    const opts = p.options.filter(o => selected[o.id])
    addWithOptions(p, opts)
    clearCardSelection()
  }

  // --- Modal-Temp-State ---
  const [temp, setTemp] = useState<Record<string, boolean>>({})
  const startModal = () => { setTemp(selected); openModal() }
  const applyModal = () => { setSelected(temp); setModalOpen(false) }

  // Gefilterte Optionen (für Liste & "Alle markieren")
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return p.options
    return p.options.filter(o => o.name.toLowerCase().includes(q))
  }, [p.options, filter])

  // „Alle markieren“ → nur die aktuell gefilterten ankreuzen, andere unverändert lassen
  const handleSelectAll = () => {
    setTemp(prev => {
      const next = { ...prev }
      for (const o of filtered) next[o.id] = true
      return next
    })
  }

  // Sprachsicheres Label für „Alle markieren“
  const selectAllLabel = (() => {
    const tr = t('select_all')
    if (tr && tr !== 'select_all') return tr
    return lang === 'de' ? 'Alle markieren' : 'Select all'
  })()

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      {hasImage && (
        <img
          src={p.images![0]}
          alt=""
          loading="lazy"
          className="w-full h-40 object-cover rounded-xl"
          onError={() => setShowImage(false)}
        />
      )}

      {/* Badges statt Fließtext */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">{p.category}</span>
        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">{p.group}</span>
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="text-slate-900 font-medium">{t('base_price')}: {baseLabel}</div>

      {/* Ausgewählte Optionen – quadratischer X-Button links, Name rechts davon; Preis darunter rechtsbündig & fett */}
      {selectedList.length > 0 && (
        <div className="mt-1">
          <div className="text-sm font-medium mb-1">{t('selected_options')}</div>
          <ul className="divide-y divide-slate-200">
            {selectedList.map(opt => {
              const priceLabel = opt.price.type === 'value' ? fmtEUR(opt.price.eur) : t('price_on_request')
              return (
                <li key={opt.id} className="py-2">
                  {/* Zeile 1: Quadrat-Button links, Titel rechts (umbruchfähig) */}
                  <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                    <button
                      className="h-8 w-8 rounded border grid place-items-center text-slate-700 hover:bg-slate-50"
                      title={t('remove')}
                      aria-label={t('remove')}
                      onClick={() => setSelected(prev => ({ ...prev, [opt.id]: false }))}
                    >
                      ×
                    </button>
                    <div className="min-w-0 whitespace-normal break-words" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>
                      {opt.name}
                    </div>
                    {/* Zeile 2 (unter beiden Spalten): Preis */}
                    <div className="col-span-2 mt-1 text-[12px] text-right font-semibold text-slate-900">
                      {t('price_label')}: {priceLabel}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          {/* Trennlinie unter der letzten Option als Abgrenzung zur Zwischensumme */}
          <div className="border-t border-slate-200 mt-2" />
        </div>
      )}

      {/* Vorschau */}
      <div className="mt-2 text-sm text-slate-700">
        <div className="flex justify-between">
          <span>{t('preview_subtotal')}</span>
          <span className="tabular">{fmtEUR(previewSum)}</span>
        </div>
      </div>

      {/* Auswahl löschen – eine Zeile über den anderen Buttons, links ausgerichtet */}
      {Object.values(selected).some(Boolean) && (
        <div className="mt-2">
          <button
            className="px-3 py-2 rounded-xl border hover:bg-slate-50 active:scale-[.98]"
            onClick={clearCardSelection}
          >
            {t('clear_selection')}
          </button>
        </div>
      )}

      {/* Hauptaktionen */}
      <div className="flex items-center gap-3 mt-1">
        <button
          className="px-3 py-2 rounded-xl border hover:bg-slate-50 active:scale-[.98]"
          onClick={() => { setTemp(selected); openModal() }}
        >
          {t('open_options')}
        </button>
        <button
          className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-[.98]"
          onClick={addToSummary}
        >
          {t('add')}
        </button>
      </div>

      {/* Modal für Zusatzoptionen */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={t('additional_options')}
        footer={(
          <div className="w-full flex items-center justify-between gap-2">
            {/* Links: Alle markieren (nur sinnvoll, wenn es Options-Treffer gibt) */}
            {hasOptions ? (
              <button
                className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSelectAll}
                disabled={filtered.length === 0}
                title={filtered.length === 0 ? (lang === 'de' ? 'Keine Treffer' : 'No matches') : undefined}
              >
                {selectAllLabel}
              </button>
            ) : <span />}

            {/* Rechts: Cancel / Apply */}
            <div className="flex items-center gap-2">
              <button className="rounded-xl border px-3 py-2 hover:bg-slate-50" onClick={closeModal}>
                {t('cancel')}
              </button>
              <button className="rounded-xl bg-slate-900 text-white px-3 py-2 hover:bg-slate-800" onClick={applyModal}>
                {t('apply')}
              </button>
            </div>
          </div>
        )}
      >
        {!hasOptions ? (
          <div className="text-sm text-slate-500">{t('no_options_available')}</div>
        ) : (
          <>
            <div className="mb-3">
              <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full rounded border px-2 py-1 text-sm"
              />
            </div>

            <ul className="divide-y divide-slate-200">
              {filtered.map(opt => {
                const priceLabel = opt.price.type === 'value' ? fmtEUR(opt.price.eur) : t('price_on_request')
                const checked = !!temp[opt.id]
                return (
                  <li key={opt.id} className="py-3">
                    {/* Checkbox + Grid: Text links, Preis rechts – alle Preise beginnen exakt an derselben Linie, mind. 40px Abstand */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => setTemp(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                        className="mt-0 accent-slate-700"
                      />
                      <div
                        className="flex-1 grid items-center gap-[40px] min-w-0"
                        style={{ gridTemplateColumns: '1fr 160px' }}
                      >
                        <div className="min-w-0 whitespace-normal break-words" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>
                          {opt.name}
                        </div>
                        <div className="text-sm text-slate-800 whitespace-nowrap tabular text-right">
                          {t('price_label')}: {priceLabel}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
              {filtered.length === 0 && (
                <li className="py-3 text-xs text-slate-500">{t('no_options_for_filter')}</li>
              )}
            </ul>
          </>
        )}
      </Modal>
    </div>
  )
}
