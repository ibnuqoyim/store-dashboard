
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const BASE_PATH = path.join(__dirname, '../../') // CSVs are in grandparent dir

const CSV_FILES = [
    { path: 'order.csv', batchName: 'Batch Regular' },
    { path: 'order_030401.csv', batchName: 'Batch 3-4 Feb' },
    { path: 'order_282901.csv', batchName: 'Batch 28-29 Jan' }
]

async function seed() {
    console.log('🌱 Starting seed process...')

    // 1. Read Adonan & Products (Metadata)
    console.log('Reading Metadata CSVs...')

    let adonanData: any[] = []
    let produkData: any[] = []

    try {
        const adonanFile = fs.readFileSync(path.join(BASE_PATH, 'adonan.csv'), 'utf8')
        const produkFile = fs.readFileSync(path.join(BASE_PATH, 'produk.csv'), 'utf8')

        adonanData = Papa.parse<any>(adonanFile, { header: true }).data.filter(r => r.adonan)
        produkData = Papa.parse<any>(produkFile, { header: true }).data.filter(r => r.nama_produk)
    } catch (err: any) {
        console.error('Error reading metadata CSVs:', err.message)
        process.exit(1)
    }

    // 2. Insert Adonan
    console.log('Inserting Adonan...')
    const adonanMap = new Map<string, string>() // Name -> ID

    for (const row of adonanData) {
        const { data, error } = await supabase
            .from('adonan')
            .upsert({
                name: row.adonan,
                weight: parseInt(row.berat) || 0
            }, { onConflict: 'name' })
            .select('id, name')
            .single()

        if (error) console.error(`Error inserting adonan: ${row.adonan}`, error)
        else if (data) adonanMap.set(data.name, data.id)
    }

    // 3. Insert Products & Delivery Types
    console.log('Inserting Products...')
    const productMap = new Map<string, { id: string, price: number }>() // Name -> { ID, Price }
    const deliveryTypes = new Set<string>()

    for (const row of produkData) {
        const isDelivery = row.nama_produk.toLowerCase().includes('ongkir') ||
            row.nama_produk.toLowerCase().includes('ongkos kirim')

        if (isDelivery) {
            deliveryTypes.add(row.nama_produk)
            continue
        }

        const { data, error } = await supabase
            .from('products')
            .upsert({
                name: row.nama_produk,
                price: parseInt(row.harga) || 0,
                dough_id: adonanMap.get(row.adonan) || null,
                weight: parseInt(row.berat) || 0
            }, { onConflict: 'name' })
            .select('id, price')
            .single()

        if (error) console.error(`Error inserting product: ${row.nama_produk}`, error)
        else if (data) productMap.set(row.nama_produk, { id: data.id, price: data.price })
    }


    // 4. Process Batches & Orders
    for (const batch of CSV_FILES) {
        console.log(`Processing ${batch.batchName}...`)

        try {
            const filePath = path.join(BASE_PATH, batch.path)
            if (!fs.existsSync(filePath)) {
                console.log(`Skipping batch ${batch.batchName}: File not found (${batch.path})`)
                continue
            }

            const orderFile = fs.readFileSync(filePath, 'utf8')
            const orderData = Papa.parse<any>(orderFile, { header: true }).data.filter(r => r.invoice_number)

            // Create or Get Batch PO
            const { data: batchData, error: batchError } = await supabase
                .from('batch_po')
                .upsert({ name: batch.batchName }, { onConflict: 'name' })
                .select('id')
                .single()

            if (batchError) {
                console.error(`Error creating batch ${batch.batchName}:`, batchError)
                continue
            }
            const batchId = batchData.id

            // Group orders by invoice
            const ordersMap = new Map<string, {
                date: string, customer: string, phone: string, status: string, items: any[], delivery: any
            }>()

            for (const row of orderData) {
                if (!ordersMap.has(row.invoice_number)) {
                    let cleanDate = row.tanggal
                    // Default to ISO if possible, or fallback
                    try {
                        // Check if date is like "4 Feb 2026"
                        if (row.tanggal.match(/\d{1,2} [A-Za-z]{3} \d{4}/)) {
                            cleanDate = new Date(row.tanggal).toISOString()
                        }
                    } catch (e) {
                        console.warn(`Date parse error for ${row.tanggal}, using raw string`)
                    }

                    ordersMap.set(row.invoice_number, {
                        date: cleanDate,
                        customer: row.nama_pelanggan,
                        phone: row.telepon,
                        status: row.status === 'paid' ? 'paid' : 'pending',
                        items: [],
                        delivery: null
                    })
                }

                const order = ordersMap.get(row.invoice_number)!

                // Check if Item is Product or Delivery
                if (deliveryTypes.has(row.nama_produk) || row.nama_produk.toLowerCase().includes('ongkir') || row.nama_produk.toLowerCase().includes('ongkos kirim')) {
                    order.delivery = {
                        courier: row.nama_produk,
                        cost: 0
                    }
                } else {
                    const product = productMap.get(row.nama_produk)
                    if (product) {
                        order.items.push({
                            product_id: product.id,
                            quantity: parseInt(row.quantity) || 1,
                            price: product.price
                        })
                    } else {
                        console.warn(`Product not found in database: ${row.nama_produk}`)
                    }
                }
            }

            // Insert Orders
            for (const [invoice, data] of ordersMap) {
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .upsert({
                        invoice_number: invoice,
                        date: data.date,
                        customer_name: data.customer,
                        phone: data.phone,
                        status: data.status,
                        po_id: batchId // Link to Batch
                    }, { onConflict: 'invoice_number' })
                    .select('id')
                    .single()

                if (orderError) {
                    console.error(`Error creating order: ${invoice}`, orderError)
                    continue
                }
                const orderId = orderData.id

                // Insert Items
                if (data.items.length > 0) {
                    await supabase.from('order_items').delete().eq('order_id', orderId)

                    const itemsPayload = data.items.map(item => ({
                        order_id: orderId,
                        ...item
                    }))
                    const { error } = await supabase.from('order_items').insert(itemsPayload)
                    if (error) console.error(`Error adding items to ${invoice}`, error)
                }

                // Insert Delivery
                if (data.delivery) {
                    await supabase.from('deliveries').delete().eq('order_id', orderId)
                    await supabase.from('deliveries').insert({
                        order_id: orderId,
                        courier_name: data.delivery.courier,
                        shipping_cost: 0,
                        status: 'pending'
                    })
                }
            }

        } catch (err: any) {
            console.error(`Error processing batch ${batch.batchName}:`, err)
        }
    }

    console.log('✅ Seeding complete!')
}

seed().catch(err => {
    console.error('Seeding failed:', err)
    process.exit(1)
})
