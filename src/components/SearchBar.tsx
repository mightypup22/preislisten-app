import React from 'react'
import { useLang } from '../context/Lang'

export default function SearchBar({ q, setQ }: { q: string; setQ: (s: string) => void }) {
  const { t } = useLang()
  return (
    <input
      type="text"
      value={q}
      onChange={e => setQ(e.target.value)}
      placeholder={t('search_placeholder')}
      className="w-64 rounded border px-3 py-2 text-sm"
    />
  )
}
