import React from 'react'

export default function Filters({ categories, category, setCategory }:{ categories:string[]; category:string; setCategory:(v:string)=>void }){
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={()=>setCategory('all')} className={`px-3 py-1 rounded-full border ${category==='all'?'bg-slate-900 text-white':'border-slate-300'}`}>Alle</button>
      {categories.map(c=> (
        <button key={c} onClick={()=>setCategory(c)} className={`px-3 py-1 rounded-full border ${category===c?'bg-slate-900 text-white':'border-slate-300'}`}>{c}</button>
      ))}
    </div>
  )
}