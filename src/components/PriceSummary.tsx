import React from 'react'
import { fmtEUR } from '../utils/format'
import { useCart } from '../context/CartContext'
import { itemBreakdown } from '../utils/price'
import { useLang } from '../context/Lang'

/** Eine Zeile mit Punkt-Leadern und rechtem Preis */
function Line({
  left,
  right,
  strong = false,
  muted = false,
  className = ''
}: {
  left: React.ReactNode
  right: React.ReactNode
  strong?: boolean
  muted?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-baseline gap-3 ${className}`}>
      <span className={`${muted ? 'text-slate-500' : ''} ${strong ? 'font-semibold' : ''} truncate`}>
        {left}
      </span>
      <div className="flex-1 border-b border-dotted border-slate-300 mx-2" />
      <span className={`tabular ${strong ? 'font-semibold' : ''}`}>{right}</span>
    </div>
  )
}

export default function PriceSummary(){
  const {
    items, labor, removeItem, removeLabor, updateLaborDays,
    discount, setDiscount, discountHardware, setDiscountHardware, discountLabor, setDiscountLabor,
    customerName,
    totals
  } = useCart()
  const { t } = useLang()

  return (
    <aside id="print-area" className="rounded-2xl border bg-white p-5 relative">
      {/* PRINT-Header: Logo PNG oben rechts + Kunde */}
      <div className="print-only mb-5">
        <div className="flex items-start justify-between">
          <div />
          <img src="/logo.png" alt="Logo" className="h-10" />
        </div>
        <div className="mt-3 text-sm">
          <span className="text-slate-500">{t('customer')}: </span>
          <span className="font-medium">{customerName || '—'}</span>
        </div>
      </div>

      {/* Screen-Kopf */}
      <div className="mb-4 no-print">
        <div className="text-lg font-semibold">{t('summary_title')}</div>
        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="cust" className="text-sm shrink-0">{t('customer')}</label>
          <input
            id="cust"
            type="text"
            placeholder="—"
            className="flex-1 rounded border px-3 py-2"
            value={customerName}
            onInput={e=>{
              // @ts-ignore
              const val = e.target?.value ?? ''
              window.dispatchEvent(new CustomEvent('setCustomerName', { detail: String(val) }))
            }}
          />
        </div>
      </div>

      {/* Mehr Abstand OBERHALB des Titels „Hardwarekosten“ */}
      <h3 className="font-semibold mt-8 mb-4">{t('hardware_costs')}</h3>

      {/* Hardware-Positionen */}
      <div className="flex flex-col gap-5">
        {items.map(it => {
          const bd = itemBreakdown(it.product, it.selected)
          const baseIsValue = it.product.basePrice.type === 'value'
          const baseLabel = baseIsValue ? fmtEUR(bd.base) : t('price_on_request')
          return (
            <div key={it.itemId} className="border rounded-xl p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {it.product.typ ? `${it.product.typ} — ${it.product.name}` : it.product.name}
                  </div>
                  <div className="text-xs text-slate-500">{it.product.category} · {it.product.group}</div>
                </div>
                <button className="text-sm underline no-print" onClick={()=>removeItem(it.itemId)}>
                  {t('reset_selection')}
                </button>
              </div>

              <div className="mt-3 text-sm space-y-3">
                {/* Basispreis mit Leaders */}
                <Line left={t('base_price')} right={baseLabel} muted={!baseIsValue} />

                {/* Optionen – jede mit Leaders */}
                {it.selected.length > 0 && (
                  <div className="pt-1">
                    <div className="text-slate-500 mb-2">{t('add')}</div>
                    <ul className="space-y-1.5">
                      {bd.options.map(opt => (
                        <li key={opt.id}>
                          <Line
                            left={<span>– {opt.name}</span>}
                            right={opt.price === null ? t('price_on_request') : fmtEUR(opt.price)}
                            className="text-sm"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Zwischensumme Position */}
                <div className="pt-3 border-t">
                  <Line left={t('subtotal_item')} right={fmtEUR(bd.subtotal)} strong />
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <div className="text-slate-500 text-sm">{t('no_hw')}</div>
        )}
      </div>

      {/* Arbeitskosten */}
      <div className="mt-8">
        <h4 className="font-semibold mb-3">{t('labor_costs')}</h4>
        <div className="flex flex-col gap-4">
          {labor.map(l => {
            const subtotal = l.days * l.ref.dayRateEur
            return (
              <div key={l.id} className="border rounded-xl p-4 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <div className="font-medium">{l.ref.title}</div>
                    <div className="text-xs text-slate-500">
                      {l.ref.category}{l.ref.group? ` · ${l.ref.group}`:''}{l.ref.machine? ` · ${l.ref.machine}`:''}
                    </div>
                  </div>
                  <button className="text-sm underline no-print" onClick={()=>removeLabor(l.id)}>
                    {t('reset_selection')}
                  </button>
                </div>

                {/* Eingabe & Tagsatz (nur Screen) */}
                <div className="mt-3 flex items-center gap-3 no-print">
                  <label className="text-sm">{t('days')}</label>
                  <input
                    type="number" min={0} step={1}
                    className="w-24 rounded border px-3 py-2 text-right"
                    value={l.days}
                    onChange={e=>updateLaborDays(l.id, parseInt(e.target.value || '0'))}
                  />
                  <div className="ml-auto">{t('day_rate')}: <span className="tabular">{fmtEUR(l.ref.dayRateEur)}</span></div>
                </div>

                {/* Zwischensumme Arbeitsposten mit Leaders */}
                <div className="mt-2">
                  <Line left={t('subtotal_labor_item')} right={fmtEUR(subtotal)} strong />
                </div>
              </div>
            )
          })}
          {labor.length === 0 && (
            <div className="text-slate-500 text-sm">{t('no_labor')}</div>
          )}
        </div>
      </div>

      {/* Summen + Rabattsteuerung */}
      <div className="mt-8 text-sm">
        <Line left={t('subtotal_products')} right={fmtEUR(totals.subtotalProducts)} />
        <Line left={t('subtotal_labor')} right={fmtEUR(totals.subtotalLabor)} />

        {/* Warenkorb-Zwischensumme mit größerem Abstand danach */}
        <div className="mt-3 pt-3 border-t mb-8">
          <Line left={t('subtotal_cart')} right={fmtEUR(totals.subtotal)} strong />
        </div>

        {/* Rabatt: drei Zeilen untereinander – beginnt nach großem Abstand */}
        <div className="space-y-3 no-print">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={discountHardware} onChange={e=>setDiscountHardware(e.target.checked)} />
            <span>{t('discount_on_hw')}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={discountLabor} onChange={e=>setDiscountLabor(e.target.checked)} />
            <span>{t('discount_on_labor')}</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm min-w-[120px]">{t('discount_percent')}</label>
            <input
              type="number" min={0} max={100}
              className="w-28 rounded border px-3 py-2"
              value={discount}
              onChange={e=>setDiscount(parseInt(e.target.value||'0'))}
            />
            <span className="text-slate-500 text-xs">%</span>
          </div>
        </div>

        {/* Rabatt & Endpreis */}
        <div className="mt-4 space-y-2">
          <Line left={`${t('discount')} (${fmtEUR(totals.discountBase)})`} right={fmtEUR(totals.discount)} />
          <Line left={t('final_price')} right={fmtEUR(totals.final)} strong className="mt-1" />
        </div>
      </div>

      <button
        className="mt-5 w-full rounded-xl border p-3 no-print hover:bg-slate-50 active:scale-[.98]"
        onClick={() => window.print()}
      >
        {t('print')}
      </button>
    </aside>
  )
}
