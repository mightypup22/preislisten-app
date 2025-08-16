import React from 'react'
import { useLang } from '../context/Lang'

export default function SearchBar({
  q,
  setQ,
}: {
  q: string
  setQ: (v: string) => void
}) {
  const { t } = useLang() as any
  return (
    <input
      aria-label={t('search')}
      placeholder={t('search')}
      value={q}
      onChange={(e) => setQ(e.target.value)}
      /* Auf XS sehr kompakt, wächst ab sm */
      className="block w-full min-w-0 max-w-full rounded border px-2 py-1.5 sm:px-3 sm:py-2 text-sm"
      style={{ minWidth: 0 }}
    />
  )
}
