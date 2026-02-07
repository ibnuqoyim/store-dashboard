
'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, Truck, ArrowUp, ArrowDown, Search, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import InvoiceModal from './InvoiceModal'

type Order = {
    id: string
    invoice_number: string
    date: string
    customer_name: string
    phone?: string
    status: string
    order_items: {
        price: number
        quantity: number
        products: { name: string } | null
    }[]
    deliveries: {
        status: string
        courier_name: string
        shipping_cost?: number
    }[]
    po_id?: string
}

export default function OrderList({ initialOrders, batches }: { initialOrders: Order[], batches: any[] }) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedBatchId, setSelectedBatchId] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [logoBase64, setLogoBase64] = useState<string | null>(null)
    const [logoDims, setLogoDims] = useState<{ width: number; height: number } | null>(null)
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
        let result = initialOrders

        // Filter by Batch
        if (selectedBatchId !== 'all') {
            result = result.filter(o => o.po_id === selectedBatchId)
        }

        // Filter by Search Term (Customer Name or Invoice Number)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(o =>
                o.customer_name.toLowerCase().includes(lowerSearch) ||
                o.invoice_number.toLowerCase().includes(lowerSearch)
            )
        }

        // Sort by Invoice Number
        return [...result].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.invoice_number.localeCompare(b.invoice_number, undefined, { numeric: true })
            } else {
                return b.invoice_number.localeCompare(a.invoice_number, undefined, { numeric: true })
            }
        })
    }, [initialOrders, selectedBatchId, searchTerm, sortOrder])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return

        setIsLoading(true)
        const { error } = await supabase.from('orders').delete().eq('id', id)
        setIsLoading(false)

        if (error) {
            alert('Error deleting order: ' + error.message)
        } else {
            router.refresh()
        }
    }

    const handleViewInvoice = (order: Order) => {
        setSelectedOrder(order)
        setIsModalOpen(true)
    }

    const handleDownloadInvoice = async (order: Order) => {
        try {
            // @ts-ignore
            const jsPDF = (await import('jspdf')).default

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            // Add watermark first if available
            if (logoBase64 && logoDims) {
                console.log('Attempting to add watermark to PDF...')
                try {
                    // Convert PNG to canvas to strip metadata
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    const img = new Image()

                    // Wait for image to load
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = logoBase64
                    })

                    canvas.width = logoDims.width
                    canvas.height = logoDims.height

                    // Clear canvas with transparency
                    ctx?.clearRect(0, 0, canvas.width, canvas.height)
                    ctx?.drawImage(img, 0, 0)

                    // Get clean PNG data without problematic metadata
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

                    console.log('Adding watermark at:', { x, y, width: renderWidth / 1.5, height: renderHeight / 1.5 })
                    doc.saveGraphicsState()
                    // @ts-ignore - jsPDF GState type issue
                    doc.setGState(new (doc as any).GState({ opacity: 0.2 }))
                    doc.addImage(cleanImageData, 'PNG', x, y, renderWidth / 1.5, renderHeight / 1.5)
                    doc.restoreGraphicsState()
                    console.log('Watermark added successfully')
                } catch (error) {
                    console.error('Error adding watermark:', error)
                    // Continue without watermark if it fails
                }
            } else {
                console.log('Skipping watermark - logoBase64:', !!logoBase64, 'logoDims:', !!logoDims)
            }

            // Invoice Header
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.text('Invoice', 200, 20, { align: 'right' })

            doc.setFontSize(16)
            doc.text('Sourdoughmu_ya!', 200, 30, { align: 'right' })

            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('No HP', 200, 36, { align: 'right' })
            doc.text('087722732214', 200, 41, { align: 'right' })

            // Bill To Section
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('BILL TO', 10, 55)
            doc.setFont('helvetica', 'normal')
            doc.text(order.customer_name, 10, 61)
            if (order.phone) doc.text(order.phone, 10, 66)

            // Invoice Details
            doc.setFont('helvetica', 'bold')
            doc.text('Invoice #', 140, 55)
            doc.text('Date', 140, 61)
            doc.text('Due date', 140, 67)

            doc.setFont('helvetica', 'normal')
            doc.text(order.invoice_number, 165, 55)
            doc.text(format(new Date(order.date), 'dd MMM yyyy'), 165, 61)
            doc.text(format(new Date(order.date), 'dd MMM yyyy'), 165, 67)

            // Table Header
            let yPos = 85
            doc.setFillColor(240, 240, 240)
            doc.rect(10, yPos - 5, 190, 8, 'F')
            doc.setFont('helvetica', 'bold')
            doc.text('Item', 12, yPos)
            doc.text('Qty', 120, yPos, { align: 'center' })
            doc.text('Price', 155, yPos, { align: 'right' })
            doc.text('Amount', 195, yPos, { align: 'right' })

            // Table Rows
            yPos += 8
            doc.setFont('helvetica', 'normal')
            let subtotal = 0

            order.order_items?.forEach((item) => {
                const amount = item.price * item.quantity
                subtotal += amount

                doc.text(item.products?.name || 'Unknown', 12, yPos)
                doc.text(item.quantity.toString(), 120, yPos, { align: 'center' })
                doc.text(formatRupiah(item.price), 155, yPos, { align: 'right' })
                doc.text(formatRupiah(amount), 195, yPos, { align: 'right' })
                yPos += 6
            })

            // Shipping
            if (order.deliveries && order.deliveries.length > 0) {
                const delivery = order.deliveries[0]
                const shippingCost = delivery.shipping_cost || 0
                subtotal += shippingCost

                doc.text(`Shipping (${delivery.courier_name})`, 12, yPos)
                doc.text('1', 120, yPos, { align: 'center' })
                doc.text(shippingCost > 0 ? formatRupiah(shippingCost) : '-', 155, yPos, { align: 'right' })
                doc.text(shippingCost > 0 ? formatRupiah(shippingCost) : '-', 195, yPos, { align: 'right' })
                yPos += 6
            }

            // Totals
            yPos += 5
            doc.setFont('helvetica', 'bold')
            doc.text('Subtotal', 155, yPos, { align: 'right' })
            doc.text(formatRupiah(subtotal), 195, yPos, { align: 'right' })

            yPos += 8
            doc.setFontSize(12)
            doc.text('Total', 155, yPos, { align: 'right' })
            doc.text(formatRupiah(subtotal), 195, yPos, { align: 'right' })

            // Amount Due Box
            yPos += 10
            doc.setFillColor(240, 240, 240)
            doc.rect(10, yPos - 5, 190, 15, 'F')
            doc.setFontSize(11)
            doc.text('Amount Due', 12, yPos + 3)
            doc.setFontSize(16)
            doc.text(formatRupiah(subtotal), 195, yPos + 3, { align: 'right' })

            // Payment Info
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

            // Save PDF
            doc.save(`Invoice-${order.invoice_number}-${order.customer_name}.pdf`)
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Failed to generate PDF. Please try again.')
        }
    }

    const calculateTotal = (order: Order) => {
        // Safe check for order_items being null/undefined
        if (!order.order_items) return 0
        return order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full md:w-auto">
                    <h1 className="text-2xl font-bold text-gray-800 mr-4">Orders</h1>

                    {/* Search Input */}
                    <div className="relative flex-1 w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Customer or Invoice..."
                            className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Batch Filter */}
                    <select
                        className="border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900 w-full md:w-auto"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                    >
                        <option value="all">All Batches</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <Link
                    href="/orders/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition w-full md:w-auto justify-center"
                >
                    <Plus size={18} /> New Order
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none group"
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            >
                                <div className="flex items-center gap-1 group-hover:text-gray-700">
                                    Invoice
                                    {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => {
                            const delivery = order.deliveries?.[0]
                            return (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        <Link href={`/orders/${order.id}`}>{order.invoice_number}</Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(order.date), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatRupiah(calculateTotal(order))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {delivery ? (
                                            <div className="flex items-center gap-2">
                                                <Truck size={14} />
                                                <span>{delivery.courier_name}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleViewInvoice(order)}
                                                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded"
                                                title="View Invoice"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadInvoice(order)}
                                                className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                                                title="Download PDF"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <Link href={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded inline-block">
                                                <Pencil size={18} />
                                            </Link>
                                            <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <InvoiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
            />
        </div>
    )
}
