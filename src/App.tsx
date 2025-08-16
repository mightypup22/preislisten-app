import React, { useEffect, useState } from 'react'
import Catalog from './components/Catalog'
import LaborCatalog from './components/LaborCatalog'
import SearchBar from './components/SearchBar'
import SortMenu from './components/SortMenu'
import PriceSummary from './components/PriceSummary'
import { CartProvider } from './context/CartContext'
import type { SortKey } from './utils/search'
import AdminPage from './pages/Admin'

export default function App(){
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [mode, setMode] = useState<'hardware'|'labor'>('hardware')
  const [showSvgLogo, setShowSvgLogo] = useState(false)
  const [hash, setHash] = useState(window.location.hash)

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
          <header className="flex flex-wrap items-center gap-3 justify-between mb-4 w-full">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Logo"
                className={`h-8 ${showSvgLogo ? '' : 'hidden'}`}
                onLoad={() => setShowSvgLogo(true)}
                onError={() => setShowSvgLogo(false)}
              />
              <div>
                <h1 className="text-2xl font-bold leading-tight">Günther Maschinenbau GmbH</h1>
                <div className="text-xl text-slate-500 -mt-0.5">Preisliste</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {mode === 'hardware' && (
                <div className="flex items-center gap-2">
                  <SearchBar q={q} setQ={setQ} />
                  <SortMenu sort={sort} setSort={setSort} />
                </div>
              )}
              {import.meta.env.DEV && (
                <a href="#/admin" className="underline text-sm">Admin</a>
              )}
            </div>
          </header>

          <div className="mb-4 flex gap-2">
            <button onClick={()=>setMode('hardware')} className={`px-3 py-2 rounded-xl border ${mode==='hardware'?'bg-slate-900 text-white':'border-slate-300'}`}>Produkte</button>
            <button onClick={()=>setMode('labor')} className={`px-3 py-2 rounded-xl border ${mode==='labor'?'bg-slate-900 text-white':'border-slate-300'}`}>Arbeit</button>
          </div>

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
