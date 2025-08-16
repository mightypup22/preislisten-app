import React, { useEffect, useState } from 'react'
import Catalog from './components/Catalog'
import LaborCatalog from './components/LaborCatalog'
import SearchBar from './components/SearchBar'
import SortMenu from './components/SortMenu'
import PriceSummary from './components/PriceSummary'
import { CartProvider } from './context/CartContext'
import type { SortKey } from './utils/search'
import AdminPage from './pages/Admin'
import { useLang } from './context/Lang'

export default function App(){
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [mode, setMode] = useState<'hardware'|'labor'>('hardware')
  const [showSvgLogo, setShowSvgLogo] = useState(false)
  const [hash, setHash] = useState(window.location.hash)
  const { t } = useLang?.() || { t: (x:string)=>x }

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (hash.startsWith('#/admin')) {
    return <AdminPage />
  }

  return (
    <CartProvider>
      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-[1fr_360px] gap-6">
        <section className="no-print">
          {/* Header */}
          <header className="flex flex-wrap items-center gap-3 justify-between mb-3 w-full">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo nur anzeigen, wenn /public/logo.svg vorhanden */}
              <img
                src="/logo.svg"
                alt="Logo"
                className={`h-8 ${showSvgLogo ? '' : 'hidden'}`}
                onLoad={() => setShowSvgLogo(true)}
                onError={() => setShowSvgLogo(false)}
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight truncate">{t('brand') || 'Günther Maschinenbau GmbH'}</h1>
                <div className="text-xl text-slate-500 -mt-0.5 truncate">{t('price_list') || 'Preisliste'}</div>
              </div>
            </div>
            {import.meta.env.DEV && (
              <a href="#/admin" className="underline text-sm shrink-0">Admin</a>
            )}
          </header>

          {/* Controls: Mobile-stabil, kein Overflow */}
          <div className="mb-4">
            {/* 1) Modus-Toggle: horizontal scrollbar auf XS, normal ab sm */}
            <div className="-mx-1 px-1 pb-1 overflow-x-auto whitespace-nowrap flex gap-2 snap-x sm:overflow-visible sm:flex-wrap">
              <button
                onClick={()=>setMode('hardware')}
                className={`px-3 py-2 rounded-xl border snap-start ${
                  mode==='hardware' ? 'bg-slate-900 text-white' : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t('products_tab') || 'Produkte'}
              </button>
              <button
                onClick={()=>setMode('labor')}
                className={`px-3 py-2 rounded-xl border snap-start ${
                  mode==='labor' ? 'bg-slate-900 text-white' : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t('labor_tab') || 'Arbeit'}
              </button>
            </div>

            {/* 2) Suche/Sortierung: stackt auf XS, nebeneinander ab sm */}
            {mode === 'hardware' && (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <SearchBar q={q} setQ={setQ} />
                </div>
                <div className="shrink-0">
                  <SortMenu sort={sort} setSort={setSort} />
                </div>
              </div>
            )}
          </div>

          {/* Inhalt */}
          {mode === 'hardware' ? (
            <Catalog q={q} sort={sort} />
          ) : (
            <LaborCatalog />
          )}
        </section>

        <PriceSummary />
      </main>
    </CartProvider>
  )
}
