const getPW = () => sessionStorage.getItem('adminPassword') || ''

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(text || `${res.status} ${res.statusText}`, res.status)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}

export async function apiGet(name: 'pricelist'|'groupinfo'|'labor') {
  const r = await fetch(`/api/file/${name}`, {
    headers: { Authorization: `Bearer ${getPW()}` }
  })
  return handle(r)
}

export async function apiSave(name: 'pricelist'|'groupinfo'|'labor', data: any) {
  const r = await fetch(`/api/file/${name}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getPW()}`
    },
    body: JSON.stringify(data)
  })
  return handle(r)
}

export async function apiCheckPassword(pw: string) {
  const r = await fetch('/api/health', {
    headers: { Authorization: `Bearer ${pw}` }
  })
  return r.ok
}

export function setAdminPassword(pw: string) {
  sessionStorage.setItem('adminPassword', pw)
}
export function clearAdminPassword() {
  sessionStorage.removeItem('adminPassword')
}

export { ApiError }
