import React from 'react'
import { useLang } from '../context/Lang'

export default function LanguageToggle(){
  const { lang, setLang } = useLang()
  return (
    <div className="inline-flex items-center rounded-xl border overflow-hidden text-sm">
      <button
        className={`px-3 py-1 ${lang==='de'?'bg-slate-900 text-white':'bg-white'}`}
        onClick={()=>setLang('de')}
        aria-pressed={lang==='de'}
      >DE</button>
      <button
        className={`px-3 py-1 ${lang==='en'?'bg-slate-900 text-white':'bg-white'}`}
        onClick={()=>setLang('en')}
        aria-pressed={lang==='en'}
      >EN</button>
    </div>
  )
}
