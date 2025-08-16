import React from 'react'

export default function SearchBar({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <input
      aria-label="Produkte suchen"
      className="w-full md:w-80 rounded-xl border border-slate-300 px-4 py-2"
      placeholder="Suche…"
      value={q}
      onChange={e => setQ(e.target.value)}
    />
  )
}