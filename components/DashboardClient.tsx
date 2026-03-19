
'use client'

import { useState, useMemo, useEffect } from 'react'
import { PlusCircle, Download, Pencil, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import InvoiceModal from '@/components/InvoiceModal'
import DashboardCustomizer from '@/components/DashboardCustomizer'
import { format } from 'date-fns'
import Link from 'next/link'
// @ts-ignore
import { useRouter } from 'next/navigation'
import {
    WidgetId,
    WidgetConfig,
    WIDGET_REGISTRY,
    DEFAULT_WIDGET_CONFIG,
    WIDGET_STORAGE_KEY,
} from '@/lib/widgetRegistry'

type DashboardProps = {
    orders: any[]
    products: any[]
    adonan: any[]
    batches: any[]
}

export default function DashboardClient({ orders, products, adonan, batches }: DashboardProps) {
    const defaultBatchId = useMemo(() => batches.length > 0 ? batches[batches.length - 1].id : 'all', [batches])
    const [selectedBatchId, setSelectedBatchId] = useState<string>(defaultBatchId)
    const [isInitialized, setIsInitialized] = useState(false)

    // Batch persistence
    useEffect(() => {
        const saved = localStorage.getItem('dashboard_selected_batch')
        if (saved) {
            const isValid = saved === 'all' || batches.some(b => b.id === saved)
            if (isValid) {
                setSelectedBatchId(saved)
            } else {
                setSelectedBatchId(defaultBatchId)
            }
        } else {
            setSelectedBatchId(defaultBatchId)
        }
        setIsInitialized(true)
    }, [batches, defaultBatchId])

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('dashboard_selected_batch', selectedBatchId)
        }
    }, [selectedBatchId, isInitialized])

    // Widget config
    const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>(DEFAULT_WIDGET_CONFIG)
    const [customizerOpen, setCustomizerOpen] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem(WIDGET_STORAGE_KEY)
        if (saved) {
            try {
                const parsed: WidgetConfig[] = JSON.parse(saved)
                const knownIds = WIDGET_REGISTRY.map(w => w.id)
                const parsedIds = parsed.map(w => w.id)
                const isValid =
                    knownIds.length === parsedIds.length &&
                    knownIds.every(id => parsedIds.includes(id as WidgetId))
                if (isValid) setWidgetConfig(parsed)
            } catch {
                // fall back to defaults
            }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgetConfig))
    }, [widgetConfig])

    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
    const [logoBase64, setLogoBase64] = useState<string | null>(null)
    const [logoDims, setLogoDims] = useState<{ width: number; height: number } | null>(null)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const router = useRouter()
    const supabase = createClient()

    // Load logo for watermark
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await fetch('/logo.png')
                if (!response.ok) throw new Error('Logo not found')
                const blob = await response.blob()
                const reader = new FileReader()
                reader.onloadend = () => {
                    const base64data = reader.result as string
                    setLogoBase64(base64data)

                    const img = new Image()
                    img.onload = () => {
                        setLogoDims({ width: img.width, height: img.height })
                    }
                    img.src = base64data
                }
                reader.readAsDataURL(blob)
            } catch (error) {
                console.error('Error loading logo:', error)
            }
        }
        fetchLogo()
    }, [])

    const filteredOrders = useMemo(() => {
        let result = selectedBatchId === 'all' ? orders : orders.filter(o => o.po_id === selectedBatchId)

        if (searchQuery.trim()) {
            result = result.filter(o =>
                o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        result.sort((a, b) => {
            const invoiceA = a.invoice_number || ''
            const invoiceB = b.invoice_number || ''
            const comparison = invoiceA.localeCompare(invoiceB)
            return sortOrder === 'asc' ? comparison : -comparison
        })

        return result
    }, [orders, selectedBatchId, searchQuery, sortOrder])

    const stats = useMemo(() => {
        let totalOrders = filteredOrders.length
        let totalRevenue = 0
        let pendingCount = 0

        const productMap = new Map<string, any>()
        const adonanMap = new Map<string, any>()

        adonan.forEach(a => {
            adonanMap.set(a.name, { ...a, totalQuantity: 0, totalWeight: 0, weightPerBatch: a.weight })
        })

        filteredOrders.forEach(order => {
            if (order.status === 'pending') pendingCount++

            let orderRevenue = 0
            order.order_items.forEach((item: any) => {
                orderRevenue += (item.price || 0) * (item.quantity || 0)

                const pName = item.products?.name || 'Unknown'
                if (!productMap.has(pName)) {
                    productMap.set(pName, {
                        name: pName,
                        totalQuantity: 0,
                        price: item.price,
                        totalAmount: 0
                    })
                }
                const pEntry = productMap.get(pName)!
                pEntry.totalQuantity += item.quantity
                pEntry.totalAmount += (item.price * item.quantity)

                const productDef = products.find(p => p.id === item.product_id)
                if (productDef && productDef.adonan) {
                    const aName = productDef.adonan.name
                    if (adonanMap.has(aName)) {
                        const aEntry = adonanMap.get(aName)!
                        aEntry.totalQuantity += item.quantity
                        aEntry.totalWeight += (productDef.weight * item.quantity)
                    }
                }
            })

            totalRevenue += orderRevenue
        })

        const productSummary = Array.from(productMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)

        const adonanSummary = Array.from(adonanMap.values())
            .filter(a => a.totalWeight > 0)
            .sort((a, b) => b.totalWeight - a.totalWeight)
            .map(a => ({
                ...a,
                batchToMake: a.weightPerBatch > 0 ? (a.totalWeight / a.weightPerBatch).toFixed(2) : 0
            }))

        return { totalOrders, totalRevenue, pendingCount, productSummary, adonanSummary }
    }, [filteredOrders, products, adonan])

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number)
    }

    const handleGenerateInvoice = (order: any) => {
        setSelectedOrder(order)
        setInvoiceModalOpen(true)
    }

    const handleDownloadInvoice = async (order: any) => {
        try {
            // @ts-ignore
            const jsPDF = (await import('jspdf')).default

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            if (logoBase64 && logoDims) {
                try {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    const img = new Image()

                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = logoBase64
                    })

                    canvas.width = logoDims.width
                    canvas.height = logoDims.height
                    ctx?.clearRect(0, 0, canvas.width, canvas.height)
                    ctx?.drawImage(img, 0, 0)
                    const cleanImageData = canvas.toDataURL('image/png')

                    const pageWidth = doc.internal.pageSize.getWidth()
                    const pageHeight = doc.internal.pageSize.getHeight()
                    const imgWidth = logoDims.width
                    const imgHeight = logoDims.height
                    const imgRatio = imgWidth / imgHeight
                    const pageRatio = pageWidth / pageHeight

                    let renderWidth, renderHeight
                    if (imgRatio > pageRatio) {
                        renderWidth = pageWidth
                        renderHeight = pageWidth / imgRatio
                    } else {
                        renderHeight = pageHeight
                        renderWidth = pageHeight * imgRatio
                    }

                    const x = (pageWidth - renderWidth / 1.5) / 2
                    const y = (pageHeight - renderHeight / 1.5) / 2

                    doc.saveGraphicsState()
                    // @ts-ignore
                    doc.setGState(new (doc as any).GState({ opacity: 0.2 }))
                    doc.addImage(cleanImageData, 'PNG', x, y, renderWidth / 1.5, renderHeight / 1.5)
                    doc.restoreGraphicsState()
                } catch (error) {
                    console.error('Error adding watermark:', error)
                }
            }

            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.text('Invoice', 200, 20, { align: 'right' })
            doc.setFontSize(16)
            doc.text('Sourdoughmu_ya!', 200, 30, { align: 'right' })
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('No HP', 200, 36, { align: 'right' })
            doc.text('087722732214', 200, 41, { align: 'right' })

            doc.setFont('helvetica', 'bold')
            doc.text('BILL TO', 10, 55)
            doc.setFont('helvetica', 'normal')
            doc.text(order.customer_name, 10, 61)
            if (order.phone) doc.text(order.phone, 10, 66)

            doc.setFont('helvetica', 'bold')
            doc.text('Invoice #', 140, 55)
            doc.text('Date', 140, 61)
            doc.text('Due date', 140, 67)
            doc.setFont('helvetica', 'normal')
            doc.text(order.invoice_number, 165, 55)
            doc.text(format(new Date(order.date), 'dd MMM yyyy'), 165, 61)
            doc.text(format(new Date(order.date), 'dd MMM yyyy'), 165, 67)

            let yPos = 85
            doc.setFillColor(240, 240, 240)
            doc.rect(10, yPos - 5, 190, 8, 'F')
            doc.setFont('helvetica', 'bold')
            doc.text('Item', 12, yPos)
            doc.text('Qty', 120, yPos, { align: 'center' })
            doc.text('Price', 155, yPos, { align: 'right' })
            doc.text('Amount', 195, yPos, { align: 'right' })

            yPos += 8
            doc.setFont('helvetica', 'normal')
            let subtotal = 0

            order.order_items?.forEach((item: any) => {
                const amount = item.price * item.quantity
                subtotal += amount
                doc.text(item.products?.name || 'Unknown', 12, yPos)
                doc.text(item.quantity.toString(), 120, yPos, { align: 'center' })
                doc.text(formatRupiah(item.price), 155, yPos, { align: 'right' })
                doc.text(formatRupiah(amount), 195, yPos, { align: 'right' })
                yPos += 6
            })

            if (order.deliveries && order.deliveries.length > 0) {
                const delivery = order.deliveries[0]
                const shippingCost = delivery.shipping_cost || 0
                subtotal += shippingCost
                doc.text('Ongkir', 12, yPos)
                doc.text('1', 120, yPos, { align: 'center' })
                doc.text(shippingCost > 0 ? formatRupiah(shippingCost) : '-', 155, yPos, { align: 'right' })
                doc.text(shippingCost > 0 ? formatRupiah(shippingCost) : '-', 195, yPos, { align: 'right' })
                yPos += 6
            }

            yPos += 5
            doc.setFont('helvetica', 'bold')
            doc.text('Subtotal', 155, yPos, { align: 'right' })
            doc.text(formatRupiah(subtotal), 195, yPos, { align: 'right' })
            yPos += 8
            doc.setFontSize(12)
            doc.text('Total', 155, yPos, { align: 'right' })
            doc.text(formatRupiah(subtotal), 195, yPos, { align: 'right' })

            yPos += 10
            doc.setFillColor(240, 240, 240)
            doc.rect(10, yPos - 5, 190, 15, 'F')
            doc.setFontSize(11)
            doc.text('Amount Due', 12, yPos + 3)
            doc.setFontSize(16)
            doc.text(formatRupiah(subtotal), 195, yPos + 3, { align: 'right' })

            yPos += 25
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setFillColor(250, 250, 250)
            doc.rect(10, yPos - 3, 190, 25, 'F')
            doc.setFont('helvetica', 'bold')
            doc.text('Silahkan transfer ke rekening berikut :', 12, yPos + 2)
            doc.setFont('helvetica', 'normal')
            doc.text('• BRI : 367101015884504 a.n Sintia Nensih', 12, yPos + 7)
            doc.text('Harap megirimkan bukti transfer 1x24 jam.', 12, yPos + 12)
            doc.setFont('helvetica', 'bold')
            doc.text('Terima Kasih', 12, yPos + 18)
            doc.setFont('helvetica', 'normal')
            doc.text('Baarakallaahu fiikum', 12, yPos + 22)

            doc.save(`Invoice-${order.invoice_number}-${order.customer_name}.pdf`)
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Failed to generate PDF. Please try again.')
        }
    }

    const handleShareWhatsApp = async (order: any) => {
        try {
            await handleDownloadInvoice(order)

            let phone = order.phone?.replace(/\D/g, '') || ''
            if (phone.startsWith('0')) {
                phone = '62' + phone.substring(1)
            } else if (!phone.startsWith('62')) {
                phone = '62' + phone
            }

            const message = `Halo ${order.customer_name},\n\nBerikut adalah invoice untuk pesanan Anda:\n\nInvoice: ${order.invoice_number}\nTanggal: ${format(new Date(order.date), 'dd MMM yyyy')}\nTotal: ${formatRupiah(order.order_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))}\n\nTerima kasih telah berbelanja di Sourdoughmu_ya!\n\nBaarakallaahu fiikum 🥖`

            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            window.open(whatsappUrl, '_blank')
        } catch (error) {
            console.error('Error sharing to WhatsApp:', error)
            alert('Failed to share to WhatsApp. Please try again.')
        }
    }

    const handleCreateDelivery = async (order: any) => {
        if (order.deliveries && order.deliveries.length > 0) {
            router.push('/deliveries')
        } else {
            const confirmed = window.confirm(`Create delivery for Invoice #${order.invoice_number}?`)
            if (confirmed) {
                const { error } = await supabase.from('deliveries').insert({
                    order_id: order.id,
                    courier_name: 'TBD',
                    shipping_cost: 0,
                    status: 'pending'
                })

                if (error) {
                    alert('Failed to create delivery: ' + error.message)
                } else {
                    alert('Delivery created!')
                    router.refresh()
                }
            }
        }
    }

    // ─── Widget renderers ───────────────────────────────────────────────────────

    const renderWidget = (id: WidgetId) => {
        switch (id) {
            case 'stat-cards':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
                            <h3 className="text-sm font-medium opacity-90">Total Orders</h3>
                            <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-400 p-6 rounded-lg text-white shadow-lg">
                            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
                            <p className="text-3xl font-bold mt-2">{formatRupiah(stats.totalRevenue)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-400 to-pink-600 p-6 rounded-lg text-white shadow-lg">
                            <h3 className="text-sm font-medium opacity-90">Pending Invoices</h3>
                            <p className="text-3xl font-bold mt-2">{stats.pendingCount}</p>
                        </div>
                    </div>
                )

            case 'orders-table':
                return (
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">📋 Orders</h2>
                            <Link
                                href="/orders/new"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                            >
                                <PlusCircle size={18} /> Add New Order
                            </Link>
                        </div>

                        <div className="bg-white rounded-lg shadow p-4 mb-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <input
                                    type="text"
                                    placeholder="Search by customer name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
                                />
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                                >
                                    Invoice {sortOrder === 'asc' ? '↑' : '↓'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-500 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Invoice #</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.map(order => {
                                        let orderTotal = order.order_items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0)
                                        if (order.deliveries?.length > 0) orderTotal += (order.deliveries[0].shipping_cost || 0)

                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{order.invoice_number}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.date).toLocaleDateString('id-ID')}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="font-medium">{order.customer_name}</div>
                                                    <div className="text-gray-500 text-xs">{order.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{order.order_items.length} item(s)</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{formatRupiah(orderTotal)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <button
                                                            onClick={() => handleDownloadInvoice(order)}
                                                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-2 rounded flex items-center justify-center gap-1 text-xs sm:text-sm whitespace-nowrap"
                                                            title="Download PDF"
                                                        >
                                                            <Download size={16} /> PDF
                                                        </button>
                                                        <Link href={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded inline-flex items-center gap-1">
                                                            <Pencil size={18} /> Edit
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )

            case 'product-summary':
                return (
                    <div className="mb-8">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📦 Product Summary</h2>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-500 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Product Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Unit Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stats.productSummary.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{item.totalQuantity} unit(s)</td>
                                            <td className="px-6 py-4 text-gray-500">{formatRupiah(item.price)}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{formatRupiah(item.totalAmount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="px-6 py-4 text-right" colSpan={3}>TOTAL</td>
                                        <td className="px-6 py-4 text-gray-900">{formatRupiah(stats.totalRevenue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )

            case 'adonan-summary':
                return (
                    <div className="mb-8">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">🥖 Adonan Summary</h2>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-500 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Adonan Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total Quantity (Unit)</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total Weight (gr)</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Weight per Batch (gr)</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Batch to Make</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stats.adonanSummary.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{item.totalQuantity}</td>
                                            <td className="px-6 py-4 text-gray-500">{item.totalWeight}</td>
                                            <td className="px-6 py-4 text-gray-500">{item.weightPerBatch}</td>
                                            <td className="px-6 py-4 font-bold text-indigo-600">{item.batchToMake}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Dashboard</h1>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        className="flex-1 sm:flex-none border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-gray-900 text-sm"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                    >
                        <option value="all">All Batches</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setCustomizerOpen(true)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 text-gray-600"
                        title="Kustomisasi Dashboard"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Widgets */}
            {widgetConfig
                .filter(w => w.enabled)
                .map(w => (
                    <div key={w.id}>
                        {renderWidget(w.id)}
                    </div>
                ))
            }

            {/* Customizer panel */}
            <DashboardCustomizer
                isOpen={customizerOpen}
                onClose={() => setCustomizerOpen(false)}
                config={widgetConfig}
                onChange={setWidgetConfig}
            />

            {/* Invoice modal — kept outside widget map so it stays mounted */}
            <InvoiceModal
                isOpen={invoiceModalOpen}
                onClose={() => setInvoiceModalOpen(false)}
                order={selectedOrder}
            />
        </div>
    )
}
