import React from 'react'
import { fmtEUR, isMoney } from '../utils/format'
import { Product } from '../types'
import { useCart } from '../context/CartContext'

export default function ProductDetail({ p, onClose }:{ p: Product; onClose: ()=>void }){
  const { toggleOption, items } = useCart()
  const cartItem = items.find(i => i.product.id === p.id)
  const selectedIds = new Set(cartItem?.selected.map(o=>o.id))

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal>
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 grid md:grid-cols-2 gap-6">
        <div>
          <img src={p.images?.[0] || '/images/placeholder.jpg'} alt="" className="w-full h-60 object-cover rounded-xl" />
          <div className="mt-3 text-sm text-slate-600">{p.short}</div>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{p.name}</h2>
          <div className="text-sm text-slate-500">{p.category} · {p.group}</div>
          <div className="mt-2">
            <div className="font-medium">Basispreis: {isMoney(p.basePrice) ? fmtEUR(p.basePrice.eur) : 'auf Anfrage'}</div>
          </div>
          <div className="mt-2 max-h-56 overflow-auto pr-2">
            {p.options.map(opt => (
              <label key={opt.id} className="flex items-center justify-between gap-3 py-2 border-b">
                <span>{opt.name}</span>
                {opt.price.type === 'value' ? <span>{fmtEUR(opt.price.eur)}</span> : <span className="text-xs px-2 py-1 rounded-full border">auf Anfrage</span>}
                <input
                  type="checkbox"
                  aria-label={opt.name}
                  checked={selectedIds.has(opt.id)}
                  onChange={()=>toggleOption(p.id, opt)}
                />
              </label>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button className="px-3 py-2 rounded-xl border" onClick={onClose}>Schließen</button>
          </div>
        </div>
      </div>
    </div>
  )
}