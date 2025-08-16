import React from 'react'
import { useLang } from '../context/Lang'

export default function LanguageToggle() {
  const { lang, setLang } = useLang() as any
  return (
    <div className="inline-flex rounded-xl border overflow-hidden" role="group" aria-label="Language">
      <button
        type="button"
        aria-pressed={lang === 'de'}
        onClick={() => setLang('de')}
        className={`px-3 py-1.5 ${lang === 'de' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
      >
        DE
      </button>
      <button
        type="button"
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
        className={`px-3 py-1.5 border-l ${lang === 'en' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
      >
        EN
      </button>
    </div>
  )
}