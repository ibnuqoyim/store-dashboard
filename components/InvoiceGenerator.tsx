
'use client'

import { useState, useRef } from 'react'
import { Printer } from 'lucide-react'

export default function InvoiceGenerator({ orders, batches }: { orders: any[], batches: any[] }) {
    const [selectedBatchId, setSelectedBatchId] = useState<string>('all')
    const printRef = useRef<HTMLDivElement>(null)

    const filteredOrders = selectedBatchId === 'all'
        ? orders
        : orders.filter(o => o.po_id === selectedBatchId)

    const handlePrint = () => {
        window.print()
    }

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    const calculateTotal = (order: any) => {
        let total = order.order_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        if (order.deliveries && order.deliveries.length > 0) {
            total += order.deliveries[0].shipping_cost
        }
        return total
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-2xl font-bold text-gray-900">📄 Invoice Generator</h1>
                <div className="flex gap-4">
                    <select
                        className="border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                    >
                        <option value="all">All Batches</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 pointer-events-auto"
                    >
                        <Printer size={18} /> Print Invoices
                    </button>
                </div>
            </div>

            <div ref={printRef} className="space-y-8 print:space-y-0 print:block">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white p-8 rounded-lg shadow-md print:shadow-none print:break-after-page print:p-0 print:border-none border border-gray-200 mb-8 max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">SOURDOUGH STORE</h2>
                            <p className="text-sm text-gray-500">Delicious Homemade Sourdough</p>
                        </div>

                        <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

                        {/* Order Info */}
                        <div className="flex justify-between mb-4 text-sm">
                            <div>
                                <p className="text-gray-600">Invoice:</p>
                                <p className="font-bold">{order.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Date:</p>
                                <p className="font-bold">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="mb-4 text-sm">
                            <p className="text-gray-600">Customer:</p>
                            <p className="font-bold text-lg">{order.customer_name}</p>
                            {order.phone && <p className="text-gray-500">{order.phone}</p>}
                        </div>

                        <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

                        {/* Items */}
                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="pb-2">Item</th>
                                    <th className="pb-2 text-right">Qty</th>
                                    <th className="pb-2 text-right">Price</th>
                                    <th className="pb-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.order_items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="py-1">{item.products?.name}</td>
                                        <td className="py-1 text-right">{item.quantity}</td>
                                        <td className="py-1 text-right">{formatRupiah(item.price)}</td>
                                        <td className="py-1 text-right font-medium">{formatRupiah(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                                {/* Delivery */}
                                {order.deliveries && order.deliveries.length > 0 && (
                                    <tr>
                                        <td className="py-1">Shipping ({order.deliveries[0].courier_name})</td>
                                        <td className="py-1 text-right">1</td>
                                        <td className="py-1 text-right">{formatRupiah(order.deliveries[0].shipping_cost)}</td>
                                        <td className="py-1 text-right font-medium">{formatRupiah(order.deliveries[0].shipping_cost)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

                        {/* Total */}
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total:</span>
                            <span>{formatRupiah(calculateTotal(order))}</span>
                        </div>

                        <div className="mt-8 text-center text-xs text-gray-400">
                            <p>Thank you for your order!</p>
                            <p>Follow us on Instagram @sourdough_store</p>
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center text-gray-500 py-10">No invoices found for this batch.</div>
                )}
            </div>

            <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .no-print {
                display: none !important;
            }
            #invoice-container, #invoice-container * {
              visibility: visible;
            }
            #invoice-container {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>
        </div>
    )
}
