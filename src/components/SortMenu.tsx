import React from 'react'
import type { SortKey } from '../utils/search'
import { useLang } from '../context/Lang'

export default function SortMenu({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey)=>void }) {
  const { t } = useLang()
  return (
    <label className="text-sm flex items-center gap-2">
      <span>{t('sort_by')}:</span>
      <select
        value={sort}
        onChange={e => setSort(e.target.value as SortKey)}
        className="rounded border px-2 py-1"
      >
        <option value="name">{t('sort_name')}</option>
        <option value="priceAsc">{t('sort_price_asc')}</option>
        <option value="priceDesc">{t('sort_price_desc')}</option>
      </select>
    </label>
  )
}
