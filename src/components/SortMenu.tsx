import React from 'react'
import type { SortKey } from '../utils/search'

export default function SortMenu({ sort, setSort }: { sort: SortKey; setSort: (k: SortKey) => void }) {
  return (
    <select aria-label="Sortierung" className="rounded-xl border border-slate-300 px-3 py-2" value={sort} onChange={e=>setSort(e.target.value as SortKey)}>
      <option value="name">Name</option>
      <option value="group">Gruppe</option>
      <option value="groupName">Kategorie → Gruppe → Name</option>
      <option value="priceAsc">Preis ↑</option>
      <option value="priceDesc">Preis ↓</option>
    </select>
  )
}