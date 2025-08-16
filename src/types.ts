export type Money = { type: 'value'; eur: number } | { type: 'on_request' }

export interface Option {
  id: string
  name: string
  price: Money
}

export interface Product {
  id: string
  typ: string              // <— NEU
  name: string
  group: string
  category: string
  basePrice: Money
  options: Option[]
  sku?: string
  short?: string
  specs?: Record<string, string>
  tags?: string[]
  images?: string[]
}

export interface PriceList {
  currency: 'EUR'
  updated: string
  products: Product[]
}

/** Gruppenbeschreibung (editierbar per JSON) */
export interface GroupInfoSection { title: string; bullets: string[] }
export interface GroupInfo { title: string; sections: GroupInfoSection[] }
export interface GroupInfoData {
  categories: {
    [category: string]: {
      groups: { [group: string]: GroupInfo }
    }
  }
}

/** Arbeitskosten (ohne 'typ') */
export interface LaborCost {
  id: string
  title: string
  category: string
  group?: string
  machine?: string
  avgDays: number
  dayRateEur: number
}
export interface LaborData { currency: 'EUR'; updated: string; items: LaborCost[] }
export interface LaborSelection { id: string; days: number; ref: LaborCost }
