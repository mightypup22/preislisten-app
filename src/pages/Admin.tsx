import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { apiGet, apiSave, apiCheckPassword, setAdminPassword, clearAdminPassword, ApiError } from '../utils/api'
import { zPriceList, zGroupInfoData, zLaborData } from '../utils/schemas'

type Tab = 'pricelist'|'groupinfo'|'labor'
const schemaByTab = { pricelist: zPriceList, groupinfo: zGroupInfoData, labor: zLaborData } as const

/* ---------- kleine Alert-Komponente ---------- */
function Banner({ kind, children }:{ kind:'error'|'warn'|'info'|'success'; children: React.ReactNode }) {
  const colors = {
    error: 'bg-red-50 text-red-800 border-red-200',
    warn: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200'
  }[kind]
  return <div className={`border rounded-xl px-3 py-2 text-sm ${colors}`}>{children}</div>
}

/* ---------- Editor-Sektion mit Validierung & Marker ---------- */
function SectionEditor({ name, onAuthError }: { name: Tab; onAuthError: () => void }) {
  const [text, setText] = useState<string>('{}')
  const [status, setStatus] = useState<{kind:'info'|'success'|'warn'|'error'; msg:string} | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  const title = useMemo(() => ({
    pricelist: 'Preisliste (pricelist.json)',
    groupinfo: 'Gruppenbeschreibungen (groupinfo.json)',
    labor: 'Arbeitskosten (labor.json)'
  }[name]), [name])

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
  }

  const setMarkers = (issues: {path: (string|number)[]; message: string}[]) => {
    const monaco = monacoRef.current
    const editor = editorRef.current
    if (!monaco || !editor) return
    const model = editor.getModel()
    if (!model) return

    const src = model.getValue()
    const markers: any[] = []

    const findLineForKey = (key: string) => {
      // einfache Heuristik: erste Fundstelle von "key"
      const needle = `"${key}"`
      const idx = src.indexOf(needle)
      if (idx === -1) return 1
      const before = src.slice(0, idx)
      const line = before.split('\n').length
      const col = idx - before.lastIndexOf('\n')
      return { line, col }
    }

    for (const iss of issues) {
      const last = iss.path.length ? String(iss.path[iss.path.length - 1]) : ''
      const pos = last ? findLineForKey(last) : { line: 1, col: 1 }
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `${iss.path.join('.') || '(root)'}: ${iss.message}`,
        startLineNumber: typeof pos === 'number' ? pos : pos.line,
        startColumn: typeof pos === 'number' ? 1 : Math.max(1, pos.col),
        endLineNumber: typeof pos === 'number' ? pos : pos.line,
        endColumn: 200
      })
    }
    monaco.editor.setModelMarkers(model, 'zod', markers)
  }

  const clearMarkers = () => {
    const monaco = monacoRef.current
    const editor = editorRef.current
    if (!monaco || !editor) return
    const model = editor.getModel()
    if (!model) return
    monaco.editor.setModelMarkers(model, 'zod', [])
  }

  const load = async () => {
    setLoading(true)
    setStatus({kind:'info', msg:'Lade…'})
    clearMarkers()
    try {
      const data = await apiGet(name)
      setText(JSON.stringify(data, null, 2))
      setStatus({kind:'success', msg:'Geladen ✓'})
    } catch (e:any) {
      if (e instanceof ApiError && e.status === 401) {
        setStatus({kind:'error', msg:'Nicht autorisiert oder Sitzung abgelaufen – bitte erneut anmelden.'})
        onAuthError()
      } else {
        setStatus({kind:'error', msg:`Fehler: ${e.message || String(e)}`})
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [name])

  const validate = () => {
    try {
      const obj = JSON.parse(text)
      const schema = schemaByTab[name]
      const parsed = schema.parse(obj)
      setStatus({kind:'success', msg:'JSON & Schema gültig ✓'})
      clearMarkers()
      return parsed
    } catch (e:any) {
      // Zod-Fehler schön aufbereiten + Marker setzen
      const issues = (e?.issues || e?.errors || []).map((x:any) => ({
        path: x.path || [],
        message: x.message || 'Ungültig'
      }))
      setStatus({kind:'error', msg: 'Ungültig: ' + (issues.map(i => `${i.path.join('.')||'(root)'}: ${i.message}`).join(' | ') || e.message)})
      setMarkers(issues)
      return null
    }
  }

  const prettify = () => {
    try {
      const obj = JSON.parse(text)
      setText(JSON.stringify(obj, null, 2))
      setStatus({kind:'success', msg:'Formatiert ✓'})
    } catch (e:any) {
      setStatus({kind:'error', msg:'Formatieren fehlgeschlagen: ' + e.message})
    }
  }

  const save = async () => {
    const parsed = validate()
    if (!parsed) return
    try {
      await apiSave(name, parsed)
      setStatus({kind:'success', msg:'Gespeichert ✓ (Backup erstellt)'})
    } catch (e:any) {
      if (e instanceof ApiError && e.status === 401) {
        setStatus({kind:'error', msg:'Nicht autorisiert oder Sitzung abgelaufen – bitte erneut anmelden.'})
        onAuthError()
      } else if (e instanceof ApiError && e.status === 400) {
        // Server-seitige Schemafehler zeigen
        try {
          const details = JSON.parse(e.message).details || []
          const issues = (Array.isArray(details) ? details : []).map((x:any)=>({ path: x.path||[], message: x.message||'Ungültig' }))
          setMarkers(issues)
        } catch { /* noop */ }
        setStatus({kind:'error', msg:'Schema-Validierung fehlgeschlagen (Server) – Details im Editor markiert.'})
      } else {
        setStatus({kind:'error', msg:'Speichern fehlgeschlagen: ' + (e.message || String(e))})
      }
    }
  }

  const download = () => {
    const blob = new Blob([text], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${name}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const upload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result || ''))
    reader.readAsText(file)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {status && <div className="w-full md:w-auto md:min-w-[360px]"><Banner kind={status.kind}>{status.msg}</Banner></div>}
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Editor
          height="480px"
          defaultLanguage="json"
          value={text}
          onChange={(v)=> setText(v || '')}
          onMount={onMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            automaticLayout: true,
            scrollBeyondLastLine: false
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button disabled={loading} className="rounded-xl border px-3 py-2" onClick={load}>Neu laden</button>
        <button className="rounded-xl border px-3 py-2" onClick={validate}>Validieren</button>
        <button className="rounded-xl border px-3 py-2" onClick={prettify}>Schön formatieren</button>
        <button className="rounded-xl bg-slate-900 text-white px-3 py-2" onClick={save}>Speichern</button>
        <button className="rounded-xl border px-3 py-2" onClick={download}>Herunterladen</button>
        <label className="rounded-xl border px-3 py-2 cursor-pointer">
          <input hidden type="file" accept=".json,application/json" onChange={e=>{ const f=e.target.files?.[0]; if(f) upload(f) }} />
          Aus Datei laden…
        </label>
      </div>
    </div>
  )
}

/* ---------- Admin-Seite ---------- */
export default function AdminPage(){
  const [pw, setPw] = useState<string>(sessionStorage.getItem('adminPassword') || '')
  const [ok, setOk] = useState<boolean>(false)
  const [tab, setTab] = useState<Tab>('pricelist')
  const [checking, setChecking] = useState<boolean>(true)
  const [loginError, setLoginError] = useState<string>('')

  useEffect(() => {
    (async ()=>{
      if (!pw) { setChecking(false); return }
      const good = await apiCheckPassword(pw)
      setOk(good); setChecking(false)
      setLoginError(good ? '' : 'Sitzung abgelaufen – bitte erneut anmelden.')
    })()
  }, [])

  const login = async () => {
    const good = await apiCheckPassword(pw)
    if (good) { setOk(true); setAdminPassword(pw); setLoginError('') }
    else { setLoginError('Passwort falsch oder Server nicht erreichbar.') }
  }
  const logout = () => {
    clearAdminPassword()
    setOk(false)
    setPw('')
    setLoginError('')
  }

  const onAuthError = () => {
    // Wird von SectionEditor bei 401 aufgerufen
    logout()
  }

  if (checking) return <div className="p-6">Prüfe Zugriff…</div>

  if (!ok) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin • Datenverwaltung</h1>
          <a href="#/" className="text-sm underline">Zurück</a>
        </div>

        {loginError && <Banner kind="error">{loginError}</Banner>}

        <div className="rounded-2xl border p-4 space-y-3 bg-white">
          <label className="text-sm">Passwort</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={pw}
            onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') login() }}
          />
          <div className="flex gap-2">
            <button className="rounded-xl bg-slate-900 text-white px-4 py-2" onClick={login}>Anmelden</button>
            <a href="#/" className="rounded-xl border px-4 py-2">Abbrechen</a>
          </div>
          <p className="text-xs text-slate-500">
            Hinweis: In Produktion HTTPS nutzen und <code>ADMIN_PASSWORD</code> per ENV setzen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin • Datenverwaltung</h1>
        <div className="flex items-center gap-3">
          <a href="#/" className="underline text-sm">Zurück</a>
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={logout}>Abmelden</button>
        </div>
      </div>

      <div className="rounded-2xl border p-2 inline-flex gap-2 bg-white">
        <button className={`px-3 py-2 rounded-xl ${tab==='pricelist'?'bg-slate-900 text-white':'border'}`} onClick={()=>setTab('pricelist')}>Preisliste</button>
        <button className={`px-3 py-2 rounded-xl ${tab==='groupinfo'?'bg-slate-900 text-white':'border'}`} onClick={()=>setTab('groupinfo')}>Gruppen</button>
        <button className={`px-3 py-2 rounded-xl ${tab==='labor'?'bg-slate-900 text-white':'border'}`} onClick={()=>setTab('labor')}>Arbeitskosten</button>
      </div>

      <div className="rounded-2xl border p-4 bg-white">
        {tab === 'pricelist' && <SectionEditor name="pricelist" onAuthError={onAuthError} />}
        {tab === 'groupinfo' && <SectionEditor name="groupinfo" onAuthError={onAuthError} />}
        {tab === 'labor' && <SectionEditor name="labor" onAuthError={onAuthError} />}
      </div>
    </div>
  )
}
