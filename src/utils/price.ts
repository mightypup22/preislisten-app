import { Money, Option, Product, LaborSelection } from '../types'

export const moneyValue = (m: Money) => (m.type === 'value' ? m.eur : 0)

export const sumOptions = (opts: Option[]) =>
  opts.reduce((acc, o) => acc + (o.price.type === 'value' ? o.price.eur : 0), 0)

export function itemBreakdown(product: Product, selected: Option[]) {
  const base = moneyValue(product.basePrice)
  const optionsSum = sumOptions(selected)
  const opts = selected.map(o => ({
    id: o.id,
    name: o.name,
    price: o.price.type === 'value' ? o.price.eur : null, // null = on request
  }))
  const subtotal = base + optionsSum
  return { base, options: opts, subtotal }
}

export const laborSubtotal = (labor: LaborSelection[]) =>
  labor.reduce((acc, l) => acc + l.days * l.ref.dayRateEur, 0)

/** Rabatt global (falls noch genutzt) */
export function cartTotalsAll(
  items: { product: Product; selected: Option[] }[],
  labor: LaborSelection[],
  discountPct: number
) {
  const subtotalProducts = items.reduce((acc, it) => acc + itemBreakdown(it.product, it.selected).subtotal, 0)
  const subtotalLabor = laborSubtotal(labor)
  const subtotal = subtotalProducts + subtotalLabor
  const d = Math.max(0, Math.min(100, discountPct))
  const discount = Math.floor(subtotal * (d / 100))
  const final = subtotal - discount
  return { subtotalProducts, subtotalLabor, subtotal, discount, final }
}

/** NEU: Rabatt selektiv auf Hardware/Arbeit (gleicher %-Satz) */
export function cartTotalsSelective(
  items: { product: Product; selected: Option[] }[],
  labor: LaborSelection[],
  discountPct: number,
  applyHardware: boolean,
  applyLabor: boolean
){
  const subtotalProducts = items.reduce((acc, it) => acc + itemBreakdown(it.product, it.selected).subtotal, 0)
  const subtotalLabor = laborSubtotal(labor)
  const subtotal = subtotalProducts + subtotalLabor
  const d = Math.max(0, Math.min(100, discountPct))
  const discountBase = (applyHardware ? subtotalProducts : 0) + (applyLabor ? subtotalLabor : 0)
  const discount = Math.floor(discountBase * (d / 100))
  const final = subtotal - discount
  return { subtotalProducts, subtotalLabor, subtotal, discountBase, discount, final }
}

/** Back-Compat: alter API-Name, falls noch irgendwo importiert */
export function totalWithDiscount(base: Money, opts: Option[], discountPct: number) {
  const baseVal = moneyValue(base)
  const subtotal = baseVal + sumOptions(opts)
  const d = Math.max(0, Math.min(100, discountPct))
  const discount = Math.floor(subtotal * (d / 100))
  return { subtotal, discount, final: subtotal - discount }
}
