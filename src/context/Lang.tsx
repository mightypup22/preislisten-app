import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { dict, Lang as LangType } from '../i18n/strings'

type Ctx = {
  lang: LangType
  setLang: (l: LangType) => void
  t: (key: string, vars?: Record<string, string|number>) => string
}

const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangType>(() => (localStorage.getItem('lang') as LangType) || 'de')
  const setLang = (l: LangType) => { setLangState(l); localStorage.setItem('lang', l) }

  const t = (key: string, vars?: Record<string, string|number>) => {
    const base = dict[lang][key] ?? key
    if (!vars) return base
    return Object.keys(vars).reduce((s, k)=> s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k])), base)
  }

  const value = useMemo(()=>({ lang, setLang, t }), [lang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
