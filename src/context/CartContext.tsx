import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Option, Product, LaborSelection, LaborCost } from '../types'
import { cartTotalsSelective } from '../utils/price'

type CartItem = { itemId: string; product: Product; selected: Option[] }

interface Ctx {
  items: CartItem[]
  labor: LaborSelection[]

  addWithOptions: (p: Product, selected: Option[]) => void
  removeItem: (itemId: string) => void

  addLaborMany: (rows: { cost: LaborCost; days: number }[]) => void
  updateLaborDays: (id: string, days: number) => void
  removeLabor: (id: string) => void

  discount: number
  setDiscount: (v: number) => void
  discountHardware: boolean
  setDiscountHardware: (v: boolean) => void
  discountLabor: boolean
  setDiscountLabor: (v: boolean) => void

  customerName: string
  setCustomerName: (v: string) => void

  totals: {
    subtotalProducts: number
    subtotalLabor: number
    subtotal: number
    discountBase: number
    discount: number
    final: number
  }
}

const C = createContext<Ctx | null>(null)
export const useCart = () => {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [labor, setLabor] = useState<LaborSelection[]>([])

  const [discount, setDiscount] = useState(0)
  const [discountHardware, setDiscountHardware] = useState(true)
  const [discountLabor, setDiscountLabor] = useState(false)

  const [customerName, setCustomerName] = useState('')

  // Event-Bridge für das Eingabefeld in PriceSummary (damit nicht prop-drillen müssen)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>
      setCustomerName(ce.detail ?? '')
    }
    window.addEventListener('setCustomerName', handler as EventListener)
    return () => window.removeEventListener('setCustomerName', handler as EventListener)
  }, [])

  const addWithOptions = (p: Product, selected: Option[]) =>
    setItems(prev => [...prev, { itemId: uid(), product: p, selected }])

  const removeItem = (itemId: string) =>
    setItems(prev => prev.filter(i => i.itemId !== itemId))

  const addLaborMany = (rows: { cost: LaborCost; days: number }[]) =>
    setLabor(prev => {
      const map = new Map(prev.map(l => [l.id, l]))
      for (const r of rows) {
        map.set(r.cost.id, { id: r.cost.id, days: Math.max(0, Math.floor(r.days || 0)), ref: r.cost })
      }
      return Array.from(map.values())
    })

  const updateLaborDays = (id: string, days: number) =>
    setLabor(prev => prev.map(l => (l.id === id ? { ...l, days: Math.max(0, Math.floor(days || 0)) } : l)))

  const removeLabor = (id: string) => setLabor(prev => prev.filter(l => l.id !== id))

  const totals = useMemo(
    () => cartTotalsSelective(items, labor, discount, discountHardware, discountLabor),
    [items, labor, discount, discountHardware, discountLabor]
  )

  return (
    <C.Provider
      value={{
        items, labor,
        addWithOptions, removeItem,
        addLaborMany, updateLaborDays, removeLabor,
        discount, setDiscount, discountHardware, setDiscountHardware, discountLabor, setDiscountLabor,
        customerName, setCustomerName,
        totals
      }}
    >
      {children}
    </C.Provider>
  )
}
