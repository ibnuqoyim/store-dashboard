import http from 'node:http'

const PORT = 54321

const mockStoreInfo = {
  id: 'store-001',
  name: 'Sourdoughmu_ya Bakery',
  address: 'Jl. Roti Lezat No. 1',
  phone: '08123456789',
  email: 'owner@sourdoughmu.com',
  opening_hours: '08:00 - 17:00',
  is_active: true,
  currency: 'IDR',
  locale: 'id-ID',
  primary_color: '#6366f1',
  modules_enabled: ['batch-pos', 'orders', 'products', 'customers', 'adonan', 'resep', 'inventory'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockBatches = [
  {
    id: 'batch-001',
    name: 'Batch Pagi 16 Sept',
    description: 'Produksi Pagi',
    created_at: '2026-09-16T06:00:00.000Z',
  },
]

const mockCustomers = [
  {
    id: 'cust-001',
    name: 'Dewi Sartika',
    phone: '081234567890',
    address: 'Jl. Melati No. 5',
    default_courier: 'Ahsan',
  },
]

const mockProducts = [
  {
    id: 'prod-001',
    name: 'Sourdough Country Loaf',
    price: 45000,
    image_url: null,
    dough_id: 'dough-001',
    adonan: { name: 'Adonan Sourdough' },
  },
  {
    id: 'prod-002',
    name: 'Milk Bread Toast',
    price: 25000,
    image_url: null,
    dough_id: 'dough-002',
    adonan: { name: 'Adonan Milk Bread' },
  },
  {
    id: 'prod-003',
    name: 'Butter Croissant',
    price: 18000,
    image_url: null,
    dough_id: null,
    adonan: null,
  },
]

const mockDoughs = [
  { id: 'dough-001', name: 'Adonan Sourdough' },
  { id: 'dough-002', name: 'Adonan Milk Bread' },
]

const mockHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
const mockPayload = Buffer.from(JSON.stringify({
  sub: '11111111-1111-1111-1111-111111111111',
  email: 'owner@sourdoughmu.com',
  role: 'authenticated',
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600 * 24,
})).toString('base64url')
const MOCK_JWT = `${mockHeader}.${mockPayload}.signature`

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const pathname = url.pathname

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Auth: Token exchange
  if (pathname === '/auth/v1/token') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      let isInvalid = false
      try {
        const parsed = JSON.parse(body)
        if (parsed.email === 'wronguser@example.com' || parsed.password === 'wrongpassword123') {
          isInvalid = true
        }
      } catch {
        // ignore
      }

      if (isInvalid) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          message: 'Invalid login credentials',
          msg: 'Invalid login credentials',
        }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        access_token: MOCK_JWT,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'owner@sourdoughmu.com',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      }))
    })
    return
  }

  // Auth: Get User
  if (pathname === '/auth/v1/user') {
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'Invalid JWT' }))
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      id: '11111111-1111-1111-1111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'owner@sourdoughmu.com',
    }))
    return
  }

  // REST API Endpoints
  const acceptHeader = req.headers.accept || ''
  const isSingleObject = acceptHeader.includes('application/vnd.pgrst.object+json')

  if (pathname.startsWith('/rest/v1/store_info')) {
    res.writeHead(200, { 'Content-Type': isSingleObject ? 'application/vnd.pgrst.object+json' : 'application/json' })
    res.end(JSON.stringify(isSingleObject ? mockStoreInfo : [mockStoreInfo]))
    return
  }

  if (pathname.startsWith('/rest/v1/batch_po')) {
    res.writeHead(200, { 'Content-Type': isSingleObject ? 'application/vnd.pgrst.object+json' : 'application/json' })
    res.end(JSON.stringify(isSingleObject ? mockBatches[0] : mockBatches))
    return
  }

  if (pathname.startsWith('/rest/v1/customers')) {
    if (req.method === 'POST') {
      res.writeHead(201, { 'Content-Type': isSingleObject ? 'application/vnd.pgrst.object+json' : 'application/json' })
      res.end(JSON.stringify(isSingleObject ? mockCustomers[0] : [mockCustomers[0]]))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(mockCustomers))
    return
  }

  if (pathname.startsWith('/rest/v1/products')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(mockProducts))
    return
  }

  if (pathname.startsWith('/rest/v1/adonan')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(mockDoughs))
    return
  }

  if (pathname.startsWith('/rest/v1/orders')) {
    if (req.method === 'POST') {
      const resp = isSingleObject ? { id: 'order-new-001', invoice_number: 'INV-2026-0001' } : [{ id: 'order-new-001', invoice_number: 'INV-2026-0001' }]
      res.writeHead(201, { 'Content-Type': isSingleObject ? 'application/vnd.pgrst.object+json' : 'application/json' })
      res.end(JSON.stringify(resp))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify([]))
    return
  }

  if (pathname.startsWith('/rest/v1/order_items')) {
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify([{ id: 'item-new-001' }]))
    return
  }

  if (pathname.startsWith('/rest/v1/deliveries')) {
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify([{ id: 'del-new-001' }]))
    return
  }

  // Fallback for any other table query
  if (req.method === 'POST') {
    res.writeHead(201, { 'Content-Type': isSingleObject ? 'application/vnd.pgrst.object+json' : 'application/json' })
    res.end(JSON.stringify(isSingleObject ? { id: 'gen-001' } : [{ id: 'gen-001' }]))
    return
  }

  res.writeHead(200, { 'Content-Type': isSingleObject ? 'application/vnd.pgrst.object+json' : 'application/json' })
  res.end(JSON.stringify(isSingleObject ? {} : []))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock Supabase server running on http://127.0.0.1:${PORT}`)
})
