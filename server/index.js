// Admin-CRUD: zwingend ?lang=de|en; .env wird robust geladen; klare Start-Logs

import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { config as dotenvConfig } from 'dotenv'

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1) .env laden – zuerst aus CWD, falls man im Projektroot startet …
dotenvConfig({ path: path.resolve(process.cwd(), '.env') })
// … wenn ADMIN_PASSWORD noch fehlt, versuche .env relativ zu /server
if (!process.env.ADMIN_PASSWORD) {
  dotenvConfig({ path: path.resolve(__dirname, '../.env') })
}

// 2) Basis-Settings
const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const PORT = process.env.PORT || 5174
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

// Datenverzeichnis STABIL relativ zu /server/index.js
const dataDir = path.resolve(__dirname, '../public/data')
const allowed = new Set(['pricelist', 'groupinfo', 'labor'])
const allowedLangs = new Set(['de', 'en'])

// Start-Logs (ohne Passwort im Klartext)
console.log('[admin] Data dir:', dataDir)
console.log('[admin] ADMIN_PASSWORD source:', process.env.ADMIN_PASSWORD ? '.env' : 'default')
console.log('[admin] ADMIN_PASSWORD length:', (ADMIN_PASSWORD || '').length)

// Request-Log (hilfreich bei Debug; bei Bedarf auskommentieren)
app.use((req, _res, next) => {
  const auth = (req.headers.authorization || '').slice(0, 16)
  console.log('[req]', req.method, req.url, 'Auth:', auth ? `${auth}…` : '(none)')
  next()
})

// ---- Auth ----
function requireAuth(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
function mustLang(req, res) {
  const lang = String(req.query.lang || '')
  if (!allowedLangs.has(lang)) {
    res.status(400).json({ error: 'missing or invalid lang. use ?lang=de|en' })
    return null
  }
  return lang
}
function resolveFileStrict(name, lang) {
  if (!allowed.has(name)) return null
  return path.join(dataDir, `${name}.${lang}.json`)
}

// ---- Routes ----
app.get('/api/health', requireAuth, (_req, res) => {
  res.json({ ok: true })
})

// Lesen (lang Pflicht)
app.get('/api/file/:name', requireAuth, async (req, res) => {
  const { name } = req.params
  const lang = mustLang(req, res)
  if (!lang) return
  const fp = resolveFileStrict(name, lang)
  if (!fp) return res.status(400).json({ error: 'invalid name' })
  try {
    const raw = await fs.readFile(fp, 'utf-8')
    res.type('application/json').send(raw)
  } catch (e) {
    if (e.code === 'ENOENT') {
      return res.status(404).json({ error: 'file not found', file: path.basename(fp) })
    }
    res.status(500).json({ error: String(e) })
  }
})

// Schreiben (lang Pflicht)
app.put('/api/file/:name', requireAuth, async (req, res) => {
  const { name } = req.params
  const lang = mustLang(req, res)
  if (!lang) return
  const fp = resolveFileStrict(name, lang)
  if (!fp) return res.status(400).json({ error: 'invalid name' })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const pretty = JSON.stringify(body, null, 2) + '\n'
    await fs.mkdir(path.dirname(fp), { recursive: true })
    await fs.writeFile(fp, pretty, 'utf-8')
    res.json({ ok: true, file: path.basename(fp) })
  } catch (e) {
    if (e instanceof SyntaxError) {
      return res.status(400).json({ error: 'invalid json', detail: e.message })
    }
    res.status(500).json({ error: String(e) })
  }
})

// (Optional) dist ausliefern, wenn du lokal auch das Frontend serven willst
app.use(express.static(path.resolve(__dirname, '../dist')))

// ---- Start ----
app.listen(PORT, () => {
  console.log(`[admin] API running on http://localhost:${PORT}`)
})
