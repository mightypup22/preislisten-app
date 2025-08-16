import { Product } from '../types'

export type SortKey = 'name' | 'priceAsc' | 'priceDesc' | 'group' | 'groupName'

const baseVal = (p: Product) =>
  p.basePrice.type === 'value' ? p.basePrice.eur : Number.POSITIVE_INFINITY

export const sortProducts = (list: Product[], key: SortKey) => {
  if (key === 'name')      return [...list].sort((a,b)=>a.name.localeCompare(b.name, 'de'))
  if (key === 'priceAsc')  return [...list].sort((a,b)=>baseVal(a)-baseVal(b))
  if (key === 'priceDesc') return [...list].sort((a,b)=>baseVal(b)-baseVal(a))
  if (key === 'group')     return [...list].sort((a,b)=> a.group.localeCompare(b.group,'de') || a.name.localeCompare(b.name,'de'))
  if (key === 'groupName') return [...list].sort((a,b)=> (a.category.localeCompare(b.category,'de') || a.group.localeCompare(b.group,'de') || a.name.localeCompare(b.name,'de')))
  return list
}
