import { z } from 'zod'

/** --- Basis-Typen --- */
export const zMoney = z.union([
  z.object({ type: z.literal('value'), eur: z.number().nonnegative() }),
  z.object({ type: z.literal('on_request') })
])

export const zOption = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: zMoney
})

export const zProduct = z.object({
  id: z.string().min(1),
  typ: z.string().min(1),           // <— NEU: Pflichtfeld
  name: z.string().min(1),
  group: z.string().min(1),
  category: z.string().min(1),
  basePrice: zMoney,
  options: z.array(zOption),
  sku: z.string().optional(),
  short: z.string().optional(),
  specs: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional()
})

/** --- Preisliste --- */
export const zPriceList = z.object({
  currency: z.literal('EUR'),
  updated: z.string().min(4),
  products: z.array(zProduct)
})
export type PriceList = z.infer<typeof zPriceList>

/** --- GroupInfo --- */
export const zGroupInfoSection = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string())
})
export const zGroupInfo = z.object({
  title: z.string().min(1),
  sections: z.array(zGroupInfoSection)
})
export const zGroupInfoData = z.object({
  categories: z.record(
    z.object({
      groups: z.record(zGroupInfo)
    })
  )
})
export type GroupInfoData = z.infer<typeof zGroupInfoData>

/** --- Labor (ohne 'typ') --- */
export const zLaborCost = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  group: z.string().optional(),
  machine: z.string().optional(),
  avgDays: z.number().int().nonnegative(),
  dayRateEur: z.number().nonnegative()
})
export const zLaborData = z.object({
  currency: z.literal('EUR'),
  updated: z.string().min(4),
  items: z.array(zLaborCost)
})
export type LaborData = z.infer<typeof zLaborData>
