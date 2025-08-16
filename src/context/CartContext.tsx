import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product, Option, LaborCost } from '../types'
import { itemBreakdown } from '../utils/price'
import { useLang } from './Lang'

type CartItem = {
  itemId: string
  productId: string
  optionIds: string[]
  product: Product
  selected: Option[]
}

type LaborItem = {
  id: string
  refId: string
  ref: LaborCost
  days: number
}

type Totals = {
  subtotalProducts: number
  subtotalLabor: number
  subtotal: number
  discountBase: number
  discount: number
  final: number
}

type Ctx = {
  items: CartItem[]
  labor: LaborItem[]
  addWithOptions: (p: Product, opts: Option[]) => void
  removeItem: (itemId: string) => void

  addLaborMany: (rows: { cost: LaborCost; days: number }[]) => void
  updateLaborDays: (id: string, days: number) => void
  removeLabor: (id: string) => void

  discount: number
  setDiscount: (n: number) => void
  discountHardware: boolean
  setDiscountHardware: (b: boolean) => void
  discountLabor: boolean
  setDiscountLabor: (b: boolean) => void

  customerName: string
  totals: Totals
}

const CartContext = createContext<Ctx | null>(null)

function uid(prefix = 'i') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLang() as any

  const [items, setItems] = useState<CartItem[]>([])
  const [labor, setLabor] = useState<LaborItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [discountHardware, setDiscountHardware] = useState(true)
  const [discountLabor, setDiscountLabor] = useState(false)
  const [customerName, setCustomerName] = useState('')

  // Kunde via CustomEvent setzen (kommt aus PriceSummary Input)
  useEffect(() => {
    const h = (e: any) => setCustomerName(String(e.detail || ''))
    window.addEventListener('setCustomerName', h as any)
    return () => window.removeEventListener('setCustomerName', h as any)
  }, [])

  const addWithOptions = (p: Product, opts: Option[]) => {
    const itemId = uid('item')
    setItems(prev => [
      ...prev,
      {
        itemId,
        productId: p.id,
        optionIds: opts.map(o => o.id),
        product: p,
        selected: opts
      }
    ])
  }

  const removeItem = (itemId: string) =>
    setItems(prev => prev.filter(i => i.itemId !== itemId))

  const addLaborMany = (rows: { cost: LaborCost; days: number }[]) => {
    setLabor(prev => [
      ...prev,
      ...rows.map(r => ({ id: uid('labor'), refId: r.cost.id, ref: r.cost, days: r.days }))
    ])
  }

  const updateLaborDays = (id: string, days: number) =>
    setLabor(prev => prev.map(l => (l.id === id ? { ...l, days } : l)))

  const removeLabor = (id: string) =>
    setLabor(prev => prev.filter(l => l.id !== id))

  // Totals
  const totals: Totals = useMemo(() => {
    const subtotalProducts = items.reduce((sum, it) => sum + itemBreakdown(it.product, it.selected).subtotal, 0)
    const subtotalLabor = labor.reduce((sum, l) => sum + l.days * l.ref.dayRateEur, 0)
    const subtotal = subtotalProducts + subtotalLabor
    const discountBase =
      (discountHardware ? subtotalProducts : 0) +
      (discountLabor ? subtotalLabor : 0)
    const discountValue = Math.max(0, Math.min(100, discount)) / 100 * discountBase
    const final = subtotal - discountValue
    return {
      subtotalProducts,
      subtotalLabor,
      subtotal,
      discountBase,
      discount: discountValue,
      final
    }
  }, [items, labor, discount, discountHardware, discountLabor])

  // *** Sprachwechsel-Remap: Produkte/Optionen/Labor aus der aktuellen Sprache nachladen ***
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        // Pricelist
        const pl = await fetchLangJson<{ products: Product[] }>(`${base}data/pricelist`, lang)
        const byProd: Record<string, Product> = Object.fromEntries(pl.products.map(p => [p.id, p]))
        const byOpt: Record<string, Record<string, Option>> = {}
        for (const p of pl.products) {
          byOpt[p.id] = Object.fromEntries(p.options.map(o => [o.id, o]))
        }

        // Labor
        const ld = await fetchLangJson<{ items: LaborCost[] }>(`${base}data/labor`, lang)
        const byLabor: Record<string, LaborCost> = Object.fromEntries(ld.items.map(x => [x.id, x]))

        if (!alive) return

        // Items remappen
        setItems(prev => prev.map(it => {
          const prodId = it.productId || it.product?.id
          const newProd = byProd[prodId]
          if (!newProd) return it // Fallback: lassen
          const optIds = it.optionIds?.length ? it.optionIds : it.selected.map(o => o.id)
          const newSelected = optIds.map(oid => byOpt[prodId]?.[oid]).filter(Boolean) as Option[]
          return { ...it, productId: prodId, optionIds: optIds, product: newProd, selected: newSelected }
        }))

        // Labor remappen
        setLabor(prev => prev.map(l => {
          const refId = l.refId || l.ref?.id
          const newRef = byLabor[refId]
          return newRef ? { ...l, refId, ref: newRef } : l
        }))
      } catch {
        // Ignorieren – bei Fehler bleiben alte Texte erhalten
      }
    })()
    return () => { alive = false }
  }, [lang])

  const value: Ctx = {
    items, labor,
    addWithOptions, removeItem,
    addLaborMany, updateLaborDays, removeLabor,
    discount, setDiscount, discountHardware, setDiscountHardware, discountLabor, setDiscountLabor,
    customerName,
    totals
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
