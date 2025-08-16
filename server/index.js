import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8787
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me'

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const dataDir = path.resolve(process.cwd(), 'public', 'data')
const backupsDir = path.join(dataDir, 'backups')
const allowed = new Set(['pricelist', 'groupinfo', 'labor'])

app.use((req, _res, next) => {
  const auth = req.headers.authorization ? 'auth' : 'no-auth'
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} (${auth})`)
  next()
})

function auth(req, res, next) {
  const h = req.headers['authorization'] || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

/* ---------- Zod-Schemas ---------- */
const zMoney = z.union([
  z.object({ type: z.literal('value'), eur: z.number().nonnegative() }),
  z.object({ type: z.literal('on_request') })
])

const zOption = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: zMoney
})

const zProduct = z.object({
  id: z.string().min(1),
  typ: z.string().min(1),            // <— NEU
  name: z.string().min(1),
  group: z.string().min(1),
  category: z.string().min(1),
  basePrice: zMoney,
  options: z.array(zOption),
  sku: z.string().optional(),
  short: z.string().optional(),
  specs: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional()
})

const zPriceList = z.object({
  currency: z.literal('EUR'),
  updated: z.string().min(4),
  products: z.array(zProduct)
})

const zGroupInfoSection = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string())
})
const zGroupInfo = z.object({
  title: z.string().min(1),
  sections: z.array(zGroupInfoSection)
})
const zGroupInfoData = z.object({
  categories: z.record(
    z.object({
      groups: z.record(zGroupInfo)
    })
  )
})

// Labor (ohne 'typ')
const zLaborCost = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  group: z.string().optional(),
  machine: z.string().optional(),
  avgDays: z.number().int().nonnegative(),
  dayRateEur: z.number().nonnegative()
})
const zLaborData = z.object({
  currency: z.literal('EUR'),
  updated: z.string().min(4),
  items: z.array(zLaborCost)
})

const schemaMap = { pricelist: zPriceList, groupinfo: zGroupInfoData, labor: zLaborData }

async function ensureDirs() {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.mkdir(backupsDir, { recursive: true })
}

/* ---------- Routes ---------- */

// Auth-geschützter Healthcheck
app.get('/api/health', auth, (req, res) => res.json({ ok: true }))

// Lesen
app.get('/api/file/:name', auth, async (req, res) => {
  const { name } = req.params
  if (!allowed.has(name)) return res.status(400).json({ error: 'invalid name' })
  try {
    await ensureDirs()
    const fp = path.join(dataDir, `${name}.json`)
    const raw = await fs.readFile(fp, 'utf-8')
    // weiche Validierung beim Lesen (nur Log)
    try { schemaMap[name].parse(JSON.parse(raw)) } catch (e) {
      console.warn(`Warnung: ${name}.json verletzt Schema:`, e?.errors ?? String(e))
    }
    res.type('application/json').send(raw)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// Schreiben
app.put('/api/file/:name', auth, async (req, res) => {
  const { name } = req.params
  if (!allowed.has(name)) return res.status(400).json({ error: 'invalid name' })
  const body = req.body
  if (typeof body !== 'object' || body === null) {
    return res.status(400).json({ error: 'body must be JSON object/array' })
  }
  try {
    await ensureDirs()
    // harte Validierung
    try { schemaMap[name].parse(body) }
    catch (e) { return res.status(400).json({ error: 'Schema-Validierung fehlgeschlagen', details: e.errors ?? String(e) }) }

    const file = `${name}.json`
    const fp = path.join(dataDir, file)

    // Backup
    try {
      const prev = await fs.readFile(fp, 'utf-8')
      const now = new Date().toISOString().replaceAll(':', '-')
      await fs.writeFile(path.join(backupsDir, `${name}-${now}.json`), prev, 'utf-8')
    } catch {}

    // Schreiben (pretty)
    await fs.writeFile(fp, JSON.stringify(body, null, 2) + '\n', 'utf-8')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
  console.log(`Data dir: ${dataDir}`)
  console.log(`Auth: Bearer <ADMIN_PASSWORD>`)
})
