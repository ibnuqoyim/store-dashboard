
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Truck, MapPin, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Delivery = {
    id: string
    courier_name: string
    shipping_cost: number
    address: string
    status: string
    orders: {
        id: string
        invoice_number: string
        customer_name: string
    }
}

export default function DeliveryList({ initialDeliveries }: { initialDeliveries: Delivery[] }) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const updateStatus = async (id: string, newStatus: string) => {
        setIsLoading(id)
        const { error } = await supabase.from('deliveries').update({ status: newStatus }).eq('id', id)
        setIsLoading(null)

        if (error) {
            alert('Error updating status: ' + error.message)
        } else {
            router.refresh()
        }
    }

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'shipped': return 'bg-blue-100 text-blue-800'
            default: return 'bg-yellow-100 text-yellow-800'
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Deliveries</h1>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {initialDeliveries.map((delivery) => (
                            <tr key={delivery.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-blue-600">
                                        <Link href={`/orders/${delivery.orders.id}`} className="flex items-center gap-1 hover:underline">
                                            {delivery.orders.invoice_number} <ExternalLink size={12} />
                                        </Link>
                                    </div>
                                    <div className="text-sm text-gray-500">{delivery.orders.customer_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Truck size={16} className="text-gray-400" />
                                        {delivery.courier_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatRupiah(delivery.shipping_cost)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    <div className="flex items-center gap-2" title={delivery.address}>
                                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{delivery.address || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isLoading === delivery.id ? (
                                        <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                                    ) : (
                                        <select
                                            value={delivery.status}
                                            onChange={(e) => updateStatus(delivery.id, e.target.value)}
                                            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getStatusColor(delivery.status)}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {initialDeliveries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No deliveries found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
