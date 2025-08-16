const API_BASE = import.meta.env.VITE_API_URL || '/api'
const getPW = () => sessionStorage.getItem('adminPassword') || ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message); this.name = 'ApiError'; this.status = status
  }
}

async function handle(res: Response) {
  if (!res.ok) {
    let detail = ''
    try { const j = await res.json(); detail = j?.error || JSON.stringify(j) } catch {}
    throw new ApiError(`${res.status} ${res.statusText}${detail ? ` – ${detail}` : ''}`, res.status)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}

export async function apiCheckPassword(pw: string) {
  const r = await fetch(`${API_BASE}/health`, { headers: { Authorization: `Bearer ${pw}` } })
  return r.ok
}
export function setAdminPassword(pw: string) { sessionStorage.setItem('adminPassword', pw) }
export function clearAdminPassword() { sessionStorage.removeItem('adminPassword') }

type FileName = 'pricelist'|'groupinfo'|'labor'
type Lang = 'de'|'en'

export async function apiGet(name: FileName, lang: Lang) {
  const r = await fetch(`${API_BASE}/file/${name}?lang=${lang}`, {
    headers: { Authorization: `Bearer ${getPW()}` }
  })
  return handle(r)
}

export async function apiSave(name: FileName, data: any, lang: Lang) {
  const r = await fetch(`${API_BASE}/file/${name}?lang=${lang}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getPW()}` },
    body: JSON.stringify(data)
  })
  return handle(r)
}
