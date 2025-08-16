import React, { useEffect, useState } from 'react'
import Catalog from './components/Catalog'
import LaborCatalog from './components/LaborCatalog'
import SearchBar from './components/SearchBar'
import SortMenu from './components/SortMenu'
import PriceSummary from './components/PriceSummary'
import { CartProvider } from './context/CartContext'
import type { SortKey } from './utils/search'
import AdminPage from './pages/Admin'
import LanguageToggle from './components/LanguageToggle'
import { useLang } from './context/Lang'

export default function App(){
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [mode, setMode] = useState<'hardware'|'labor'>('hardware')
  const [showSvgLogo, setShowSvgLogo] = useState(false)
  const [hash, setHash] = useState(window.location.hash)
  const { t } = useLang() as any

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
          {/* ===== Titelzeile mit Admin-Link rechts ===== */}
          <header className="w-full mb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/logo.svg"
                  alt="Logo"
                  className={`h-8 ${showSvgLogo ? '' : 'hidden'}`}
                  onLoad={() => setShowSvgLogo(true)}
                  onError={() => setShowSvgLogo(false)}
                />
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold leading-tight truncate">
                    {t('brand') || 'Günther Maschinenbau GmbH'}
                  </h1>
                  <div className="text-xl text-slate-500 -mt-0.5 truncate">
                    {t('price_list') || 'Preisliste'}
                  </div>
                </div>
              </div>
              {import.meta.env.DEV && (
                <a href="#/admin" className="shrink-0 underline text-sm">Admin</a>
              )}
            </div>
          </header>

          {/* ===== Zeile 1: Sprachumschalter links ===== */}
          <div className="mb-2">
            <LanguageToggle />
          </div>

          {/* ===== Zeile 2: Suche (links, max 50%) + Sort (rechts) — nur im Hardware-Modus ===== */}
          {mode === 'hardware' && (
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-nowrap max-w-full">
                {/* Suchfeld: darf schrumpfen, aber max 50% */}
                <div className="min-w-[80px] max-w-[50%] basis-[50%] flex-1">
                  <SearchBar q={q} setQ={setQ} />
                </div>
                {/* Sort: hart rechts ausgerichtet, kein Abschneiden */}
                <div className="ml-auto shrink-0 flex justify-end">
                  <SortMenu sort={sort} setSort={setSort} />
                </div>
              </div>
            </div>
          )}

          {/* ===== Zeile 3: Modus-Buttons links ===== */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={()=>setMode('hardware')}
              className={`px-3 py-2 rounded-xl border ${mode==='hardware'?'bg-slate-900 text-white':'border-slate-300 hover:bg-slate-50'}`}
            >
              {t('products_tab') || 'Produkte'}
            </button>
            <button
              onClick={()=>setMode('labor')}
              className={`px-3 py-2 rounded-xl border ${mode==='labor'?'bg-slate-900 text-white':'border-slate-300 hover:bg-slate-50'}`}
            >
              {t('labor_tab') || 'Arbeit'}
            </button>
          </div>

          {/* ===== Inhalt ===== */}
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
