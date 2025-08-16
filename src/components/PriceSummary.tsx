import React from 'react'
import { fmtEUR } from '../utils/format'
import { useCart } from '../context/CartContext'
import { itemBreakdown } from '../utils/price'

export default function PriceSummary(){
  const {
    items, labor, removeItem, removeLabor, updateLaborDays,
    discount, setDiscount, discountHardware, setDiscountHardware, discountLabor, setDiscountLabor,
    customerName,
    totals
  } = useCart()

  return (
    <aside id="print-area" className="rounded-2xl border bg-white p-4 relative">
      {/* PRINT-Header: Logo PNG oben rechts + Kunde */}
      <div className="print-only mb-4">
        <div className="flex items-start justify-between">
          <div />
          <img src="/logo.png" alt="Logo" className="h-10" />
        </div>
        <div className="mt-2 text-sm">
          <span className="text-slate-500">Kunde: </span>
          <span className="font-medium">{customerName || '—'}</span>
        </div>
      </div>

      {/* Screen-Kopf: nur Eingabefeld */}
      <div className="mb-3 no-print">
        <div className="text-lg font-semibold">Angebotszusammenfassung</div>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor="cust" className="text-sm">Kunde</label>
          <input
            id="cust"
            type="text"
            placeholder="Kundenname eingeben…"
            className="flex-1 rounded border px-2 py-1"
            value={customerName}
            onChange={e=>{/* Name wird via Context woanders gesetzt; hier nur Anzeige in Print */}}
            onInput={e=>{
              // @ts-ignore
              const val = e.target?.value ?? ''
              window.dispatchEvent(new CustomEvent('setCustomerName', { detail: String(val) }))
            }}
          />
        </div>
      </div>

      <h3 className="font-semibold mb-3">Produktkosten</h3>

      {/* Hardware-Positionen */}
      <div className="flex flex-col gap-4">
        {items.map(it => {
          const bd = itemBreakdown(it.product, it.selected)
          const baseLabel = it.product.basePrice.type === 'value' ? fmtEUR(bd.base) : 'auf Anfrage'
          return (
            <div key={it.itemId} className="border rounded-xl p-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-medium">{it.product.name}</div>
                  <div className="text-xs text-slate-500">{it.product.category} · {it.product.group}</div>
                </div>
                <button className="text-sm underline no-print" onClick={()=>removeItem(it.itemId)}>Entfernen</button>
              </div>
              <div className="mt-2 text-sm">
                <div className="flex justify-between"><span>Basispreis</span><span>{baseLabel}</span></div>
                {it.selected.length > 0 && (
                  <div className="mt-2">
                    <div className="text-slate-500 mb-1">Zusatzoptionen</div>
                    <ul className="space-y-1">
                      {bd.options.map(opt => (
                        <li key={opt.id} className="flex justify-between">
                          <span>– {opt.name}</span>
                          <span>{opt.price === null ? 'auf Anfrage' : fmtEUR(opt.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                  <span>Zwischensumme (Position)</span>
                  <span>{fmtEUR(bd.subtotal)}</span>
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-slate-500 text-sm">Keine Produkte hinzugefügt.</div>}
      </div>

      {/* Arbeitskosten */}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Arbeitskosten</h4>
        <div className="flex flex-col gap-3">
          {labor.map(l => (
            <div key={l.id} className="border rounded-xl p-3 text-sm">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-medium">{l.ref.title}</div>
                  <div className="text-xs text-slate-500">
                    {l.ref.category}{l.ref.group? ` · ${l.ref.group}`:''}{l.ref.machine? ` · ${l.ref.machine}`:''}
                  </div>
                </div>
                <button className="text-sm underline no-print" onClick={()=>removeLabor(l.id)}>Entfernen</button>
              </div>
              <div className="mt-2 flex items-center gap-2 no-print">
                <label className="text-sm">Tage</label>
                <input
                  type="number" min={0} step={1}
                  className="w-20 rounded border px-2 py-1"
                  value={l.days}
                  onChange={e=>updateLaborDays(l.id, parseInt(e.target.value || '0'))}
                />
                <div className="ml-auto">Tagessatz: {fmtEUR(l.ref.dayRateEur)}</div>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span>Zwischensumme (Arbeit)</span>
                <span>{fmtEUR(l.days * l.ref.dayRateEur)}</span>
              </div>
            </div>
          ))}
          {labor.length === 0 && <div className="text-slate-500 text-sm">Keine Arbeitskosten hinzugefügt.</div>}
        </div>
      </div>

      {/* Summen + Rabattsteuerung */}
      <div className="mt-6 text-sm">
        <div className="flex justify-between"><span>Zwischensumme Produkte</span><span>{fmtEUR(totals.subtotalProducts)}</span></div>
        <div className="flex justify-between"><span>Zwischensumme Arbeit</span><span>{fmtEUR(totals.subtotalLabor)}</span></div>
        <div className="flex justify-between font-medium border-t pt-2 mt-2"><span>Warenkorb Zwischensumme</span><span>{fmtEUR(totals.subtotal)}</span></div>

        <div className="mt-3 space-y-2 no-print">
          <label className="flex items-center justify-between">
            <span>Rabatt auf Produkte</span>
            <input type="checkbox" checked={discountHardware} onChange={e=>setDiscountHardware(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between">
            <span>Rabatt auf Arbeit</span>
            <input type="checkbox" checked={discountLabor} onChange={e=>setDiscountLabor(e.target.checked)} />
          </label>
          <div className="flex items-center justify-between">
            <label className="text-sm">Rabatt %</label>
            <input type="number" min={0} max={100} className="w-24 rounded border px-2 py-1" value={discount} onChange={e=>setDiscount(parseInt(e.target.value||'0'))} />
          </div>
        </div>

        <div className="mt-2 flex justify-between"><span>Rabatt (Basis {fmtEUR(totals.discountBase)})</span><span>{fmtEUR(totals.discount)}</span></div>
        <div className="flex justify-between font-semibold mt-1"><span>Endpreis</span><span>{fmtEUR(totals.final)}</span></div>
      </div>

      <button className="mt-3 w-full rounded-xl border p-2 no-print" onClick={()=>window.print()}>Drucken / PDF</button>
    </aside>
  )
}
